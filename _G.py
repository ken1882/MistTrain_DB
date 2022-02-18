import sys,os
from datetime import datetime,timedelta
import pytz
import threading
import pickle
from time import sleep
from random import randint
from copy import copy,deepcopy
from dotenv import load_dotenv

ENCODING = 'UTF-8'
IS_WIN32 = False
IS_LINUX = False

if sys.platform == 'win32':
  IS_WIN32 = True
elif sys.platform == 'linux':
  IS_LINUX = True

ARGV = {}


DCTmpFolder = ".tmp"
DCSnapshotFile = "snapshot.png"
STATIC_FILE_DIRECTORY = './static' 

# 0:NONE 1:ERROR 2:WARNING 3:INFO 4:DEBUG
VerboseLevel = 3
VerboseLevel = 4 if os.getenv('VERBOSE') or ('-v' in sys.argv or '--verbose' in sys.argv) else VerboseLevel

FlagRunning = True
FlagPaused  = False
FlagWorking = False
FlagProcessingUserInput = False
FlagUseCloudData = True
if os.getenv('MTG_USE_CLOUD_DATA'):
  FlagUseCloudData = True

MSG_PIPE_CONT   = '\x00\x50\x00CONTINUE\x00'
MSG_PIPE_STOP   = "\x00\x50\x00STOP\x00"
MSG_PIPE_ERROR  = "\x00\x50\x00ERROR\x00"
MSG_PIPE_TERM   = "\x00\x50\x00TERMINATED\x00"
MSG_PIPE_RET    = "\x00\x50\x00RET\x00"
MSG_PIPE_INFO   = "\x00\x50\x00INFO\x00"

ThreadPool = {}
MutexLock  = threading.Lock()

Throttling = True
StarbrustStream = False
PersistCharacterCache = True

SERVER_TICK_INTERVAL = 60

STATIC_FILE_TTL = 60*60*24

CH_WIDTH = {
  'F': 2, 'H': 1, 'W': 2,
  'N': 1, 'A': 1, 'Na': 1,
}

SYMBOL_WIDTH = {
  1: '♪',
  2: '★☆【】ⅠⅡⅢ：',
}

def format_curtime():
  return datetime.strftime(datetime.now(), '%H:%M:%S')

def log_error(*args, **kwargs):
  if VerboseLevel >= 1:
    print(f"[{format_curtime()}] [ERROR]:", *args, **kwargs)

def log_warning(*args, **kwargs):
  if VerboseLevel >= 2:
    print(f"[{format_curtime()}] [WARNING]:", *args, **kwargs)

def log_info(*args, **kwargs):
  if VerboseLevel >= 3:
    print(f"[{format_curtime()}] [INFO]:", *args, **kwargs)

def log_debug(*args, **kwargs):
  if VerboseLevel >= 4:
    print(f"[{format_curtime()}] [DEBUG]:", *args, **kwargs)

def resume(fiber):
  global Fiber,FiberRet
  ret = None
  try:
    ret = next(fiber)
    if ret and ret[0] == MSG_PIPE_RET:
      log_info("Fiber signaled return")
      FiberRet = ret[1]
      return False
  except StopIteration:
    log_info("Fiber has stopped")
    return False
  return True

def resume_from(fiber):
  global FiberRet
  while resume(fiber):
    yield
  return FiberRet

def pop_fiber_ret():
  global FiberRet
  ret = copy(FiberRet)
  FiberRet = None
  return ret

def wait(sec):
  sleep(sec)

def uwait(sec):
  if StarbrustStream:
    return
  dt = randint(0,8) / 10
  dt = dt if Throttling else dt / 3
  sleep(sec+dt)

ASSET_HOST = 'https://assets.mist-train-girls.com/production-client-web-static'

# Errnos
KEY_ERRNO = 'errno'
ERROR_SUCCESS       = 0x0
ERROR_LOCKED        = 0x1
ERROR_LIMIT_REACHED = 0x3
ERROR_NOSTAMINA     = 0x6

ERRNO_OK          = 0x0
ERRNO_MAINTENANCE = 0x10
ERRNO_DAYCHANGING = 0x11
ERRNO_FAILED      = 0xfe
ERRNO_UNAVAILABLE = 0xff

# Battle contants
BATTLESTAT_VICTORY = 0x2

# Skill constants
SSCOPE_ENEMY = 1
SSCOPE_ALLY  = 2
STYPE_NORMAL_ATTACK = 5

# Item constants
ITYPE_WEAPON      = 1
ITYPE_ARMOR       = 2
ITYPE_ACCESORY    = 3
ITYPE_CONSUMABLE  = 4
ITYPE_ABSTONE     = 5   # ability stone
ITYPE_GOLD        = 6
ITYPE_FREEGEM     = 7
ITYPE_GEM         = 8
ITYPE_GEAR        = 10  # aka character pieces
ITYPE_GEAR2       = 11
ITYPE_ABSTONE2    = 12

ITYPE_NAMES = {
  ITYPE_WEAPON: '武器',
  ITYPE_ARMOR: '防具',
  ITYPE_ACCESORY: '装飾',
  ITYPE_CONSUMABLE: 'アイテム',
  ITYPE_ABSTONE: '宝珠',
  ITYPE_ABSTONE2: '宝珠',
  ITYPE_GOLD: 'ゴルード',
  ITYPE_GEAR: 'ギヤ',
  ITYPE_GEAR2: 'ギヤ',
}

SHOP_TYPE_EVENT = 1

RARITY_A  = 2
RARITY_S  = 3
RARITY_SS = 4
RARITY_NAME = ['C','B','A','S','SS','US']

LastErrorCode = 0
LastErrorMessage = ''

DERPY_WAREHOUSE_HAEDER_PATH   = 'json/derpy_header.json'
DERPY_WAREHOUSE_CONTENT_PATH  = 'json/{}derpy_warehouse.json'

DERPY_TACTIC_NIGE     = 1 # 逃げ
DERPY_TACTIC_SENKO    = 2 # 先行
DERPY_TACTIC_SASHI    = 3 # 差し
DERPY_TACTIC_OI       = 4 # 追い
DERPY_DIRECTION_RIGHT = 0 # 右回り 
DERPY_DIRECTION_LEFT  = 1 # 左回り
DERPY_WEATHER_SUNNY   = 0 # 晴
DERPY_WEATHER_RAIN    = 1 # 雨
DERPY_TYPE_GRASS      = 0 # 芝
DERPY_TYPE_DIRT       = 1 # ダート
DERPY_RANGE_1200      = 0
DERPY_RANGE_2400      = 1
DERPY_RANGE_3600      = 2
DERPY_UMA_REPORT      = '_・×▲○◎' # first one is reserved
DERPY_TACTIC_LIST = [
  '', '逃げ', '先行', '差し', '追い込み'
]
DERPY_STAT_TABLE = {
  'F': 1,
  'E': 2,
  'D': 3,
  'C': 4,
  'B': 6,
  'A': 8,
}
DERPY_CONDITION_LIST = [
  '_________', # reserved
  'ケガなどし',
  '心配ですね',
  '大丈夫でし',
  '少し元気が',
  'やる気を感',
  '調子は良さ',
  '凄い意気込',
  '絶好調のよ',  
]
DERPY_CONDITION_NAME = [
  '',
  '絕不調',
  '悪そう',
  '不調',
  '微不調',
  '微好調',
  '好調',
  '凄い'
  '絶好調',
]
DERPY_GROUND_TYPE = ['芝', 'ダート']
DERPY_WEATHER_TYPE = ['晴', '雨']
DERPY_DIRECTION_TYPE = ['右回り', '左回り']
DERPY_RANGE_LIST = ['1200m', '2400m', '3600m']
DERPY_CHARACTER_COUNTRY = [
  '',
  'セントイリス',
  'ニシキ',
  'アイゼングラート',
  'ヴェルフォレット',
  'フレイマリン'
]

DerpyStartYear  = 2021
DerpyStartMonth = 4
DerpyUpdateHour = [12,20,23]

CLOUD_ROOT_FOLDERNAME = 'MistTrainDB'
SCENE_CLOUD_FOLDERNAME = 'Scene'
DERPY_CLOUD_FOLDERNAME = 'Derpy'
DERPY_CLOUD_ESTIMATORS = [
  'rfr_fit_order_False-feats_all.mod',
  'rfr_fit_order_True-feats_all.mod',
  'rfc_fit_order_True-feats_all.mod',
  'knn_fit_order_True-feats_all.mod',
  'rfr_fit_order_False-feats_noreport.mod',
  'rfr_fit_order_True-feats_noreport.mod',
  'rfc_fit_order_True-feats_noreport.mod',
  'knn_fit_order_True-feats_noreport.mod',
]

SCENE_METAS = {
  'main': 'main_scene.json',
  'event': 'event_scene.json',
  'character': 'character_scene.json'
}

DERPY_ESTIMATORS    = []

# saved race history
DerpySavedRaceHeader   = set()
DerpySavedRaceContent  = {}

def make_model_name(opts):
  opts = deepcopy(opts)
  ret = f"{opts.pop('model')}_"
  ret += str(opts).translate(str.maketrans(":,(){}'",'_-     ')).replace(' ','')
  ret += ".mod"
  return ret

def extract_derpy_features(race, character, feats='all'):
  n_uma = len(race['character'])
  if feats == 'all':
    return [
      race['raceId'],
      race['direction'],
      race['grade'],
      n_uma,
      character['range'],
      abs(race['type'] - character['forte']),
      race['weather'],
      character['weather'],
      character['tactics'],
      character['report'],
      character['condition'],
      character['speed'],
      character['stamina'],
      character['number'],
      character['waku'],
      character['mCharacterBaseId'],
      character['country']
    ]
  elif feats == 'noreport':
    return [
      race['raceId'],
      race['direction'],
      race['grade'],
      n_uma,
      character['range'],
      abs(race['type'] - character['forte']),
      race['weather'],
      character['weather'],
      character['tactics'],
      character['condition'],
      character['speed'],
      character['stamina'],
      character['number'],
      character['waku'],
      character['mCharacterBaseId'],
      character['country']
    ]
  raise RuntimeError(f"Don't know how to extract features of {feats}")

LastRaceHistoryScanTime = datetime.now(tz=pytz.timezone('Asia/Tokyo'))
NextRaceCache = None
LastRaceCacheTime = datetime(2020,9,16, tzinfo=pytz.timezone('Asia/Tokyo'))
MaxRaceCacheTime  = timedelta(days=1)
MinRaceCacheTime  = timedelta(minutes=30)
RacePreditCache = None
LastPreditId    = 0

CHARACTER_AVATAR_SRC_SIZE = (94, 94)
CHARACTER_FRAME_SRC_SIZE  = (102, 102)

def GetCacheString(key):
  load_dotenv()
  return os.getenv(key)

def GetCacheTimestamp(key):
  load_dotenv()
  st = int(os.getenv(key) or 0)
  return datetime.fromtimestamp(st, tz=pytz.timezone('Asia/Tokyo'))

def SetCacheString(key, val):
  return os.system(f'dotenv set {key} "{val}"')

def SetCacheTimestamp(key, val):
  if type(val) == datetime:
    val = val.timestamp()
  return os.system(f'dotenv set {key} {int(val)}')

def GetCacheBinary(key):
  if not os.path.exists(key):
    return None
  try:
    with open(key, 'rb') as fp:
      return pickle.load(fp)
  except Exception:
    uwait(0.1)
    return GetCacheBinary(key)

def SetCacheBinary(key, val):
  try:
    with open(key, 'wb') as fp:
      return pickle.dump(val, fp)
  except Exception:
    pass

def LoopDerpyYMPair(end_t=None):
  if not end_t:
    end_t = datetime.now(tz=pytz.timezone('Asia/Tokyo'))
  cy,cm = DerpyStartYear,DerpyStartMonth
  ey,em = end_t.year,end_t.month
  while cy != ey or cm != em:
    yield (cy, cm)
    cm += 1
    if cm == 13:
      cm = 1
      cy += 1
  yield (ey, em)

def MakeDerpyFilenamePair(y,m):
  path = DERPY_WAREHOUSE_CONTENT_PATH.format("{:d}-{:02d}_".format(y, m))
  return (path, path.split('/')[-1])