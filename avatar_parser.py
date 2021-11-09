import _G
import xmltodict
import json
from ast import literal_eval
from pprint import pprint as pp

def xmlquote_to_tuple(expr):
  return literal_eval(expr.replace('{','(').replace('}',')'))

def parse_xmldict(xml):
  return {
    'aliases': xml['array'] or [],
    'spriteOffset': xmlquote_to_tuple(xml['string'][0]),
    'spriteSize': xmlquote_to_tuple(xml['string'][1]),
    'spriteSourceSize': xmlquote_to_tuple(xml['string'][2]),
    'textureRect': xmlquote_to_tuple(xml['string'][3]),
    'textureRotated': True if 'true' in xml else False,
  }

result = {}

with open(f"{_G.DCTmpFolder}/character-1.xml", 'r') as fp:
  raw = fp.read()

data = xmltodict.parse(raw)

img_size = data['plist']['dict']['dict'][1]['string'][2].replace('{','').replace('}','').split(',')
result['metadata'] = {
  'width': int(img_size[0]),
  'height': int(img_size[1]),
  'uw': _G.CHARACTER_AVATAR_SRC_SIZE[0],
  'uh': _G.CHARACTER_AVATAR_SRC_SIZE[1]
}
result['frames'] = {}
for idx,key in enumerate(data['plist']['dict']['dict'][0]['key']):
  result['frames'][key] = parse_xmldict(data['plist']['dict']['dict'][0]['dict'][idx])

with open('charavatar-clipinfo.json', 'w') as fp:
  json.dump(result, fp, indent=2)