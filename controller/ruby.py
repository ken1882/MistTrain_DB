from glob import glob
import requests
import urllib.parse
import json
import controller.game as game
from time import sleep

MaruHeaders = {
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept': 'text/plain, */*; q=0.01',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Host': 'www.jpmarumaru.com',
  'Origin': 'https://www.jpmarumaru.com',
  'Referer': 'https://www.jpmarumaru.com/tw/toolKanjiFurigana.asp'
}

LinewrapSymbol = '＊'
CommonTitleCache = {}
ErrorFiles = set()
###

IgnorePhrase = [
  'ーーーー',
  '！！！！！！'
]

def rubifiy_japanese(text, fname='', depth=0):
  if text in IgnorePhrase:
    return f"<div>{text}</div>"
  res = requests.post(
    "https://www.jpmarumaru.com/tw/api/json_KanjiFurigana.asp",
    'Text='+urllib.parse.quote_plus(text),
    headers=MaruHeaders
  )
  ret = text
  try:
    ret = res.content.decode()
    if ret == '<div>500</div>':
      raise RuntimeError('Server responded with 500')
  except Exception as err:
    print("An error occurred during rubifiy phrase:", err, 'original text:', text, sep='\n')
    if fname:
      print('File:', fname)
    if depth < 5:
      print('Retry after 3 seconds, depth=', depth+1, sep='')
      sleep(3)
      return rubifiy_japanese(text, fname, depth+1)
    else:
      print("Payload:", urllib.parse.quote_plus(text), sep='\n')
      print("Response:", res.content, sep='\n')
      ErrorFiles.add(fname)
  return f"<div>{ret}</div>"

def rubifiy_file(file, verbose=False):
  with open(file, 'r') as fp:
    data = json.load(fp)
    if 'r' in data:
      data = data['r']
  if type(data) == list:
    data = data[0]
  id = data['MSceneId']
  dialogs = sorted(data['MSceneDetailViewModel'], key=lambda x:x['GroupOrder']+x['ViewOrder']*0.01)
  for i,dia in enumerate(dialogs):
    text = dia['Phrase']
    text = text.replace('\\n', LinewrapSymbol)
    text = text.replace('\u3000', '')
    text = text.replace('\r',  LinewrapSymbol)
    ruby = rubifiy_japanese(text, file)
    correction = (
      (
        '<ruby><rb>一</rb><rt>いち</rt></ruby><ruby><rb>人</rb><rt>にん</rt></ruby>',
        '<ruby><rb>一人</rb><rt>ひとり</rt></ruby>',
      ),
      (
        '<ruby><rb>二</rb><rt>に</rt></ruby><ruby><rb>人</rb><rt>にん</rt></ruby>',
        '<ruby><rb>二人</rb><rt>ふたり</rt></ruby>',
      ),
      (
        '<ruby><rb>幻</rb><rt>まぼろし</rt></ruby><ruby><rb>霧</rb><rt>きり</rt></ruby>',
        '<ruby><rb>幻</rb><rt>げん</rt></ruby><ruby><rb>霧</rb><rt>む</rt></ruby>',
      )
    )
    for pair in correction:
      ruby = ruby.replace(pair[0], pair[1])
    if verbose:
      print(ruby)
    dialogs[i]['Ruby'] = ruby
  data['MSceneDetailViewModel'] = dialogs
  # Title
  t = game.SceneDatabase[id]['Title']
  if t in CommonTitleCache:
    data['Title'] = CommonTitleCache[t]
  else:
    data['Title'] = rubifiy_japanese(t, file)
    CommonTitleCache[t] = data['Title']
  return data
