const { collectFeeds, FEEDS } = require('./collect-feeds.cjs');
const { dailyFeeds, sourcePolicy, publisherGroup } = require('./news-source-policy.cjs');
const { relevantNews } = require('./news-relevance.cjs');
const { publicationTime } = require('./rss-metadata.cjs');
const { selectSources } = require('./select-sources.cjs');
const { extractRssEvidence, sourceTextForRelevance } = require('./news-evidence.cjs');
const { fetchFeed } = require('./feed-transport.cjs');
const HOUR = 3600000, MAX_RECORDS = 500, MAX_BYTES = 1048576;
const slot = instant => new Date(Math.floor(instant.getTime() / HOUR) * HOUR).toISOString().slice(0, 13).replace('T', '-');
const key = instant => `evidence/rss-hour-${slot(instant)}.json`;
const utc = value => new Date(Math.floor(value / 1000) * 1000).toISOString().replace('.000Z', 'Z');
function validSnapshot(value, expectedSlot, instant) {
  if (!value || Object.keys(value).sort().join(',') !== 'capturedAt,complete,feeds,records,schemaVersion,slot' || value.schemaVersion !== 1 || value.slot !== expectedSlot ||
      typeof value.capturedAt !== 'string' || !Number.isFinite(Date.parse(value.capturedAt)) ||
      slot(new Date(value.capturedAt)) !== expectedSlot || Date.parse(value.capturedAt) > instant.getTime() ||
      typeof value.complete !== 'boolean' || !Array.isArray(value.records) || value.records.length > MAX_RECORDS ||
      !Array.isArray(value.feeds) || !value.feeds.length || value.feeds.length > dailyFeeds.length ||
      [...value.feeds,...value.records].some(item=>!item || typeof item!=='object' || Array.isArray(item)) ||
      Buffer.byteLength(JSON.stringify(value)) > MAX_BYTES) return false;
  let previousFeed = -1;
  const presentFeeds = new Set();
  for (const feed of value.feeds) {
    const index = dailyFeeds.indexOf(feed.id);
    if (index <= previousFeed || feed.url !== FEEDS[feed.id]?.url || !['ok','failed'].includes(feed.status) ||
        !Number.isInteger(feed.itemCount) || feed.itemCount < 0 || feed.itemCount > 200 ||
        (feed.status === 'ok' ? feed.error !== null : feed.itemCount !== 0 || !['feed_timeout','feed_dns_rejected','feed_network_error','feed_response_rejected','feed_size_limit','feed_request_rejected','feed_retrieval_failed','invalid_or_oversized_rss','collection_record_limit'].includes(feed.error)) ||
        value.records.filter(record => record.feedId === feed.id).length !== feed.itemCount) return false;
    previousFeed = index;presentFeeds.add(feed.id);
  }
  if (value.complete !== value.feeds.every(feed => feed.status === 'ok')) return false;
  for (const record of value.records) {
    const feed = FEEDS[record.feedId];
    if (!feed || !presentFeeds.has(record.feedId) || !Number.isInteger(record.itemIndex) || record.itemIndex < 0 || record.itemIndex >= 200 ||
        !Object.keys(record).every(k => ['feedId','itemIndex','title','url','publicationDatesRaw','publishedAt','description','creator'].includes(k)) ||
        !['title','url','publicationDatesRaw','publishedAt'].every(k => Object.hasOwn(record,k)) ||
        !['title','url','description','creator'].every(k => !Object.hasOwn(record,k) || record[k] === null ||
          (typeof record[k] === 'string' && record[k].length <= ({title:500,url:4096,description:10000,creator:160})[k])) ||
        !Array.isArray(record.publicationDatesRaw) || record.publicationDatesRaw.length > 200 ||
        record.publicationDatesRaw.some(date => typeof date !== 'string' || date.length > 100)) return false;
    const parsed = record.publicationDatesRaw.length === 1 ? publicationTime(record.publicationDatesRaw[0], {
      allowFullMonthNames: feed.fullMonthNames === true, localDateOffsetMinutes: feed.localDateOffsetMinutes }) : null;
    if (parsed !== record.publishedAt) return false;
  }
  return true;
}
async function saveSnapshot(state, report, instant) {
  const value = { schemaVersion: 1, slot: slot(instant), capturedAt: instant.toISOString(), complete: report.complete,
    feeds: report.feeds, records: report.records };
  if (!validSnapshot(value,value.slot,instant)) throw new Error('invalid_rss_snapshot');
  try { await state.write(key(instant),value); return {status:'saved',slot:value.slot}; }
  catch (error) { if (error.message === 'state_already_exists') return {status:'already_captured',slot:value.slot}; throw error; }
}
async function captureRss({ state, instant = new Date(), collect = collectFeeds } = {}) {
  const existing = await state.read(key(instant), {timeoutMs:3000});
  if (existing) {
    if (!validSnapshot(existing.value,slot(instant),instant)) throw new Error('invalid_rss_snapshot');
    return {status:'already_captured',modelCalls:0,slot:slot(instant)};
  }
  const report = (await collect({schemaVersion:1,window:{start:utc(instant.getTime()-86400000),end:utc(instant.getTime()+1000)},feeds:dailyFeeds},
    {now:()=>instant,concurrency:4,fetch:url=>fetchFeed(url,{timeoutMs:8000})})).report;
  if (!report) throw new Error('incomplete_collection');
  const result = await saveSnapshot(state,report,instant);
  return {...result,status:result.status==='already_captured'?'already_captured':report.complete?'rss_captured':'rss_capture_incomplete',modelCalls:0,records:report.records.length,
    failedFeeds:report.feeds.filter(feed=>feed.status==='failed').map(feed=>feed.id)};
}
function snapshotHours(window, instant) {
  const start=Date.parse(window.start),end=Date.parse(window.end);
  if (!Number.isFinite(start) || end-start !== 86400000 || start % HOUR !== 0) throw new Error('invalid_archive_window');
  const hours=[];
  for(let i=0;i<32 && start+i*HOUR <= instant.getTime();i++) hours.push(new Date(start+i*HOUR));
  return hours;
}
function mergeRecords(report, snapshots, window) {
  const byUrl = new Map(), dates = new Map(), conflicts = new Set();
  const audit={liveRecords:report.records.length,archiveRecords:snapshots.reduce((n,s)=>n+s.records.length,0),
    rejectedPolicy:0,invalidEvidence:0,conflictingUrls:0,outsideWindow:0,invalidDates:0,scopeRejected:0,mergedRecords:0,publishers:{}};
  for(const record of [...snapshots.flatMap(snapshot=>snapshot.records),...report.records]) {
    if(!sourcePolicy(record)){audit.rejectedPolicy++;continue;}
    if(dates.has(record.url) && dates.get(record.url) !== record.publishedAt) conflicts.add(record.url);
    dates.set(record.url,record.publishedAt);
    try{extractRssEvidence(record);}catch{audit.invalidEvidence++;continue;}
    byUrl.set(record.url,record);
  }
  const records=[];
  for(const [url,record]of byUrl){
    const policy=sourcePolicy(record);
    const publisher=audit.publishers[publisherGroup(record)] ||= {uniqueObserved:0,dateAccepted:0,relevanceMatched:0,conflictingUrls:0};
    publisher.uniqueObserved++;
    if(conflicts.has(url)){audit.conflictingUrls++;publisher.conflictingUrls++;continue;}
    const time=Date.parse(record.publishedAt);
    if(!Number.isFinite(time)){audit.invalidDates++;continue;}
    if(time<Date.parse(window.start)||time>=Date.parse(window.end)){audit.outsideWindow++;continue;}
    publisher.dateAccepted++;
    const evidence = sourceTextForRelevance(extractRssEvidence(record));
    if(!relevantNews(evidence)){audit.scopeRejected++;continue;}
    publisher.relevanceMatched++;
    records.push(record);
  }
  if(records.length>MAX_RECORDS)throw new Error('archive_record_limit');
  audit.mergedRecords=records.length;
  const selected=selectSources({schemaVersion:1,window,allowedHosts:[...new Set(dailyFeeds.flatMap(id=>FEEDS[id].allowedHosts))],
    trackingParameters:[],articles:records.map(({url,publishedAt})=>({url,publishedAt}))});
  if(!selected.valid)throw new Error('invalid_rss_snapshot');
  return {report:{...report,records,selection:selected.selection},audit};
}
async function collectArchived(input,{state,instant=new Date(),collect=collectFeeds,retainLive=true}={}) {
  const live=await collect(input,{concurrency:4,fetch:url=>fetchFeed(url,{timeoutMs:8000})});
  if(!live.valid || !live.report?.complete)return live;
  if(JSON.stringify(live.report.feeds?.map(feed=>feed.id))!==JSON.stringify(input.feeds))throw new Error('incomplete_collection');
  // The morning observation also preserves newly arriving current-day RSS for tomorrow.
  const saved=retainLive?await saveSnapshot(state,live.report,instant):{status:'trial_read_only'};
  const hours=snapshotHours(input.window,instant),snapshots=[],coverage={expected:hours.length,present:0,missing:[],failedReads:[],incomplete:[],missingFeeds:[],saved};
  for(let i=0;i<hours.length;i+=4){
    const results=await Promise.all(hours.slice(i,i+4).map(async hour=>{
      try{return {hour,object:await state.read(key(hour),{timeoutMs:3000})};}catch(error){if(error instanceof SyntaxError || error.message==='response_size_limit')throw new Error('invalid_rss_snapshot');return {hour,error:true};}
    }));
    for(const {hour,object,error}of results){
      if(error){coverage.failedReads.push(slot(hour));continue;}
      if(!object){coverage.missing.push(slot(hour));continue;}
      if(!validSnapshot(object.value,slot(hour),instant))throw new Error('invalid_rss_snapshot');
      const absent=dailyFeeds.filter(id=>!object.value.feeds.some(feed=>feed.id===id));
      if(absent.length)coverage.missingFeeds.push({slot:slot(hour),feeds:absent});
      coverage.present++;if(!object.value.complete)coverage.incomplete.push(slot(hour));snapshots.push(object.value);
    }
  }
  const merged=mergeRecords(live.report,snapshots,input.window);
  merged.report.archive={...coverage,...merged.audit,coverageComplete:coverage.missing.length===0 && coverage.failedReads.length===0 && coverage.incomplete.length===0 && coverage.missingFeeds.length===0};
  return {...live,report:merged.report};
}
function runtimeMode(args,instant=new Date()) {
  if(args.length===1&&args[0]==='--capture-rss')return 'capture';
  if(args.length===1&&args[0]==='--scheduled'){
    const local=new Date(instant.getTime()+7*HOUR);
    return local.getUTCHours()===7&&local.getUTCMinutes()>=30?'daily':'capture';
  }
  return 'explicit';
}
module.exports={slot,key,validSnapshot,saveSnapshot,captureRss,snapshotHours,mergeRecords,collectArchived,runtimeMode};
