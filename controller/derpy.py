import enum
import _G
import os, json
import controller.game as game
import datamanager as dm
from copy import deepcopy
from datetime import date, datetime, timedelta
from pprint import PrettyPrinter
from _G import log_warning,log_debug,log_error,log_info
from utils import handle_exception
from time import mktime,strptime
import pytz
pp = PrettyPrinter(indent=2)


def init():
  races = load_database()
  _G.DerpySavedRaceContent = races
  for race in races:
    _G.DerpySavedRaceHeader.add(race['id'])

def load_database(cloud=False):
  if cloud:
    dm.load_derpy_db()
  path = f"{_G.STATIC_FILE_DIRECTORY}/{_G.DERPY_WAREHOUSE_CONTENT_PATH}"
  if not os.path.exists(path):
    return []
  ret = []
  with open(path, 'r') as fp:
    ret = json.load(fp)
  return ret

def save_database(dat, upload=True):
  path = f"{_G.STATIC_FILE_DIRECTORY}/{_G.DERPY_WAREHOUSE_CONTENT_PATH}"
  with open(path, 'w') as fp:
    json.dump(dat, fp)
  if upload:
    dm.upload_derpy_db(dat)
  return path

NextRaceCache = None
LastRaceCacheTime = datetime(2020,9,16, tzinfo=pytz.timezone('Asia/Tokyo'))
MaxRaceCacheTime  = timedelta(days=1)
MinRaceCacheTime  = timedelta(minutes=30)
def get_upcoming_race():
  global NextRaceCache,LastRaceCacheTime
  cache_expired = False
  curt = datetime.now(tz=pytz.timezone('Asia/Tokyo'))
  elapsed = curt - LastRaceCacheTime
  if NextRaceCache:
    st = datetime.fromtimestamp(NextRaceCache['timestamp'], tz=pytz.timezone('Asia/Tokyo'))
    ct = datetime.now(tz=pytz.timezone('Asia/Tokyo'))
    cache_expired = True if st - ct < timedelta(0) else False
  elif elapsed > MaxRaceCacheTime or \
      (curt.hour in _G.DerpyUpdateHour and elapsed > MinRaceCacheTime):
    cache_expired = True

  if cache_expired: 
    log_info("Getting next race info")
    LastRaceCacheTime = curt
    res = game.post_request('https://mist-train-east4.azurewebsites.net/api/Casino/Race/GetPaddock')
    if type(res) == int:
      return {_G.KEY_ERRNO: res}
    data = res['r']['data']
    data = interpret_race_data(data)
    data['schedule']['character'] = data['character']
    st = data['raceStartDate'] if 'raceStartDate' in data else data['startTime']
    stime = strptime(st, '%Y-%m-%dT%H:%M:%S')
    data['timestamp'] = datetime(*stime[:6], tzinfo=pytz.timezone('Asia/Tokyo')).timestamp()
    log_info("Next race time:", st, stime, stime[:6], data['timestamp'])
    NextRaceCache = data
  return NextRaceCache

def get_recent_races():
  res = game.get_request('https://mist-train-east4.azurewebsites.net/api/Casino/Race/GetPastSchedules')  
  return res['r']['list']

def save_recent_races():
  log_info("Getting recent races")
  races = get_recent_races()
  for race in races:
    save_race(race)
  log_info("Saving race history")
  save_database(_G.DerpySavedRaceContent)
  log_info("Race history saved")

def sweep_race_replays(begin=0,end=0x7fffffff):
  error = 0
  for i in range(begin,end):
    if error > 3:
      log_warning("Stopping sweeping race due to successive error (>3)")
      break
    try:
      res = game.get_request(f"https://mist-train-east4.azurewebsites.net/api/Casino/Race/GetSchedule/{i}")
      race = res['r']['schedule']
    except (SystemExit,Exception) as err:
      log_error("Error sweeping race:", err)
      error += 1
      continue
    res = save_race(race)
    if not res:
      error += 1
  
def get_race_replay(id):
  res = game.get_request(f"https://mist-train-east4.azurewebsites.net/api/Casino/Race/GetReplay/{id}")
  return json.loads(res['r'])

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

def save_race(race):
  id = race['id']
  if id in _G.DerpySavedRaceHeader:
    log_info(f"Race#{id} already saved, skip")
    return True
  data = interpret_race_data(race)
  try:
    result = get_race_replay(data['id'])['data']
  except (SystemExit,Exception) as err:
    log_error("Error getting race replay:", err)
    return False
  data['result'] = interpret_race_replay(result)
  _G.DerpySavedRaceHeader.add(id)
  _G.DerpySavedRaceContent.append(data)
  log_info(f"Race#{id} data saved")
  return data


RacePreditCache = None
LastPreditId    = 0
def get_next_prediction():
  global RacePreditCache,LastPreditId
  race = get_upcoming_race()
  data = race['schedule'] if 'schedule' in race else race
  id = data['id']
  if id == LastPreditId:
    return RacePreditCache
  
  log_info(f"Make prediction for race#{id}")
  result = []
  for idx,clsifer in enumerate(_G.DERPY_ESTIMATORS):
    x_train = []
    feats = 'all'
    model_name = _G.DERPY_CLOUD_ESTIMATORS[idx]
    if 'noreport' in model_name:
      feats = 'noreport'
    for ch in data['character']:
      ch = deepcopy(ch)
      ch['tactics'] = _G.DERPY_TACTIC_LIST.index(ch['tactics'])
      report_n = 0
      for r in ch['report']:
        report_n += _G.DERPY_UMA_REPORT.index(r)
      ch['report'] = report_n
      ch['speed'] = _G.DERPY_STAT_TABLE[ch['speed']]
      ch['stamina'] = _G.DERPY_STAT_TABLE[ch['stamina']]
      ch['forte'] = _G.DERPY_GROUND_TYPE.index(ch['forte'])
      m_charbase = game.get_character_base(ch['layerId'])
      ch['mCharacterBaseId'] = m_charbase['MCharacterBaseId']
      ch['country'] = _G.DERPY_CHARACTER_COUNTRY.index(m_charbase['MCharacterBase']['Country'])
      features = _G.extract_derpy_features(data, ch, feats)
      x_train.append(features)
    log_info(f"Predicting race with classifier {model_name}")
    result.append(pred_score2rank(model_name, clsifer.predict(x_train)))
  LastPreditId = id
  RacePreditCache = result
  return result

def pred_score2rank(model_name, scores):
  ModelScoreProc = {
    f'rfr_fit_order_False-feats_all.mod': rfr_time_scorerank,
    f'rfr_fit_order_True-feats_all.mod': rfr_ord_scorerank,
    f'rfc_fit_order_True-feats_all.mod': rfc_ord_scorerank,
    f'knn_fit_order_True-feats_all.mod': rfc_ord_scorerank,
    f'rfr_fit_order_False-feats_noreport.mod': rfr_time_scorerank,
    f'rfr_fit_order_True-feats_noreport.mod': rfr_ord_scorerank,
    f'rfc_fit_order_True-feats_noreport.mod': rfc_ord_scorerank,
    f'knn_fit_order_True-feats_noreport.mod': rfc_ord_scorerank,
  }
  proc = ModelScoreProc[model_name]
  return [int(proc(i,scores)[1]) for i,s in enumerate(scores)]

# 0=score 1=rank
def rfr_time_scorerank(i, scores):
  order = sorted(scores, reverse=True)
  return ( int(scores[i]), next((n+1 for n,v in enumerate(order) if v == scores[i]), 0) )

def rfr_ord_scorerank(i, scores):
  order = sorted(scores)
  return ( "{:.3f}".format(scores[i]), next((n+1 for n,v in enumerate(order) if v == scores[i]), 0) )

def rfc_ord_scorerank(i, scores):
  return (scores[i], scores[i])