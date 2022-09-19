import _G
import os, json
import controller.game as game
import controller.ruby as ruby
import datamanager as dm
from flask import render_template
from copy import deepcopy
from datetime import date, datetime, timedelta
from pprint import PrettyPrinter
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
pp = PrettyPrinter(indent=2)


FLOCK = Lock()

IsStoryReady = False
IsStoryInitCalled = False
UploadLock    = False
UploadStatus  = ''

SceneMeta = {}
ExistedScene = set()

MaruHeaders = {
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept': 'text/plain, */*; q=0.01',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Host': 'www.jpmarumaru.com',
  'Origin': 'https://www.jpmarumaru.com',
  'Referer': 'https://www.jpmarumaru.com/tw/toolKanjiFurigana.asp'
}

FlagUpdated = False
UPDATE_HOUR = 4 # 4 am

def init():
  global IsStoryReady,IsStoryInitCalled
  IsStoryInitCalled = True
  load_metas()
  copy_meta_cache()
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

def load_metas():
  global SceneMeta
  files = dm.load_story_meta()
  for k, fname in _G.SCENE_METAS.items():
    for path in files:
      if fname in path and os.path.exists(path):
        with open(path, 'r') as fp:
          SceneMeta[k] = json.load(fp)
          log_info(f"{fname} ready")
  update_scene_cache()

def update_scene_cache():
  global SceneMeta,ExistedScene
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
  
  for ch in SceneMeta['character']:
    for layer in ch['CharacterScenes']:
      for sc in layer['Scenes']:
        sid = sc['MSceneId']
        if is_scene_unlocked('character', sid, sc['Status']):
          ExistedScene.add(sid)

def check_new_available():
  global FlagUpdated
  curt = game.localt2jpt(datetime.now())
  if curt.hour != UPDATE_HOUR:
    FlagUpdated = False
    return
  if FlagUpdated:
    return
  load_metas()
  dm.update_cache(dm.SceneFolder)
  FlagUpdated = True
  log_info("Story meta updated")

def rubifiy_japanese(text):
  res = requests.post(
    "https://www.jpmarumaru.com/tw/api/json_KanjiFurigana.asp",
    'Text='+urllib.parse.quote_plus(text),
    headers=MaruHeaders
  )
  return res.content

def copy_meta_cache():
  for k,fn in _G.SCENE_METAS.items():
    src = f"{_G.STATIC_FILE_DIRECTORY}/json/{fn}"
    dst = f"{_G.STATIC_FILE_DIRECTORY}/json/c_{fn}"
    copyfile(src, dst)

def is_scene_unlocked(_type, id, status):
  if _type == 'main':
    return (id % 100 > 10) or (status == 1)
  elif _type == 'event':
    return status == 5
  elif _type == 'character':
    return (status == 1) or (status == 3)
  return False

# save in tmp folder, add to cache 
# and upload to gdrive after downloaded
# file will need to be rubified before serving
# TODO: make this part prettier
def dump_sponsered_scene(token):
  global UploadLock,SceneMeta,UploadStatus
  if UploadLock:
    return _G.ERROR_LOCKED
  UploadStatus = 'init' # ret for polling status query
  saved = []
  try:
    UploadLock = True
    se = requests.Session()
    se.headers['Authorization'] = token
    UploadStatus = 'meta'
    new_total = 0
    ok_total  = 0
    news  = {}
    nmeta = {}
    for k,uri in _G.SCENE_META_API.items():
      # get metas
      res  = game.get_request(uri, agent=se) 
      # get missing scenes
      news[k] = get_new_scenes(k, res['r'])
      new_total += len(news[k])
      nmeta[k] = res['r']
    
    for k in news:
      UploadStatus = 'download,'+k
      for sid in news[k]:
        # check existance
        path  = f"{_G.DCTmpFolder}/scenes/{sid}.json"
        path2 = f"{_G.STATIC_FILE_DIRECTORY}/scenes/{sid}.json"
        UploadStatus = f"download,{k},{ok_total},{new_total}"
        if os.path.exists(path) or os.path.exists(path2):
          ok_total += 1
          log_info(f"Scene#{id} {game.get_scene(id)['Title']} already exists, skip")
          continue
        res = game.get_request(f"/api/UScenes/{sid}", agent=se)
        data = res['r']
        data['MSceneDetailViewModel'] = sorted(data['MSceneDetailViewModel'], key=lambda o:o['GroupOrder'])
        with FLOCK:
          with open(path, 'w') as fp:
            json.dump(data, fp)
        saved.append(sid)
        ExistedScene.add(sid) # add to cache
        ok_total += 1
        log_info(f"Scene#{id} {game.get_scene(id)['Title']} saved")
    
    UploadStatus = 'process'
    ok_total = 0
    new_total = len(saved)
    for sid in saved:
      src = f"{_G.DCTmpFolder}/scenes/{sid}.json"
      dst = f"{_G.STATIC_FILE_DIRECTORY}/scenes/{sid}.json"
      rbd = ruby.rubifiy_file(src)
      UploadStatus = f"process,{ok_total},{new_total}"
      with FLOCK:
        with open(dst, 'w') as fp:
          json.dump(rbd, fp)
      ok_total += 1
    
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
    
    update_meta(nmeta, done)
    upload_meta()
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
  if sid in ExistedScene:
    return False
  if not is_scene_unlocked(_type, sid, status):
    return False
  return True

def get_new_scenes(_type, scenes):
  global SceneMeta,ExistedScene
  ret = []
  if _type == 'main' or _type == 'event':
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

def update_meta(new_meta, saved):
  global SceneMeta
  for ch in new_meta['main']:
    och_idx = (
      next(
        i for (i, o) in enumerate(SceneMeta['main']) if o['MChapterId'] == ch['MChapterId']
      ), 
      -1
    )
    if och_idx == -1:
      SceneMeta['main'].append(ch)
      continue
    for sc in ch['Scenes']:
      sid = sc['MSceneId']
      if sid not in saved:
        continue
      nidx = (
        next(
          i for (i, o) in enumerate(SceneMeta['main'][och_idx]['Scenes']) if o['MSceneId'] == sid
        ), 
        -1
      )
      if nidx:
        SceneMeta['main'][och_idx]['Scenes'][nidx] = sc
      else:
        SceneMeta['main'][och_idx]['Scenes'].append(sc)
    SceneMeta['main'][och_idx]['Scenes'] = sorted(
      SceneMeta['main'][och_idx]['Scenes'], 
      key=lambda o:o['MSceneId']
    )
  
  SceneMeta['main'] = sorted(
    SceneMeta['main'], 
    key=lambda o:o['MChapterId']
  )
  
  ### 

  for ch in new_meta['event']:
    och_idx = (
      next(
        i for (i, o) in enumerate(SceneMeta['event']) if o['MChapterId'] == ch['MChapterId']
      ), 
      -1
    )
    if och_idx == -1:
      SceneMeta['event'].append(ch)
      continue
    for sc in ch['Scenes']:
      sid = sc['MSceneId']
      if sid not in saved:
        continue
      nidx = (
        next(
          i for (i, o) in enumerate(SceneMeta['event'][och_idx]['Scenes']) if o['MSceneId'] == sid
        ), 
        -1
      )
      if nidx:
        SceneMeta['event'][och_idx]['Scenes'][nidx] = sc
      else:
        SceneMeta['event'][och_idx]['Scenes'].append(sc)
    SceneMeta['event'][och_idx]['Scenes'] = sorted(
      SceneMeta['event'][och_idx]['Scenes'], 
      key=lambda o:o['MSceneId']
    )
  
  SceneMeta['event'] = sorted(
    SceneMeta['event'], 
    key=lambda o:o['MChapterId']
  )
      
  ###

  for base in new_meta['character']:
    bch_idx = (
      next(
        i for (i, o) in enumerate(SceneMeta['character']) if o['MCharacterBaseId'] == base['MCharacterBaseId']
      ), 
      -1
    )
    if bch_idx == -1:
      SceneMeta['character'].append(base)
      continue
    for layer in base['CharacterScenes']:
      lch_idx = (
        next(
          i for (i, o) in enumerate(SceneMeta['character'][bch_idx]['CharacterScenes']) if o['MCharacterId'] == base['MCharacterId']
        ), 
        -1
      )
      if lch_idx == -1:
        SceneMeta['character'][bch_idx]['CharacterScenes'].append(layer)
        continue
      for sc in layer['Scenes']:
        sid = sc['MSceneId']
        if sid not in saved:
          continue
        nidx = (
          next(
            i for (i, o) in enumerate(SceneMeta['character'][bch_idx]['CharacterScenes'][lch_idx]['Scenes']) if o['MSceneId'] == sid
          ), 
          -1
        )
        if nidx:
          SceneMeta['character'][bch_idx]['CharacterScenes'][lch_idx]['Scenes'][nidx] = sc
        else:
          SceneMeta['character'][bch_idx]['CharacterScenes'][lch_idx]['Scenes'].append(sc)

def upload_meta():
  global SceneMeta
  # TODO