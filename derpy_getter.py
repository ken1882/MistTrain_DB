import requests
import sys
import json
from copy import deepcopy
import _G
import controller.game as game

Session = requests.Session()
Session.headers['Accept'] = 'application/json'
Session.headers['Content-Type'] = 'application/json'
Session.headers['Accept-Encoding'] = 'gzip, deflate, br'
Session.headers['Authorization'] = (next((arg.strip() for arg in sys.argv if arg.strip().startswith('Bearer')), ''))

CharacterDatabase = {}

def sweep_race_replays():
  global Session
  error = 0
  ret = []
  for i in range(0x7fffffff):
    if error > 3:
      print("Stopping sweeping race due to successive error (>3)")
      break
    try:
      res = Session.get(f"https://mist-train-east4.azurewebsites.net/api/Casino/Race/GetSchedule/{i}")
      race = res.json()['r']['schedule']
    except (SystemExit,Exception) as err:
      print("Error sweeping race:", err)
      error += 1
      continue
    error = 0
    data = interpret_race_data(race)
    try:
      result = get_race_replay(data['id'])['data']
    except (SystemExit,Exception) as err:
      print("Error getting race replay:", err)
      error += 1
      continue
    data['result'] = interpret_race_replay(result)
    ret.append(data)
    print(f"Race#{race['id']} data saved")
  return ret
  
def get_race_replay(id):
  global Session
  res = Session.get(f"https://mist-train-east4.azurewebsites.net/api/Casino/Race/GetReplay/{id}")
  return json.loads(res.json()['r'])

def interpret_race_data(race):
  obj = deepcopy(race)
  for i,char in enumerate(race['character']):
    char['condition'] = char['condition'].replace("\n",'')
    obj['character'][i]['condition'] = next((i for i, cond in enumerate(_G.DERPY_CONDITION_LIST) if cond in char['condition']), 0)
    obj['character'][i]['name'] = game.get_character_name(char['layerId'])
    obj['character'][i]['forte'] = _G.DERPY_GROUND_TYPE[char['forte']]
  return obj

def interpret_race_replay(data):
  ret = []
  times = []
  for character in data:
    obj = {
      'characterId': character['characterId'],
      'condition': character['condition'],
      'time': 0,
      'rank': 0,
    }
    for _,phase in character['actions'].items():
      for act in phase:
        obj['time'] += act['duration']
    times.append(obj['time'])
    ret.append(obj)
  times = sorted(times)
  for obj in ret:
    obj['rank'] = next((i+1 for i,t in enumerate(times) if t == obj['time']), 0)
  return ret

if __name__ == '__main__':
  data = sweep_race_replays()
  with open('static/'+_G.DERPY_WAREHOUSE_CONTENT_PATH, 'w') as fp:
    json.dump(data, fp, indent=2)