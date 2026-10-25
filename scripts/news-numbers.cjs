function canonicalNumbers(text, locale = 'en') {
  return text.replace(/\d+(?:[.,]\d+)*/g, number => {
    if (locale === 'id-ID') {
      if (/^[1-9]\d{0,2}(?:\.\d{3})+(?:,\d+)?$/.test(number)) return number.replace(/\./g, '').replace(',', '.');
      if (/^\d+,\d+$/.test(number)) return number.replace(',', '.');
    } else if (/^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(number)) return number.replace(/,/g, '');
    return number;
  });
}
const words = {
  en: ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'],
  'id-ID': ['nol','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas','dua belas','tiga belas','empat belas','lima belas','enam belas','tujuh belas','delapan belas','sembilan belas']
};
const months = {
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  'id-ID': ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
};
function scale(value, power) {
  const [whole, fraction = ''] = value.split('.');
  const places = power - fraction.length;
  const digits = BigInt(whole + fraction).toString();
  if (places >= 0) return digits + '0'.repeat(places);
  return (digits.padStart(-places + 1, '0').slice(0, places) + '.' + digits.padStart(-places + 1, '0').slice(places));
}
function numericFacts(text, locale = 'en', { milestones = false } = {}) {
  // Match ordinals in explicit day, ranking or medal contexts; avoid time units and "both".
  const dayOrdinals=locale==='id-ID'?['pertama','kedua','ketiga','keempat','kelima','keenam','ketujuh','kedelapan','kesembilan','kesepuluh']:['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth'];
  for(const [i,word]of dayOrdinals.entries())text=text.replace(new RegExp(locale==='id-ID'?`\\b(?:hari|posisi|peringkat|urutan|emas|perak|perunggu|medali)\\s+${word}\\b`:`\\b${word}\\s+(?:day|place|position)\\b`,'gi'),`${i+1} day`);
  if (milestones) {
    // Institutional milestone ordinals are numeric; first aid/class and time units are not.
    for (const [i, word] of dayOrdinals.entries())
      if (locale !== 'id-ID') text = text.replace(new RegExp(`\\b${word}(?=\\s+(?:(?:national|semiconductor|digital|industrial|economic|security)\\s+){0,3}(?:strategy|policy|plan)\\b)`, 'gi'), String(i + 1));
    text = text.replace(/初(?=の(?:国家|半導体|デジタル|産業|経済|安全保障){0,3}(?:戦略|政策|計画))/g, '1');
  }
  text=text.replace(/(?<![\w-])runner[- ]up(?![\w-])/gi,' 2 ');
  // Clock punctuation is distinct from Indonesian decimal/thousands punctuation.
  text = text.replace(locale === 'id-ID' ? /\bpukul\s+(\d{1,2})[.:](\d{2})\b/gi : /\b(\d{1,2}):(\d{2})\b/g,
    (_, hour, minute) => `${hour}${minute === '00' ? '' : ' ' + minute}`);
  text = text.replace(/(\d{1,2})時(?:(\d{1,2})分)?/g, (_, hour, minute) => `${hour}${minute && minute !== '00' && minute !== '0' ? ' ' + minute : ''}`);
  for (const [index, word] of [...(words[locale] || words.en).entries()].sort((a,b) => b[1].length - a[1].length))
    text = text.replace(new RegExp(`(?<![\\w-])${word}(?![\\w-]|\\s+Data\\b)`, 'gi'), String(index));
  for (const [index, month] of (months[locale] || months.en).entries()) {
    // May and March can be ordinary English verbs, so retain explicit date contexts.
    const ambiguous = locale !== 'id-ID' && ['May', 'March'].includes(month);
    const pattern = ambiguous
      ? `\\b${month}\\b(?=\\s+\\d)|(?<=\\d[–—\\-\\d ]{0,12})\\b${month}\\b|(?<=\\b(?:in|during|by|this|next|last)\\s+)\\b${month}\\b`
      : `\\b${month}\\b`;
    text = text.replace(new RegExp(pattern, 'gi'), String(index + 1) + ' ');
  }
  text = canonicalNumbers(text, locale);
  text = text.replace(/(\d+(?:\.\d+)?)\s+(million|billion|trillion|juta|miliar|triliun)\b/gi,
    (_, number, unit) => scale(number, /^(trillion|triliun)$/i.test(unit) ? 12 : /^(billion|miliar)$/i.test(unit) ? 9 : 6));
  text = text.replace(/(?:\d+(?:\.\d+)?[兆億万])+\d*/g, expression => {
    const parts = [...expression.matchAll(/(\d+(?:\.\d+)?)(兆|億|万)?/g)];
    let last = Infinity, sum = 0n;
    for (const [, number, unit] of parts) {
      const power = unit === '兆' ? 12 : unit === '億' ? 8 : unit === '万' ? 4 : 0;
      if (power >= last) throw new Error('unsupported_number');
      const value = scale(number, power);
      if (value.includes('.')) throw new Error('unsupported_number');
      sum += BigInt(value); last = power;
    }
    return sum.toString();
  });
  // A per-gram quote explicitly denotes a denominator of one gram.
  text = text.replace(/\bper\s+gram\b|\/\s*gr\b/gi, ' 1 gram ');
  // Explicit exchange-rate quotations use a denominator of one US dollar.
  text = text.replace(locale === 'id-ID' ? /\b(?:per|terhadap)\s+dolar\s+AS\b/gi : /\bper\s+US\s+dollar\b/gi, ' 1 USD ');
  const numbers = (text.match(/\d+(?:[.,]\d+)*/g) || []).map(number => {
    if (!/^\d+(?:\.\d+)?$/.test(number)) return number;
    const [whole, fraction = ''] = number.split('.');
    const decimals = fraction.replace(/0+$/, '');
    return BigInt(whole).toString() + (decimals ? '.' + decimals : '');
  });
  return [...new Set(numbers)].sort();
}
module.exports = { canonicalNumbers, numericFacts };
