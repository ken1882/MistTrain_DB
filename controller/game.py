import _G
import os
import requests
import re
from ast import literal_eval
import json
from _G import log_error,log_info,log_debug,log_warning,wait
from utils import get_last_error,handle_exception,set_last_error
from requests.exceptions import *
from urllib3.exceptions import ProtocolError
from datetime import datetime,timedelta
from time import sleep,gmtime,strftime
import pytz

NetworkExcpetionRescues = (
  ConnectTimeout, ReadTimeout, ConnectionError, ConnectionAbortedError,
  ConnectionResetError, TimeoutError, ProtocolError
)

TemporaryNetworkErrors = (
  'Object reference not set',
  'Data may have been modified or deleted since entities were loaded'
)

PostHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Accept-Encoding': 'gzip, deflate, br'
}

ServerList = (
  'https://mist-train-east4.azurewebsites.net',
  'https://mist-train-east5.azurewebsites.net',
  'https://mist-train-east6.azurewebsites.net',
  'https://mist-train-east7.azurewebsites.net',
  'https://mist-train-east8.azurewebsites.net',
  'https://mist-train-east9.azurewebsites.net',
  'https://mist-train-east1.azurewebsites.net',
  'https://mist-train-east2.azurewebsites.net',
  'https://mist-train-east3.azurewebsites.net',
)

ServerLocation = ''

CharacterDatabase = {}
EnemyDatabase     = {}
FormationDatabase = {}
SkillDatabase     = {}
LinkSkillDatabase = {}
ConsumableDatabase= {}
WeaponDatabase    = {}
ArmorDatabase     = {}
AccessoryDatabase = {}
GearDatabase      = {}
FieldSkillDatabase= {}
QuestDatabase     = {}
ABStoneDatabase   = {}

NetworkMaxRetry = 5
NetworkGetTimeout = 20
NetworkPostTimeout = 60

Session = requests.Session()
Session.headers = {
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Authorization': ''
}


def determine_server():
  global Session,ServerList,ServerLocation
  for uri in ServerList:
    try:
      log_info("Trying to connect to server", uri)
      res = requests.post(f"{uri}/api/Login")
      if res.status_code == 401:
        ServerLocation = uri
        log_info("Server location set to", uri)
        return ServerLocation
      log_info("Failed with", res, res.content)
    except Exception as res:
      log_error(res)
  log_warning("Unable to get a live server")
  return _G.ERRNO_MAINTENANCE
    
def jpt2localt(jp_time):
  '''
  Convert Japanese timezone (GMT+9) datetime object to local timezone
  '''
  time_jp = +9
  time_local = int(strftime("%z", gmtime())) // 100
  delta = time_jp - time_local
  return jp_time - timedelta(hours=delta)

def localt2jpt(local_time):
  time_jp = +9
  time_local = int(strftime("%z", gmtime())) // 100
  delta = time_jp - time_local
  return local_time + timedelta(hours=delta)

def reauth_game():
  global Session,ServerLocation
  new_token = ''
  if not ServerLocation:
    res = determine_server()
    if res == _G.ERRNO_MAINTENANCE:
      return _G.ERRNO_MAINTENANCE
  try:
    Session.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    raw_cookies = os.getenv('DMM_MTG_COOKIES')
    for line in raw_cookies.split(';'):
      seg = line.strip().split('=')
      k = seg[0]
      v = '='.join(seg[1:])
      Session.cookies.set(k, v)
    res = Session.get('https://pc-play.games.dmm.co.jp/play/MistTrainGirlsX/')
    page = res.content.decode('utf8')
    st = ''
    for line in page.split('\n'):
      if re.match(r"(\s+)ST(\s+):", line):
        st = literal_eval(line.strip().split(':')[-1][:-1].strip())
        break
    payload = os.getenv('DMM_FORM_DATA')
    rep = re.search(r"mist-train-east(\d)", payload).span()
    rep = payload[rep[0]:rep[1]]
    payload = payload.replace(rep, ServerLocation.split('//')[1].split('.')[0])
    rep = re.search(r"st=(.+?)&", payload).group(0)
    rep = rep.split('=')[1][:-1]
    payload = payload.replace(rep, st)
    res = Session.post('https://osapi.dmm.com/gadgets/makeRequest', payload)
    log_debug("Response:", res)
    content = ''.join(res.content.decode('utf8').split('>')[1:])
    data = json.loads(content)
    log_debug(data)
    if "'rc': 403" in str(data):
      return _G.ERRNO_MAINTENANCE
    new_token = json.loads(data[list(data.keys())[0]]['body'])
    change_token(f"Bearer {new_token['r']}")
  except Exception as err:
    log_error("Unable to reauth game:", err)
    handle_exception(err)
  finally:
    Session.headers['Content-Type'] = 'application/json'
  if new_token:
    log_info("Game connected")
    res = determine_server()
    if res == _G.ERRNO_MAINTENANCE:
      return _G.ERRNO_MAINTENANCE
    res = get_request('/api/Home')
  else:
    log_warning("Game session revoked")
    Session = None
    return None
  return res

def change_token(token):
  global Session
  Session.headers['Authorization'] = token
  _G.SetCacheString('MTG_AUTH_TOKEN', token)

def is_connected():
  global Session
  res = get_request('/api/Users/Me')
  if type(res) == dict or type(res) == int:
    return False
  if is_response_ok(res) == _G.ERRNO_OK:
    return res.json()['r']
  return False

def is_response_ok(res):
  if res.status_code != 200:
    set_last_error(code=res.status_code)
    if res.content:
      try:
        set_last_error(msg=res.json()['r']['m'])
      except Exception:
        pass
    if res.status_code == 403:
      log_error("Server is under maintenance!")
      return {_G.KEY_ERRNO: _G.ERRNO_MAINTENANCE}
    else:
      log_error(f"An error occurred during sending request to {res.url}:\n{res}\n{res.content}\n\n")
    return _G.ERRNO_FAILED
  log_debug(res.content)
  log_debug('\n')
  return _G.ERRNO_OK

def is_day_changing():
  curt = datetime.now(tz=pytz.timezone('Asia/Tokyo'))
  return (curt.hour == 4 and curt.minute >= 58) or (curt.hour == 5 and curt.minute < 10)

def get_request(url, depth=1):
  global Session,ServerLocation
  if not Session:
    return _G.ERRNO_UNAVAILABLE
  if is_day_changing():
    return _G.ERRNO_DAYCHANGING
  if not Session.headers['Authorization']:
    Session.headers['Authorization'] = _G.GetCacheString('MTG_AUTH_TOKEN')
  if not ServerLocation:
    res = determine_server()
    if res == _G.ERRNO_MAINTENANCE:
      return {_G.KEY_ERRNO: _G.ERRNO_MAINTENANCE}
  if not url.startswith('http'):
    url = ServerLocation + url
  try:
    log_debug(f"[GET] {url}")
    res = Session.get(url, timeout=NetworkGetTimeout)
  except NetworkExcpetionRescues as err:
    Session.close()
    if depth < NetworkMaxRetry:
      log_warning(f"Connection errored for {url}, retry after 3 seconds...(depth={depth+1})")
      wait(3)
      return get_request(url, depth=depth+1)
    else:
      log_error(f"Unable to connect to {url}, ignore request")
      return None
  if is_response_ok(res) != _G.ERRNO_OK:
    errno,errmsg = get_last_error()
    if errno == 403:
      return _G.ERRNO_MAINTENANCE
    elif errno == 401:
      log_info("Attempting to reauth game")
      res = reauth_game()
      if res == _G.ERRNO_MAINTENANCE:
        return {_G.KEY_ERRNO: res}
      return get_request(url)
    else:
      pass
  if not res.content:
    return None
  return res.json()

def post_request(url, data=None, depth=1):
  global Session,TemporaryNetworkErrors,ServerLocation
  if not Session:
    return _G.ERRNO_UNAVAILABLE
  if is_day_changing():
    return _G.ERRNO_DAYCHANGING
  res = None
  if not Session.headers['Authorization']:
    Session.headers['Authorization'] = _G.GetCacheString('MTG_AUTH_TOKEN')
  if not ServerLocation:
    res = determine_server()
    if res == _G.ERRNO_MAINTENANCE:
      return {_G.KEY_ERRNO: _G.ERRNO_MAINTENANCE}
  if not url.startswith('http'):
    url = ServerLocation + url
  try:
    log_debug(f"[POST] {url} with payload:", data, sep='\n')
    if data != None:
      res = Session.post(url, json.dumps(data), headers=PostHeaders, timeout=NetworkPostTimeout)
    else:
      res = Session.post(url, headers=PostHeaders, timeout=NetworkPostTimeout)
  except NetworkExcpetionRescues as err:
    Session.close()
    if depth < NetworkMaxRetry:
      log_warning(f"Connection errored for {url}, retry after 3 seconds...(depth={depth+1})")
      wait(3)
      return post_request(url, data, depth=depth+1)
    else:
      log_error(f"Unable to connect to {url}, ignore request")
      return None
  if is_response_ok(res) != _G.ERRNO_OK:
    errno,errmsg = get_last_error()
    if errno == 500 and any((msg in errmsg for msg in TemporaryNetworkErrors)):
      log_warning("Temprorary server error occurred, waiting for 3 seconds")
      wait(3)
      log_warning(f"Retry connect to {url} (depth={depth+1})")
      return post_request(url, data, depth=depth+1)
    elif errno == 403:
      return {_G.KEY_ERRNO: _G.ERRNO_MAINTENANCE}
    elif errno == 401:
      log_info("Attempting to reauth game")
      res = reauth_game()
      if res == _G.ERRNO_MAINTENANCE:
        return {_G.KEY_ERRNO: res}
      wait(1)
      return post_request(url, data, depth=depth)
    else:
      pass
  if not res.content:
    return None
  return res.json()

def is_service_available():
  global Session
  return (not not Session)

def load_database():
  global Session,CharacterDatabase
  links = [
    'https://assets.mist-train-girls.com/production-client-web-static/MasterData/MCharacterViewModel.json',
  ]
  for i,link in enumerate(links):
    db = None
    res = requests.get(link)
    log_debug(res)
    log_debug(res.content)
    db = res.json()
    # Init dbs
    try:
      _tmp = __convert2indexdb(db)
      db = _tmp
    except Exception:
      pass
    if i == 0:
      CharacterDatabase = db

def __convert2indexdb(db):
  ret = {}
  for obj in db:
    ret[obj['Id']] = obj
  return ret

def get_character_base(id):
  if id not in CharacterDatabase:
    load_database()
    if id not in CharacterDatabase:
      _G.log_warning(f"Invalid character id: {id}")
      return None
  return CharacterDatabase[id]

def get_character_name(id):
  ch = get_character_base(id)
  return f"{ch['Name']}{ch['MCharacterBase']['Name']}"