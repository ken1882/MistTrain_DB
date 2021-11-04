from copy import copy
import _G
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
from oauth2client.service_account import ServiceAccountCredentials
import os
import json
import pickle
from _G import log_error,log_debug,log_info,log_warning
from shutil import copyfile

Database = None
RootFolder = None
__FileCache = {}

def init():
  global Database,RootFolder
  try:
    os.mkdir(_G.DCTmpFolder)
  except FileExistsError:
    pass
  if not _G.FlagUseCloudData:
    log_warning("Cloud data is disabled")
    return setup()
  gauth = GoogleAuth()
  gauth.auth_method = 'service'
  gauth.credentials = ServiceAccountCredentials._from_parsed_json_keyfile( \
    json.loads(os.getenv('MTG_SERV_ACC')),
    scopes=["https://www.googleapis.com/auth/drive"]
  )
  Database = GoogleDrive(gauth)
  log_db_info()
  files = get_root_filelist()
  RootFolder = next((f for f in files if f['title'] == _G.DERPY_CLOUD_ROOTFOLDERNAME), None)
  for f in files:
    if not f['parents']:
      continue
    if f['parents'][0]['id'] != RootFolder['id']:
      continue
    set_cache(f)
  setup()
  
def setup():
  load_derpy_db()
  load_derpy_estimators()

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

def get_root_filelist():
  global Database,__FileCache
  if not Database:
    log_error("Database not initialized yet")
    return []
  ret = Database.ListFile().GetList()
  return ret

def set_cache(file):
  __FileCache[f"/{file['title']}"] = file

def get_cache(path):
  if path in __FileCache:
    return __FileCache[path]
  return None

def load_derpy_db():
  dst_path = f"{_G.STATIC_FILE_DIRECTORY}/{_G.DERPY_WAREHOUSE_CONTENT_PATH}"
  if not _G.FlagUseCloudData:
    return dst_path
  files = get_root_filelist()
  for file in files:
    if file['title'] != _G.DERPY_CLOUD_WAREHOUSE:
      continue
    tmp_path = f"{_G.DCTmpFolder}/{_G.DERPY_CLOUD_WAREHOUSE}"
    log_info(f"Downloading {file['title']}")
    file.GetContentFile(tmp_path)
    if os.path.exists(dst_path):
      copyfile(dst_path, f"{dst_path}.bak")
    copyfile(tmp_path, dst_path)
    break
  return dst_path

def upload_derpy_db(data):
  if not _G.FlagUseCloudData:
    log_warning("Attempting to upload while cloud disabled")
    return True
  target = get_cache(f"/{_G.DERPY_CLOUD_WAREHOUSE}")
  if not target:
    files = get_root_filelist()
    for file in files:
      if file['title'] != _G.DERPY_CLOUD_WAREHOUSE:
        continue
      target = file 
      break
  if not target:
    return False
  if target:
    create_cloud_backup(target)
  log_info(f"Uploading {target['title']}")
  target.SetContentString(json.dumps(data))
  target.Upload()
  return True

def create_cloud_backup(src):
  global Database,RootFolder
  if not _G.FlagUseCloudData:
    log_warning("Attempting to upload while cloud disabled")
    return True
  fname = f"{src['title']}.bak"
  target = get_cache(f"/{fname}")
  if not target:
    target = Database.CreateFile({
      'title': fname,
      'parents': [{'kind': 'drive#fileLink', 'id': RootFolder['id']}],
    })
    set_cache(target)
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
  
  files = get_root_filelist()
  for fname in _G.DERPY_CLOUD_ESTIMATORS:
    for file in files:
      if file['title'] != fname:
        continue
      tmp_path = f"{_G.DCTmpFolder}/{fname}"
      log_info(f"Downloading estimator {fname}")
      file.GetContentFile(tmp_path)
      with open(tmp_path, 'rb') as fp:
        _G.DERPY_ESTIMATORS.append(pickle.load(fp))

if __name__ == '__main__':
  init()
  setup()