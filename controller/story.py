import _G
import os, json
import controller.game as game
import controller.ruby as ruby
import datamanager as dm
from flask import render_template
from copy import copy,deepcopy
from datetime import date, datetime, timedelta
from pprint import PrettyPrinter,pformat
from _G import log_warning,log_debug,log_error,log_info
from time import mktime,strptime
from threading import Thread
from copy import copy
import pytz
import requests
import urllib.parse
import utils
from shutil import copyfile
from multiprocessing import Lock
from threading import Thread
from time import sleep
pp = PrettyPrinter(indent=2)


FLOCK = Lock()

IsStoryReady = False
IsStoryInitCalled = False
UploadLock    = False
UploadStatus  = ''

RUBIFY_STORY = os.getenv('MTG_AUTO_RUBIFY')

SceneMeta   = {}
MaxWorkers  = 8
RubyWorkers = []
ExistedScene = set()

# For frontend to determine whether character has all scene unlocked
CharacterSceneCache = {}

MaruHeaders = {
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept': 'text/plain, */*; q=0.01',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Host': 'www.jpmarumaru.com',
  'Origin': 'https://www.jpmarumaru.com',
  'Referer': 'https://www.jpmarumaru.com/tw/toolKanjiFurigana.asp'
}

MTGHeaders = {
  'Accept': 'application/vnd.msgpack',
  'Accept-Encoding': 'gzip, deflate, br',
  'Origin': 'https://assets4.mist-train-girls.com',
  'Referer': 'https://assets4.mist-train-girls.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
}

FlagDailyUpdated = False
UPDATE_HOUR = 4 # 4 am

def init():
  global IsStoryReady,IsStoryInitCalled
  IsStoryInitCalled = True
  while not dm.CacheBooted:
    log_warning("[Story] Data cache unbooted, waiting for 10 seconds")
    sleep(10)
  update_cache()
  # copy_meta_cache()
  IsStoryReady = True

def req_story_ready(func):
  def wrapper(*args, **kwargs):
    global IsStoryReady,IsStoryInitCalled
    if not IsStoryInitCalled:
      IsStoryInitCalled = True
      th = Thread(target=init)
      th.start()
    if not IsStoryReady:
      return render_template('notready.html',
        navbar_content=utils.load_navbar(),
      )
    return func(*args, **kwargs)
  wrapper.__name__ = func.__name__
  return wrapper

def update_cache():
  load_metas()
  update_scene_cache()

def load_metas():
  global SceneMeta
  files = dm.load_story_meta()
  for k, fname in _G.SCENE_METAS.items():
    SceneMeta[k] = []
    for path in files:
      if fname in path and os.path.exists(path):
        with open(path, 'r') as fp:
          SceneMeta[k] = json.load(fp)
          log_info(f"{fname} ready")

def update_scene_cache():
  global SceneMeta,ExistedScene,CharacterSceneCache
  game.load_database()
  for ch in SceneMeta['main']:
    for sc in ch['Scenes']:
      sid = sc['MSceneId']
      if is_scene_unlocked('main', sid, sc['Status']):
        ExistedScene.add(sid)

  for ch in SceneMeta['event']:
    for sc in ch['Scenes']:
      sid = sc['MSceneId']
      if is_scene_unlocked('event', sid, sc['Status']):
        ExistedScene.add(sid)

  for ch in SceneMeta['side']:
    for sc in ch['Scenes']:
      sid = sc['MSceneId']
      if is_scene_unlocked('side', sid, sc['Status']):
        ExistedScene.add(sid)

  for ch in SceneMeta['pt']:
    for sc in ch['Scenes']:
      sid = sc['MSceneId']
      if is_scene_unlocked('pt', sid, sc['Status']):
        ExistedScene.add(sid)

  for ch in SceneMeta['character']:
    for layer in ch['CharacterScenes']:
      for sc in layer['Scenes']:
        sid = sc['MSceneId']
        if is_scene_unlocked('character', sid, sc['Status']):
          ExistedScene.add(sid)

  for chid in game.CharacterDatabase:
    layer = game.CharacterDatabase[chid]
    CharacterSceneCache[chid] = {}
    for sc in layer['MCharacterScenes']:
      sid = sc['MSceneId']
      if sid in ExistedScene:
        CharacterSceneCache[chid][sid] = True
      else:
        CharacterSceneCache[chid][sid] = False
  log_info("Scene cache updated")

def check_new_available():
  global FlagDailyUpdated
  curt = game.localt2jpt(datetime.now())
  if curt.hour != UPDATE_HOUR:
    FlagDailyUpdated = False
    return
  if FlagDailyUpdated:
    return
  log_info(f"Updating scene cache")
  update_cache()
  log_info(f"Updating database cache")
  dm.update_cache(dm.SceneFolder)
  for lang,folder in dm.SceneFolderTranslated.items():
      log_info(f"Updating scene cache of {lang}")
      dm.update_cache(folder)
  FlagDailyUpdated = True
  log_info("Story meta updated")

def copy_meta_cache():
  for k,fn in _G.SCENE_METAS.items():
    src = f"{_G.STATIC_FILE_DIRECTORY}/json/{fn}"
    dst = f"{_G.STATIC_FILE_DIRECTORY}/json/c_{fn}"
    if os.path.exists(src):
      copyfile(src, dst)

def is_scene_unlocked(_type, id, status):
  if status == 1:
    return True
  if _type == 'main':
    return id % 100 > 10
  elif _type == 'event':
    return status == 5
  elif _type == 'side':
    return status == 5
  elif _type == 'character':
    return status == 3
  elif _type == 'pt':
    return status == 3
  return False

def rubify_scenes(sids):
  log_info("Start rubifing scenes of", len(sids))
  for sid in sids:
    log_info("Rubifing", sid)
    src = f"{_G.DCTmpFolder}/scenes/{sid}.json"
    dst = f"{_G.STATIC_FILE_DIRECTORY}/scenes/{sid}.json"
    if os.path.exists(dst):
      log_info(f"{dst} already exists, skip")
      continue
    # rbd = ruby.rubifiy_file(src)
    # with open(dst, 'w') as fp:
    #   json.dump(rbd, fp)
    with open(src, 'r') as fp:
      data = json.load(fp)
      if 'r' in data:
        data = data['r']
    with open(dst, 'w') as fp:
      json.dump(data, fp)

def patch_scenes(sids):
  global IsStoryReady
  if not game.SceneDatabase:
    game.load_database()
  if not dm.Database:
    dm.init()
  if not IsStoryReady:
    init()
  for sid in sids:
    log_info("Re-rubifing", sid)
    src = f"{_G.DCTmpFolder}/scenes/{sid}.json"
    dst = f"{_G.STATIC_FILE_DIRECTORY}/scenes/{sid}.json"
    if not os.path.exists(src):
      if os.path.exists(dst):
        copyfile(dst, src)
      else:
        log_info(f"{src} not exists, pulling form cloud")
        with open(src, 'w') as fp:
          json.dump(dm.get_scene(sid), fp)

    rbd = ruby.rubifiy_file(src)
    with open(dst, 'w') as fp:
      json.dump(rbd, fp)

    dm.save_scene(sid, rbd)

# save in tmp folder, add to cache
# and upload to gdrive after downloaded
# file will need to be rubified before serving
# TODO: make this part prettier
def dump_sponspred_scene(token):
  global UploadLock,SceneMeta,UploadStatus,RubyWorkers
  if UploadLock:
    return _G.ERROR_LOCKED
  UploadStatus = 'init' # ret for polling status query
  saved = []
  try:
    UploadLock = True
    se = requests.Session()
    se.headers = copy(MTGHeaders)
    se.headers['Authorization'] = token
    UploadStatus = 'meta'
    new_total = 0
    ok_total  = 0
    news  = {}
    nmeta = {}
    for k,uri in _G.SCENE_META_API.items():
      # get metas
      res = se.get(f"{game.ServerLocation}{uri}")
      if res.status_code == 401 or res.status_code == 408:
        return _G.ERRNO_UNAUTH
      elif res.status_code == 403:
        return _G.ERRNO_MAINTENANCE
      try:
        raw = game.unpack(res.content)
        if k == 'main':
          data = interpret_main_scenes(raw)
        elif k == 'event':
          data = interpret_event_scenes(raw)
        elif k == 'character':
          data = interpret_character_scenes(raw)
        elif k == 'side':
          data = interpret_side_scenes(raw)
        elif k == 'pt':
          data = interpret_pt_scenes(raw)
      except Exception as err:
        log_error("Error while getting scene via sponser's token:\n", res.status_code,res.content)
        return _G.ERRNO_FAILED
      # get missing scenes
      news[k] = get_new_scenes(k, data)
      new_total += len(news[k])
      nmeta[k] = data
    log_info('New scenes:', pformat(news))
    for k in news:
      UploadStatus = 'download,'+k
      for sid in news[k]:
        # check existance
        path  = f"{_G.DCTmpFolder}/scenes/{sid}.json"
        path2 = f"{_G.STATIC_FILE_DIRECTORY}/scenes/{sid}.json"
        UploadStatus = f"download,{k},{ok_total},{new_total}"
        if os.path.exists(path) or os.path.exists(path2):
          ok_total += 1
          log_info(f"Scene#{sid} {game.get_scene(sid)['Title']} already exists, skip")
          continue
        res = se.get(f"{game.ServerLocation}/api/UScenes/{sid}")
        if res.status_code == 401 or res.status_code == 408:
          return _G.ERRNO_UNAUTH
        elif res.status_code == 403:
          return _G.ERRNO_MAINTENANCE
        try:
          data = interpret_scene_data(game.unpack(res.content))
        except Exception as err:
          log_error("Error while getting scene via sponser's token:\n", res.status_code,res.content)
          return _G.ERRNO_FAILED
        if 'MSceneDetailViewModel' in data:
          data['MSceneDetailViewModel'] = sorted(data['MSceneDetailViewModel'], key=lambda o:o['GroupOrder'])
        else:
          _G.log_warning(f"Scene#{sid} does not contain any information:\n", data)
          data['MSceneDetailViewModel'] = []
        with FLOCK:
          with open(path, 'w') as fp:
            json.dump(data, fp)
        saved.append(sid)
        ExistedScene.add(sid) # add to cache
        ok_total += 1
        log_info(f"Scene#{sid} {game.get_scene(sid)['Title']} saved")

    save_sponsors(token)
    if not saved:
      return _G.ERRNO_OK

    # if false, manually run rubifiing process,
    # makes response much faster
    if not RUBIFY_STORY:
      tmp_meta = copy(SceneMeta)
      update_meta(tmp_meta, nmeta, saved)
      save_meta(tmp_meta, 't_')
      return _G.ERRNO_OK

    UploadStatus = 'process'
    ok_total = 0
    new_total = len(saved)
    csize = new_total // MaxWorkers
    for chunk in utils.chop(saved, csize):
      th = Thread(target=rubify_scenes, args=(chunk,))
      RubyWorkers.append(th)
      th.start()

    _running = True
    while _running:
      sleep(1)
      # print([th.is_alive() for th in RubyWorkers])
      _running = not all([not th.is_alive() for th in RubyWorkers])

    UploadStatus = 'upload'
    ok_total = 0
    new_total = len(saved)
    done = []
    for sid in saved:
      UploadStatus = f"process,{ok_total},{new_total}"
      file = f"{_G.STATIC_FILE_DIRECTORY}/scenes/{sid}.json"
      with open(file, 'r') as fp:
        dm.save_scene(sid, json.load(fp))
      done.append(sid)
      ok_total += 1

    update_meta(SceneMeta, nmeta, done)
    save_meta(SceneMeta)
    dm.upload_story_meta(copy(SceneMeta))
    update_scene_cache()
  except Exception as err:
    UploadStatus = 'failed'
    utils.handle_exception(err)
    return _G.ERRNO_FAILED
  finally:
    UploadLock = False
  UploadStatus = 'ok'
  return _G.ERRNO_OK

def is_scene_missing(_type, sid, status):
  global SceneMeta,ExistedScene
  if _type == 'event' and status == 1:
    return True
  if sid in ExistedScene:
    return False
  if not is_scene_unlocked(_type, sid, status):
    return False
  return True

def get_new_scenes(_type, scenes):
  global SceneMeta,ExistedScene
  ret = []
  if _type in ['main', 'event', 'side', 'pt']:
    for ch in scenes:
      for sc in ch['Scenes']:
        sid = sc['MSceneId']
        if not is_scene_missing(_type, sid, sc['Status']):
          continue
        ret.append(sid)
  elif _type == 'character':
    for ch in scenes:
      for layer in ch['CharacterScenes']:
        for sc in layer['Scenes']:
          sid = sc['MSceneId']
          if not is_scene_missing(_type, sid, sc['Status']):
            continue
          ret.append(sid)
  return ret

def update_general_meta(stype, old_meta, new_meta, saved, primary_key='MChapterId'):
  for ch in new_meta[stype]:
    och_idx = next(
      (i for (i, o) in enumerate(old_meta[stype]) if o[primary_key] == ch[primary_key]),
      -1
    )
    if och_idx == -1:
      old_meta[stype].append(ch)
      continue
    for sc in ch['Scenes']:
      sid = sc['MSceneId']
      if sid not in saved:
        continue
      nidx = next(
        (i for (i, o) in enumerate(old_meta[stype][och_idx]['Scenes']) if o['MSceneId'] == sid),
        -1
      )
      if nidx == -1:
        old_meta[stype][och_idx]['Scenes'].append(sc)
      else:
        old_meta[stype][och_idx]['Scenes'][nidx] = sc
    old_meta[stype][och_idx]['Scenes'] = sorted(
      old_meta[stype][och_idx]['Scenes'],
      key=lambda o:o['MSceneId']
    )
  old_meta[stype] = sorted(
    old_meta[stype],
    key=lambda o:o[primary_key]
  )

def update_character_meta(old_meta, new_meta, saved):
  for base in new_meta['character']:
    bch_idx = next(
      (i for (i, o) in enumerate(old_meta['character']) if o['MCharacterBaseId'] == base['MCharacterBaseId']),
      -1
    )
    if bch_idx == -1:
      old_meta['character'].append(base)
      continue
    for layer in base['CharacterScenes']:
      lch_idx = next(
        (i for (i, o) in enumerate(old_meta['character'][bch_idx]['CharacterScenes']) if o['MCharacterId'] == layer['MCharacterId']),
        -1
      )
      if lch_idx == -1:
        old_meta['character'][bch_idx]['CharacterScenes'].append(layer)
        continue
      for sc in layer['Scenes']:
        sid = sc['MSceneId']
        if sid not in saved:
          continue
        nidx = next(
          (i for (i, o) in enumerate(old_meta['character'][bch_idx]['CharacterScenes'][lch_idx]['Scenes']) if o['MSceneId'] == sid),
          -1
        )
        if nidx == -1:
          old_meta['character'][bch_idx]['CharacterScenes'][lch_idx]['Scenes'].append(sc)
        else:
          old_meta['character'][bch_idx]['CharacterScenes'][lch_idx]['Scenes'][nidx] = sc

def update_meta(old_meta, new_meta, saved):
  saved = [int(s) for s in saved]
  pkey_map = {
    'main': 'MChapterId',
    'event': 'MChapterId',
    'side': 'MChapterId',
    'pt': 'MFieldSkillId',
  }
  for stype,pk in pkey_map.items():
    update_general_meta(stype, old_meta, new_meta, saved, pk)
  update_character_meta(old_meta, new_meta, saved)

def save_meta(meta, prefix=''):
  for k, fname in _G.SCENE_METAS.items():
    path = f"{_G.STATIC_FILE_DIRECTORY}/json/{prefix}{fname}"
    if os.path.exists(path):
      with open(path, 'r') as fp:
        with open(path+'.bak', 'w') as fp2:
          json.dump(json.load(fp), fp2)

    with open(path, 'w') as fp:
      json.dump(meta[k], fp)
      log_info(f"{fname} saved")


def save_sponsors(token):
  try:
    p = game.get_profile(token)
  except Exception:
    return
  name,uid = p['Name'],p['DisplayUserId']
  dat = []
  if os.path.exists(_G.SCENE_SPONSOR_ARCHIVE):
    with open(_G.SCENE_SPONSOR_ARCHIVE, 'r') as fp:
      dat = json.load(fp)
    for d in dat:
      if d['DisplayUserId'] == uid:
        return
  dat.append({
    'Name': name,
    'DisplayUserId': uid,
  })
  with open(_G.SCENE_SPONSOR_ARCHIVE, 'w') as fp:
    json.dump(dat, fp)

def interpret_main_scenes(data):
  ret = []
  for dat in data:
    ret.append(game.interpret_data(
      (
        'MChapterId', 'Title', 'WorldLayoutType',
        ('Scenes', list,
          (
            'MSceneId', 'Status',
            (
              'Rewards',  list,
              ('ItemId', 'ItemQuantity', 'UserItemId', 'Sold')
            ),
            'CanStartMQuestId'
          )
        ),
        'MEventId', 'EventSpoilInfoViewModel', 'ChapterSceneType'
      ),
      dat
    ))
  return ret

def interpret_event_scenes(data):
  ret = []
  for dat in data:
    ret.append(game.interpret_data(
      (
        'MChapterId', 'Title', 'WorldLayoutType',
        ('Scenes', list,
          (
            'MSceneId', 'Status',
            (
              'Rewards',  list,
              ('ItemId', 'ItemQuantity', 'UserItemId', 'Sold')
            ),
            'CanStartMQuestId'
          )
        ),
        'MEventId', 'EventSpoilInfoViewModel', 'ChapterSceneType'
      ),
      dat
    ))
  return ret

def interpret_side_scenes(data):
  ret = []
  for dat in data:
    ret.append(game.interpret_data(
      (
        'MChapterId', 'Title', 'WorldLayoutType',
        ('Scenes', list,
          (
            'MSceneId', 'Status',
            (
              'Rewards', list,
              ('ItemId', 'ItemQuantity', 'UserItemId', 'Sold')
            ),
            'CanStartMQuestId'
          )
        ),
        'MEventId', 'EventSpoilInfoViewModel', 'ChapterSceneType'
      ),
      dat
    ))
  return ret

def interpret_character_scenes(data):
  ret = []
  for dat in data:
    ret.append(game.interpret_data(
      (
        'MCharacterBaseId', 'HasNew',
        ('CharacterScenes', list,
          (
            'MCharacterId', 'CurrentKizunaRank',
            ('Scenes', list,
              (
                'MSceneId', 'Status',
                (
                  'Rewards',  list,
                  ('ItemId', 'ItemQuantity', 'UserItemId', 'Sold')
                ),
                'CanStartMQuestId'
              )
            ),
          )
        ),
      ),
      dat
    ))
  return ret

def interpret_scene_data(data):
  return game.interpret_data(
    (
      'MSceneId',
      (
        'MSceneDetailViewModel', list,
        (
          'GroupOrder',
          'ViewOrder',
          'Name',
          'Phrase',
          'PhraseFontSize',
          'PhraseSpeed',
          'IsPhraseCenter',
          'SpeechMCharacterId',
          'IsSpeakingFlags',
          'FrameImage',
          'VoiceFileName',
          'BackgroundImage',
          'BGM',
          'BattleBGM',
          'SE',
          'Effect',
          'BackgroundEffectType',
          (
            'StandCharacters', list,
            ('MCharacterId','Position','Action','Emotion','FacialExpression','EnterAction'),
          ),
          (
            'StillDetail', dict,
            ('AnimationName', 'AnimationSpeed', 'CameraZoomRatio', 'CameraPositionX', 'CameraPositionY', 'CameraWorkDuration', 'CameraRotation')
          ),
          (
            'MSceneChoiceViewModel', dict,
            (
              'Id',
              (
                'Details', list,
                ('Id', 'Order', 'Phrase', 'HasSelected')
              )
            )
          ),
          (
            'MSceneBranchViewModel', dict,
            (
              'Details', list,
              (
                'Conditions', list,
                ('MSceneChoiceDetailId',)
              )
            )
          ),
          'IsEnd',
          'IsChangeAction'
        )
      ),
      (
        'FirstViewRewords', dict,
        (
          'Items',
          'GiftItems',
          'DeletedItemIds'
        )
      ),
      'IsClosed'
    ),
    data
  )

def interpret_pt_scenes(data):
  ret = []
  for dat in data:
    ret.append(game.interpret_data(
      (
        'MFieldSkillId',
        ('Scenes', list,
          (
            'MSceneId', 'Status',
            (
              'Rewards',  list,
              ('ItemId', 'ItemQuantity', 'UserItemId', 'Sold')
            ),
            'CanStartMQuestId'
          )
        ),
      ),
      dat
    ))
  return ret
