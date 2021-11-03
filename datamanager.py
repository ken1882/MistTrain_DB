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
__FileCache = {}

def init():
  global Database
  try:
    os.mkdir(_G.DCTmpFolder)
  except FileExistsError:
    pass
  gauth = GoogleAuth()
  gauth.auth_method = 'service'
  gauth.credentials = ServiceAccountCredentials._from_parsed_json_keyfile( \
    json.loads(os.getenv('MTG_SERV_ACC')),
    scopes=["https://www.googleapis.com/auth/drive"]
  )
  Database = GoogleDrive(gauth)
  log_db_info()

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
  for file in ret:
    __FileCache[f"/{file['title']}"] = file
  return ret

def get_cache(path):
  if path in __FileCache:
    return __FileCache[path]
  return None

def load_derpy_db():
  files = get_root_filelist()
  for file in files:
    if file['title'] != _G.DERPY_CLOUD_WAREHOUSE:
      continue
    tmp_path = f"{_G.DCTmpFolder}/{_G.DERPY_CLOUD_WAREHOUSE}"
    log_info(f"Downloading {file['title']}")
    file.GetContentFile(tmp_path)
    dst_path = f"{_G.STATIC_FILE_DIRECTORY}/{_G.DERPY_WAREHOUSE_CONTENT_PATH}"
    copyfile(tmp_path, dst_path)
    break
  return dst_path

def upload_derpy_db(data):
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
  log_info(f"Uploading {target['title']}")
  target.SetContentString(json.dumps(data))
  target.Upload()
  return True

def load_derpy_estimators():
  files = get_root_filelist()
  for file in files:
    fname = file['title']
    if fname not in _G.DERPY_CLOUD_ESTIMATORS:
      continue
    tmp_path = f"{_G.DCTmpFolder}/{fname}"
    log_info(f"Downloading estimator {fname}")
    file.GetContentFile(tmp_path)
    with open(tmp_path, 'rb') as fp:
      _G.DERPY_ESTIMATORS.append(pickle.load(fp))

if __name__ == '__main__':
  init()
  load_derpy_db()
  load_derpy_estimators()