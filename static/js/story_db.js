const MaruHeaders = {
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept': 'text/plain, */*; q=0.01',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Host': 'www.jpmarumaru.com',
  'Origin': 'https://www.jpmarumaru.com',
  'Referer': 'https://www.jpmarumaru.com/tw/toolKanjiFurigana.asp'
}

function RubifiyJapanese(text){
  $.ajax({
    url: "https://www.jpmarumaru.com/tw/api/json_KanjiFurigana.asp",
    headers: MaruHeaders,
    data: `Text=${encodeURIComponent(text)}`,
  });
}