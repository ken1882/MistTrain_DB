from copy import copy
import _G
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
from oauth2client.service_account import ServiceAccountCredentials
from multiprocessing import Lock
import os
import json
import pickle
from _G import log_error,log_debug,log_info,log_warning
from shutil import copyfile
from datetime import datetime
import pytz

Database    = None
RootFolder  = None
SceneFolder = None
DerpyFolder = None
__FileCache = {}
FLock = Lock()

def init():
  global Database,RootFolder,SceneFolder,DerpyFolder
  try:
    os.mkdir(_G.DCTmpFolder)
  except FileExistsError:
    pass
  if not _G.FlagUseCloudData:
    log_warning("Cloud data is disabled")
    return
  gauth = GoogleAuth()
  gauth.auth_method = 'service'
  gauth.credentials = ServiceAccountCredentials._from_parsed_json_keyfile( \
    json.loads(os.getenv('MTG_SERV_ACC')),
    scopes=["https://www.googleapis.com/auth/drive"]
  )
  Database = GoogleDrive(gauth)
  log_db_info()
  files = get_all_files()
  RootFolder  = next((f for f in files if f['title'] == _G.CLOUD_ROOT_FOLDERNAME), None)
  SceneFolder = next((f for f in files if f['title'] == _G.SCENE_CLOUD_FOLDERNAME), None)
  DerpyFolder = next((f for f in files if f['title'] == _G.DERPY_CLOUD_FOLDERNAME), None)
  for f in files:
    if not f['parents']:
      continue
    fpid = f['parents'][0]['id']
    if fpid == RootFolder['id']:
      set_cache(f)
    elif fpid == DerpyFolder['id']:
      set_cache(f, f"/{_G.DERPY_CLOUD_FOLDERNAME}")
    elif fpid == SceneFolder['id']:
      set_cache(f, f"/{_G.SCENE_CLOUD_FOLDERNAME}")

def log_db_info():
  global Database
  about = Database.GetAbout()
  string  = '\n' + '=' * 42 + '\n'
  string += f"Current username: {about['name']}\n"
  string += f"Root folder ID: {about['rootFolderId']}\n"
  string += f"Total quote (bytes): {about['quotaBytesTotal']}\n"
  string += f"Used quota (bytes): {about['quotaBytesUsed']}\n"
  string += '=' * 42 + '\n'
  log_info(string)

def get_all_files():
  global Database,__FileCache
  if not Database:
    log_error("Database not initialized yet")
    return []
  ret = Database.ListFile().GetList()
  return ret

def set_cache(file, prefix=''):
  __FileCache[f"{prefix}/{file['title']}"] = file

def get_cache(path):
  if path in __FileCache:
    return __FileCache[path]
  return None

def load_derpy_db(year, month):
  filepath,filename = _G.MakeDerpyFilenamePair(year, month)
  dst_path = f"{_G.STATIC_FILE_DIRECTORY}/{filepath}"
  if not _G.FlagUseCloudData:
    return dst_path
  files = get_all_files()
  for file in files:
    if file['title'] != filename:
      continue
    tmp_path = f"{_G.DCTmpFolder}/{filename}"
    log_info(f"Downloading {file['title']}")
    file.GetContentFile(tmp_path)
    if os.path.exists(dst_path):
      copyfile(dst_path, f"{dst_path}.bak")
    copyfile(tmp_path, dst_path)
    break
  return dst_path

def load_all_derpy_db():
  files = []
  for y,m in _G.LoopDerpyYMPair():
    file = load_derpy_db(y, m)
    files.append(file)
  return files

def upload_derpy_db(data, y, m):
  if not _G.FlagUseCloudData:
    log_warning("Attempting to upload while cloud disabled")
    return True
  fname = _G.MakeDerpyFilenamePair(y, m)[1]
  target = get_cache(f"/{_G.DERPY_CLOUD_FOLDERNAME}/{fname}")
  if not target:
    files = get_all_files()
    for file in files:
      if file['title'] != fname:
        continue
      target = file 
      break
  if not target:
    log_warning(f"Cloud file {fname} does not exists, creating new file")
    target = Database.CreateFile({
      'title': fname,
      'parents': [{'kind': 'drive#fileLink', 'id': DerpyFolder['id']}],
    })
    set_cache(target, f"/{_G.DERPY_CLOUD_FOLDERNAME}")
  else:
    create_cloud_backup(target, DerpyFolder)
  log_info(f"Uploading {target['title']}")
  target.SetContentString(json.dumps(data))
  target.Upload()
  return True

def create_cloud_backup(src, parent=None):
  global Database,RootFolder
  if not _G.FlagUseCloudData:
    log_warning("Attempting to upload while cloud disabled")
    return True
  fname = f"{src['title']}.bak"
  prefix = ''
  if parent:
    prefix = f"/{parent['title']}"
  target = get_cache(f"{prefix}/{fname}")
  if not parent:
    parent = RootFolder
  if not target:
    target = Database.CreateFile({
      'title': fname,
      'parents': [{'kind': 'drive#fileLink', 'id': parent['id']}],
    })
    set_cache(target, prefix)
  log_info("Creating cloud backup of", fname)
  target.SetContentString(src.GetContentString())
  target.Upload()
  log_info("Backup complete")

def load_derpy_estimators():
  if not _G.FlagUseCloudData:
    for fname in _G.DERPY_CLOUD_ESTIMATORS:
      tmp_path = f"{_G.DCTmpFolder}/{fname}"
      log_info(f"Loading estimator {fname}")
      with open(tmp_path, 'rb') as fp:
        _G.DERPY_ESTIMATORS.append(pickle.load(fp))
    return
  
  files = get_all_files()
  for fname in _G.DERPY_CLOUD_ESTIMATORS:
    for file in files:
      if file['title'] != fname:
        continue
      tmp_path = f"{_G.DCTmpFolder}/{fname}"
      log_info(f"Downloading estimator {fname}")
      file.GetContentFile(tmp_path)
      with open(tmp_path, 'rb') as fp:
        _G.DERPY_ESTIMATORS.append(pickle.load(fp))

def load_story_meta():
  s_main  = f"/{_G.SCENE_METAS['main']}"
  s_event = f"/{_G.SCENE_METAS['event']}"
  s_chars = f"/{_G.SCENE_METAS['character']}"
  metas = [s_main, s_event, s_chars]
  ret = []
  for filename in metas:
    dst_path = f"{_G.STATIC_FILE_DIRECTORY}/json{filename}"
    ret.append(dst_path)
    if not _G.FlagUseCloudData:
      continue
    file = get_cache(filename)
    if not file:
      log_warning(f"Cloud file {file} is not present")
      continue
    tmp_path = f"{_G.DCTmpFolder}{filename}"
    log_info(f"Downloading {file['title']}")
    file.GetContentFile(tmp_path)
    if os.path.exists(dst_path):
      copyfile(dst_path, f"{dst_path}.bak")
    copyfile(tmp_path, dst_path)
  return ret

def get_scene(id):
  global FLock
  path = f"{_G.STATIC_FILE_DIRECTORY}/scenes/{id}.json"
  if not os.path.exists(path):
    with FLock:
      cpath = f"/{_G.SCENE_CLOUD_FOLDERNAME}/{id}.json"
      file = get_cache(cpath)
      file.GetContentFile(path)
  with open(path, 'r') as fp:
    return json.load(fp)


if __name__ == '__main__':
  init()