from glob import glob
import requests
import urllib.parse
import json
import controller.game as game
import unicodedata
from time import sleep
from bs4 import BeautifulSoup as BS
from copy import copy

LINE_CORRECTIONS = (
  (
    '<span class="morpheme"><ruby>幻<rp>(</rp><rt>まぼろし</rt><rp>)</rp></ruby></span><span class="morpheme"><ruby>霧<rp>(</rp><rt>ぎり</rt><rp>)</rp></ruby></span>',
    '<span class="morpheme"><ruby>幻霧<rp>(</rp><rt>げんむ</rt><rp>)</rp></ruby></span>',
  ),
)

LinewrapSymbol = '＊'
CommonTitleCache = {}
ErrorFiles = set()
###

IgnorePhrase = [
  'ーーーー',
  '！！！！！！'
]

def clean_ruby_html(html_node):
  for tag in html_node.find_all(True):
    for k in copy(tag.attrs):
      del tag.attrs[k]
  allowed_tags = {'ruby', 'rt', 'rp', 'div', 'span', 'br'}
  for tag in html_node.find_all(True):
    if tag.name not in allowed_tags:
      tag.unwrap()
  return str(next(html_node.children)) # exclude outer container

def rubifiy_japanese(text, fname='', depth=0, agent=None, token=None):
  ret = {
    'html': f"<div>{text}</div>",
    'agent': agent,
    'token': token
  }
  if text in IgnorePhrase:
    return ret
  if not agent or not token:
    agent = requests.Session()
    r = agent.get('https://www.jcinfo.net/zh-hant/tools/kana')
    page = BS(r.content, 'html.parser')
    token = page.find('input', {'name': '_token'})['value']
  res = agent.post('https://www.jcinfo.net/zh-hant/tools/kana', {'_token': token, 'text': text})
  try:
    res_page = BS(res.content, 'html.parser')
    ret['agent'] = agent
    ret['html']  = clean_ruby_html(res_page.find('div', {'class': '_result-ruby'}) or '')
    ret['token'] = res_page.find('input', {'name': '_token'})['value']
    if '<div>error</div>' in ret['html']:
      raise RuntimeError("Remote server returned error")
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
  return ret

def rubify_line(text, fname='', agent=None, token=None):
  global LINE_CORRECTIONS
  ret = rubifiy_japanese(text, fname=fname, agent=agent, token=token)
  for pair in LINE_CORRECTIONS:
    ret['html'] = ret['html'].replace(pair[0], pair[1])
  return ret

def rubifiy_file(file, verbose=False):
  global LinewrapSymbol
  with open(file, 'r') as fp:
    data = json.load(fp)
    if 'r' in data:
      data = data['r']
  if type(data) == list:
    data = data[0]
  id = data['MSceneId']
  dialogs = sorted(data['MSceneDetailViewModel'], key=lambda x:x['GroupOrder']+x['ViewOrder']*0.01)
  agent, token = None, None
  for i,dia in enumerate(dialogs):
    # text = unicodedata.normalize('NFKD', dia['Phrase'])
    text = dia['Phrase'].replace('\u3000', '')
    text = text.replace('\\n', LinewrapSymbol)
    text = text.replace('\r', LinewrapSymbol)
    text = text.replace('"',  "'")
    rdat = rubify_line(text, file, agent, token)
    agent = rdat['agent']
    token = rdat['token']
    if verbose:
      print(rdat['html'])
    dialogs[i]['Ruby'] = rdat['html']
  data['MSceneDetailViewModel'] = dialogs
  # Title
  t = game.SceneDatabase[id]['Title']
  if t in CommonTitleCache:
    data['Title'] = CommonTitleCache[t]
  else:
    rdat2 = rubify_line(t, file, agent, token)
    data['Title'] = rdat2['html']
    agent = rdat['agent']
    token = rdat['token']
    CommonTitleCache[t] = data['Title']
  return data
