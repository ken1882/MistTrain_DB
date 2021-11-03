import _G
import os, json
import fileinput
import controller.game as game
import datamanager as dm
from pprint import PrettyPrinter
pp = PrettyPrinter(indent=2)


def load_database():
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

def get_upcoming_race():
  res = game.Session.post('https://mist-train-east4.azurewebsites.net/api/Casino/Race/GetPaddock')
  return res['r']['data']