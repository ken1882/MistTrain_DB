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
from time import sleep,gmtime,strftime,localtime
from bs4 import BeautifulSoup as BS
from html import unescape
from urllib.parse import unquote,urlparse,urlencode
from random import randint
from multiprocessing import Lock
import pytz

FLOCK = Lock()

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
  'Accept-Encoding': 'gzip, deflate, br',
}

ServerList = (
  'https://mist-production-api-001.mist-train-girls.com',
  'https://app-misttrain-prod-001.azurewebsites.net',
  'https://app-misttrain-prod-002.azurewebsites.net',
  'https://mist-train-east5.azurewebsites.net',
  'https://mist-train-east4.azurewebsites.net',
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
SceneDatabase     = {}
PotionExpiration  = {}

NetworkMaxRetry = 5
NetworkGetTimeout = 30
NetworkPostTimeout = 60

Session = requests.Session()
GAME_POST_HEADERS = {
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Content-Type': 'application/json',
  'Authorization': ''
}
Session.headers = GAME_POST_HEADERS


def determine_server(depth=0):
  global Session,ServerLocation
  if depth > 3:
    log_error("Failed to dynamically resolve host, use predefined list instead")
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

  res  = Session.get('https://pc-play.games.dmm.co.jp/play/MistTrainGirlsX/')
  page = res.content.decode('utf8')
  try:
    inf_raw = re.search(r"var gadgetInfo = {((?:.*?|\n)*?)};", page).group(0)
  except Exception:
    login_dmm()
    sync_token()
    return determine_server(depth+1)

  inf     = {}
  for line in inf_raw.split('\n'):
    line = [l.strip() for l in line.split(':')]
    if len(line) < 2:
      continue
    inf[line[0].lower()] = literal_eval(line[1].strip()[:-1])
  
  inf['url'] = unescape(unquote(inf['url']))
  inf['st']  = unquote(inf['st'])
  tmp  = inf['url'].split('&url=')[-1].split('&st=')
  _url = [u for u in tmp if u[:4] == 'http'][0]
  urld = urlparse(_url)
  
  Session.headers['Content-Type'] = 'application/x-www-form-urlencoded'
  ServerLocation = f"{urld.scheme}://{urld.hostname}"
  
  return ServerLocation if ServerLocation else _G.ERRNO_MAINTENANCE
    
def check_login():
  global Session,ServerLocation
  log_info("Trying to connect to server:", ServerLocation)
  url = f"{ServerLocation}/api/Login"
  res = Session.post(url=url, headers=PostHeaders, timeout=NetworkPostTimeout)
  if type(res) == dict or res.status_code == 401:
    log_warning("Failed login into game:", res, res.content)
    return _G.ERRNO_FAILED
  elif res.status_code == 200:
    return res
  return _G.ERRNO_MAINTENANCE

def jpt2localt(jp_time):
  '''
  Convert Japanese timezone (GMT+9) datetime object to local timezone
  '''
  time_jp = +9
  time_local = int(strftime("%z", gmtime()))    // 100
  time_local = int(strftime("%z", localtime())) // 100 or time_local
  delta = time_jp - time_local
  return jp_time - timedelta(hours=delta)

def localt2jpt(local_time):
  time_jp = +9
  time_local = int(strftime("%z", gmtime()))    // 100
  time_local = int(strftime("%z", localtime())) // 100 or time_local
  delta = time_jp - time_local
  return local_time + timedelta(hours=delta)


def is_dmm_loggedin():
  pass

def login_dmm():
  global Session,ServerLocation
  _G.SetCacheString('DMM_MTG_COOKIES', '')
  _G.SetCacheString('DMM_FORM_DATA', '')
  Session = requests.Session()
  res  = Session.get('https://accounts.dmm.co.jp/service/login/password')
  page = BS(res.content, 'html.parser')
  form = {
    'token': page.find('input', {'name': 'token'})['value'],
    'path':   '',
    'prompt': '',
    'device': '',
  }
  form['login_id'],form['password'] = os.getenv('DMM_CREDENTIALS').split(':')
  res2 = Session.post('https://accounts.dmm.co.jp/service/login/password/authenticate', form)
  if res2.status_code != 200:
    log_error("Failed to login DMM Account:", res2, '\n', res2.content)
    return res2

  if 'login/totp' in res2.url:
    page  = BS(res2.content, 'html.parser')
    token = page.find('input', {'name': 'token'})['value']
    res3 = login_totp(token)
    if res3.status_code != 200 or 'login' in res3.url:
      log_error("2FA verification failed")
      res3.status_code = 401
      return res3
  
  raw_cookies = ''
  for k in Session.cookies.keys():
    raw_cookies += f"{k}={Session.cookies[k]};"
  _G.SetCacheString('DMM_MTG_COOKIES', raw_cookies)
  return res2

def login_totp(token, pin=''):
  global Session,ServerLocation
  if not pin:
    input('Enter your authenticator pin: ')
  form = {
    'token': token,
    'totp': pin,
    'path': '',
    'device': ''
  }
  return Session.post('https://accounts.dmm.co.jp/service/login/totp/authenticate', form)

def reauth_game(depth=0):
  try:
    ret = _reauth_game(depth=depth)
  finally:
    _G.SetCacheString('LOGIN_LOCK', '')
  return ret

def _reauth_game(depth=0):
  global Session,ServerLocation
  new_token = ''
  if depth > 3:
    log_warning("Reauth depth excessed, abort")
    return _G.ERRNO_MAINTENANCE
  with FLOCK:
    if _G.GetCacheString('LOGIN_LOCK'):
      w = randint(2, 5)
      log_warning(f"Login lock detected, wait for {w} seconds to retry")
      sleep(w)
      sync_token()
      ret = check_login()
      ret = _G.ERRNO_MAINTENANCE if type(ret) == int else ret
      return ret
    _G.SetCacheString('LOGIN_LOCK', '1')
  log_info("Try login game")
  try:
    raw_cookies = _G.GetCacheString('DMM_MTG_COOKIES')
    for line in raw_cookies.split(';'):
      seg = line.strip().split('=')
      k = seg[0]
      v = '='.join(seg[1:])
      Session.cookies.set(k, v)
    
    res  = Session.get('https://pc-play.games.dmm.co.jp/play/MistTrainGirlsX/')
    page = res.content.decode('utf8')
    inf_raw = re.search(r"var gadgetInfo = {((?:.*?|\n)*?)};", page).group(0)
    inf     = {}
    for line in inf_raw.split('\n'):
      line = [l.strip() for l in line.split(':')]
      if len(line) < 2:
        continue
      inf[line[0].lower()] = literal_eval(line[1].strip()[:-1])
    
    inf['url'] = unescape(unquote(inf['url']))
    inf['st']  = unquote(inf['st'])
    tmp  = inf['url'].split('&url=')[-1].split('&st=')
    _url = [u for u in tmp if u[:4] == 'http'][0]
    urld = urlparse(_url)
    
    Session.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    payload = _G.GetCacheString('DMM_FORM_DATA')
    ServerLocation = f"{urld.scheme}://{urld.hostname}"
    if not payload:
      payload = {
        'url': f"{ServerLocation}/api/DMM/auth?fromGadget=true",
        'gadget': _url,
        'st': inf['st'],
        'httpMethod': 'POST',
        'headers': 'Content-Type=application%2Fx-www-form-urlencoded',
        'postData': 'key=value',
        'authz': 'signed',
        'contentType': 'JSON',
        'numEntries': '3',
        'getSummaries': 'false',
        'signOwner': 'true',
        'signViewer': 'true',
        'container': 'dmm',
        'bypassSpecCache': '',
        'getFullHeaders': 'false',
        'oauthState': '',
        'OAUTH_SIGNATURE_PUBLICKEY': 'key_2032',
      }
      payload = urlencode(payload)
      _G.SetCacheString('DMM_FORM_DATA', payload)

    res = Session.post('https://osapi.dmm.com/gadgets/makeRequest', payload)
    log_debug("Response:", res)
    content = ''.join(res.content.decode('utf8').split('>')[1:])
    data = json.loads(content)
    #log_debug(data)
    if "'rc': 403" in str(data):
      return _G.ERRNO_MAINTENANCE
    new_token = json.loads(data[list(data.keys())[0]]['body'])
    change_token(f"Bearer {new_token['r']}")
  except Exception as err:
    log_error("Unable to reauth game:", err)
    handle_exception(err)
  finally:
    Session.headers = GAME_POST_HEADERS
  
  if new_token:
    log_info("Game connected")
    res = check_login()
    if type(res) == int:
      return _G.ERRNO_MAINTENANCE
    res = get_request('/api/Home')
  else:
    log_warning("Failed to login to game, retry dmm login")
    _G.SetCacheString('DMM_COOKIES', '')
    _G.SetCacheString('DMM_FORM', '')
    res_dmm = login_dmm()
    if res_dmm.status_code == 200:
      log_info("DMM login ok")
      return reauth_game(depth=depth+1)
    return None
  return res

def change_token(token):
  global Session
  Session.headers['Authorization'] = token
  _G.SetCacheString('MTG_AUTH_TOKEN', token)

def is_connected():
  global Session
  res = get_request('/api/Users/Me')
  if type(res) != dict:
    return False
  return res['r']

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
  # log_debug(res.content)
  # log_debug('\n')
  return _G.ERRNO_OK

def is_day_changing():
  curt = datetime.now(tz=pytz.timezone('Asia/Tokyo'))
  return (curt.hour == 4 and curt.minute >= 58) or (curt.hour == 5 and curt.minute < 10)

def sync_token():
  global Session
  log_info("Token synchronized")
  Session.headers['Authorization'] = _G.GetCacheString('MTG_AUTH_TOKEN')


FlagDayChanged = False
def refresh_daily_token():
  global FlagDayChanged
  if is_day_changing():
    FlagDayChanged = True
    return
  elif not FlagDayChanged:
    return
  log_info("Refresh daily game token")
  FlagDayChanged = False
  reauth_game()

def get_request(url, depth=1, agent=None):
  global Session,ServerLocation
  if not agent:
    agent = Session
  if not agent:
    return _G.ERRNO_UNAVAILABLE
  if is_day_changing():
    return _G.ERRNO_DAYCHANGING
  if not agent.headers['Authorization']:
    sync_token()
  if not ServerLocation:
    res = determine_server()
    if res == _G.ERRNO_MAINTENANCE:
      return {_G.KEY_ERRNO: _G.ERRNO_MAINTENANCE}
  if not url.startswith('http'):
    url = ServerLocation + url
  try:
    log_debug(f"[GET] {url}")
    if NetworkGetTimeout > 0:
      res = agent.get(url, timeout=NetworkGetTimeout)
    else:
      res = agent.get(url)
  except NetworkExcpetionRescues as err:
    agent.close()
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
    elif errno == 401 or errno == 408:
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

def post_request(url, data=None, depth=1, agent=None):
  global Session,TemporaryNetworkErrors,ServerLocation
  if not agent:
    agent = Session
  if not agent:
    return _G.ERRNO_UNAVAILABLE
  if is_day_changing():
    return _G.ERRNO_DAYCHANGING
  res = None
  if not agent.headers['Authorization']:
    sync_token()
  if not ServerLocation:
    res = determine_server()
    if res == _G.ERRNO_MAINTENANCE:
      return {_G.KEY_ERRNO: _G.ERRNO_MAINTENANCE}
  if not url.startswith('http'):
    url = ServerLocation + url
  try:
    log_debug(f"[POST] {url} with payload:", data, sep='\n')
    if data != None:
      if NetworkPostTimeout > 0:
        res = agent.post(url, json.dumps(data), headers=PostHeaders, timeout=NetworkPostTimeout)
      else:
        res = agent.post(url, json.dumps(data), headers=PostHeaders)
    else:
      if NetworkPostTimeout > 0:
        res = agent.post(url, headers=PostHeaders, timeout=NetworkPostTimeout)
      else:
        res = agent.post(url, headers=PostHeaders)
  except NetworkExcpetionRescues as err:
    agent.close()
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
    elif errno == 401 or errno == 408:
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
  global SceneDatabase
  links = [
    f"{_G.STATIC_HOST}/MasterData/MCharacterViewModel.json",
    f"{_G.STATIC_HOST}/MasterData/MSceneViewModel.json",
  ]
  for i,link in enumerate(links):
    db = None
    res = requests.get(link)
    # log_debug(res)
    # log_debug(res.content)
    db = res.json()
    # Init dbs
    try:
      _tmp = __convert2indexdb(db)
      db = _tmp
    except Exception:
      pass
    if i == 0:
      CharacterDatabase = db
    elif i == 1:
      SceneDatabase = db

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

def get_scene(id):
  global SceneDatabase
  if id not in SceneDatabase:
    load_database()
    if id not in SceneDatabase:
      raise RuntimeError(f"Invalid scene id: {id}")
  return SceneDatabase[id]

def get_profile(token):
  se = requests.Session()
  se.headers['Authorization'] = token
  res  = se.get(f"{ServerLocation}/api/Users/Me").json()['r']
  res2 = se.get(f"{ServerLocation}/api/Users/MyPreferences").json()['r']
  ret = {**res, **res2}
  return ret