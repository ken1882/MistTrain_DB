import enum
import _G
import os, json
import controller.game as game
import datamanager as dm
from flask import render_template
from copy import deepcopy
from datetime import date, datetime, timedelta
from pprint import PrettyPrinter
from _G import log_warning,log_debug,log_error,log_info
from time import mktime,strptime
import utils
import pytz
from threading import Thread
pp = PrettyPrinter(indent=2)

IsDerpyReady = False
IsDerpyInitCalled = False

def init():
  global IsDerpyReady,IsDerpyInitCalled
  IsDerpyInitCalled = True
  races = load_database()
  _G.DerpySavedRaceContent = races
  for k,month_races in races.items():
    for race in month_races:
      _G.DerpySavedRaceHeader.add(race['id']) 
  dm.load_derpy_estimators()
  IsDerpyReady = True
  save_recent_races()

def req_derpy_ready(func):
  def wrapper(*args, **kwargs):
    global IsDerpyReady,IsDerpyInitCalled
    if not IsDerpyInitCalled:
      IsDerpyInitCalled = True
      th = Thread(target=init)
      th.start()
    if not IsDerpyReady:
      return render_template('notready.html',
        navbar_content=utils.load_navbar(),
      )
    return func(*args, **kwargs)
  wrapper.__name__ = func.__name__
  return wrapper

def load_database():
  files = dm.load_all_derpy_db()
  ret = {}
  keys = list(_G.LoopDerpyYMPair())
  for i,path in enumerate(files):
    key = "{:d}-{:02d}".format(keys[i][0], keys[i][1])
    if os.path.exists(path):
      with open(path, 'r') as fp:
        ret[key] = json.load(fp)
    else:
      ret[key] = []
  return ret

def save_database(dat, y, m, upload=True):
  log_info(f"Saving race data of {y}/{m}")
  fname = _G.MakeDerpyFilenamePair(y, m)
  path = f"{_G.STATIC_FILE_DIRECTORY}/{fname[0]}"
  with open(path, 'w') as fp:
    json.dump(dat, fp)
  if upload:
    dm.upload_derpy_db(dat, y, m)
  return path

def get_race_odds(id):
  res = game.get_request(f"/api/Casino/Race/GetOdds/{id}")
  return json.loads(res['r'])['data']

def get_upcoming_race():
  cache_expired = False
  curt = datetime.now(tz=pytz.timezone('Asia/Tokyo'))
  elapsed = curt - _G.GetCacheTimestamp('LastRaceCacheTime')
  cache = _G.GetCacheBinary('NextRaceCache.bin')
  data = cache
  if cache:
    st = datetime.fromtimestamp(cache['timestamp'], tz=pytz.timezone('Asia/Tokyo'))
    ct = datetime.now(tz=pytz.timezone('Asia/Tokyo'))
    if st - ct < timedelta(0):
      cache_expired = True
      log_debug("Cache expired due to new race")
  elif elapsed > _G.MaxRaceCacheTime or \
      (curt.hour in _G.DerpyUpdateHour and elapsed > _G.MinRaceCacheTime):
    cache_expired = True
    log_debug("Cache expired due to ttl")

  if cache_expired: 
    log_info("Getting next race info")
    res = game.post_request('/api/Casino/Race/GetPaddock')
    if type(res) == int:
      return {_G.KEY_ERRNO: res}
    data = res['r']['data']
    data = interpret_race_data(data)
    data['schedule']['character'] = data['character']
    data['odds'] = get_race_odds(data['schedule']['id'])
    st = data['raceStartDate'] if 'raceStartDate' in data else data['startTime']
    stime = strptime(st, '%Y-%m-%dT%H:%M:%S')
    data['timestamp'] = datetime(*stime[:6], tzinfo=pytz.timezone('Asia/Tokyo')).timestamp()
    log_info("Next race time:", st, stime, stime[:6], data['timestamp'])
    _G.SetCacheTimestamp('LastRaceCacheTime', curt)
    _G.SetCacheBinary('NextRaceCache.bin', data)
  return data

def get_recent_races():
  res = game.get_request('/api/Casino/Race/GetPastSchedules')  
  return res['r']['list']

def save_recent_races():
  log_info("Getting recent races")
  races = get_recent_races()
  updated_month = set()
  for race in races:
    save_race(race)
    st = race['startTime'].split('T')[0].split('-')
    updated_month.add(int(st[0]) * 100 + int(st[1]))
  save_race_history(updated_month)

def save_race_history(updated_month=[]):
  '''
  Save `G.DerpySavedRaceContent` to database.

  Argument: `updated_month` is set/list of month that need to update, \n
  if givem, only that month will be save/update to databse. \n
  the elements are calculated hash of `year*100 + month`
  '''
  log_info("Saving race history")
  for ym,month_races in _G.DerpySavedRaceContent.items():
    y,m = ym.split('-')
    y = int(y)
    m = int(m)
    if updated_month and (y*100 + m) not in updated_month:
      continue
    save_database(month_races, y, m)
  log_info("Race history saved")

def update_race_history_db():
  max_scan_time  = timedelta(days=1)
  min_scan_time  = timedelta(minutes=30)
  curt = datetime.now(tz=pytz.timezone('Asia/Tokyo'))
  last_scan_time = _G.GetCacheTimestamp('LastRaceHistoryScanTime')
  elapsed = curt - last_scan_time
  #log_debug("Cache timestamps:", curt, elapsed, last_scan_time)
  if elapsed > max_scan_time or \
      (curt.hour in _G.DerpyUpdateHour and elapsed > min_scan_time):
    save_recent_races()
    _G.SetCacheTimestamp('LastRaceHistoryScanTime', curt)
  else:
    pass
    #log_debug("Race history needn't update")

def sweep_race_replays(begin=0,end=0x7fffffff):
  error = 0
  for i in range(begin,end):
    if error > 3:
      log_warning("Stopping sweeping race due to successive error (>3)")
      break
    try:
      res = game.get_request(f"/api/Casino/Race/GetSchedule/{i}")
      race = res['r']['schedule']
    except (SystemExit,Exception) as err:
      log_error("Error sweeping race:", err)
      error += 1
      continue
    res = save_race(race)
    if not res:
      error += 1
  
def get_race_replay(id):
  res = game.get_request(f"/api/Casino/Race/GetReplay/{id}")
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
  '''
  Save given race data and add to `_G.DerpySavedRaceContent`
  '''
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
  race_t = race['startTime'].split('T')[0].split('-')
  key = "{:d}-{:02d}".format(int(race_t[0]), int(race_t[1]))
  if key not in _G.DerpySavedRaceContent:
    _G.DerpySavedRaceContent[key] = []
  _G.DerpySavedRaceContent[key].append(data)
  log_info(f"Race#{id} data saved")
  return data

def get_next_prediction():
  race = get_upcoming_race()
  data = race['schedule'] if 'schedule' in race else race
  id = data['id']
  l_id = _G.GetCacheString('LastPreditId')
  if id == l_id:
    result = _G.GetCacheBinary('RacePreditCache.bin')
    if result:
      log_debug("Return cached prediction")
      return result
  
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
  _G.SetCacheString('LastPreditId', id)
  _G.SetCacheBinary('RacePreditCache.bin', result)
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