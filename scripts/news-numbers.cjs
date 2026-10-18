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
function numericFacts(text, locale = 'en') {
  // Match ordinal day counts only in explicit day contexts; avoid seconds/time units.
  const dayOrdinals=locale==='id-ID'?['pertama','kedua','ketiga','keempat','kelima','keenam','ketujuh','kedelapan','kesembilan','kesepuluh']:['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth'];
  for(const [i,word]of dayOrdinals.entries())text=text.replace(new RegExp(locale==='id-ID'?`\\bhari\\s+${word}\\b`:`\\b${word}\\s+day\\b`,'gi'),`${i+1} day`);
  // Clock punctuation is distinct from Indonesian decimal/thousands punctuation.
  text = text.replace(locale === 'id-ID' ? /\bpukul\s+(\d{1,2})[.:](\d{2})\b/gi : /\b(\d{1,2}):(\d{2})\b/g,
    (_, hour, minute) => `${hour}${minute === '00' ? '' : ' ' + minute}`);
  text = text.replace(/(\d{1,2})時(?:(\d{1,2})分)?/g, (_, hour, minute) => `${hour}${minute && minute !== '00' && minute !== '0' ? ' ' + minute : ''}`);
  for (const [index, word] of [...(words[locale] || words.en).entries()].sort((a,b) => b[1].length - a[1].length))
    text = text.replace(new RegExp(`(?<![\\w-])${word}(?![\\w-]|\\s+Data\\b)`, 'gi'), String(index));
  for (const [index, month] of (months[locale] || months.en).entries())
    text = text.replace(new RegExp(`\\b${month}\\b(?=\\s+\\d)|(?<=\\d[–—\\-\\d ]{0,12})\\b${month}\\b`, 'gi'), String(index + 1) + ' ');
  text = canonicalNumbers(text, locale);
  text = text.replace(/(\d+(?:\.\d+)?)\s+(million|billion|juta|miliar)\b/gi,
    (_, number, unit) => scale(number, /^(billion|miliar)$/i.test(unit) ? 9 : 6));
  text = text.replace(/(?:\d+(?:\.\d+)?[億万])+\d*/g, expression => {
    const parts = [...expression.matchAll(/(\d+(?:\.\d+)?)(億|万)?/g)];
    let last = Infinity, sum = 0n;
    for (const [, number, unit] of parts) {
      const power = unit === '億' ? 8 : unit === '万' ? 4 : 0;
      if (power >= last) throw new Error('unsupported_number');
      const value = scale(number, power);
      if (value.includes('.')) throw new Error('unsupported_number');
      sum += BigInt(value); last = power;
    }
    return sum.toString();
  });
  // A per-gram quote explicitly denotes a denominator of one gram.
  text = text.replace(/\bper\s+gram\b|\/\s*gr\b/gi, ' 1 gram ');
  const numbers = (text.match(/\d+(?:[.,]\d+)*/g) || []).map(number => {
    if (!/^\d+(?:\.\d+)?$/.test(number)) return number;
    const [whole, fraction = ''] = number.split('.');
    const decimals = fraction.replace(/0+$/, '');
    return BigInt(whole).toString() + (decimals ? '.' + decimals : '');
  });
  return [...new Set(numbers)].sort();
}
module.exports = { canonicalNumbers, numericFacts };
