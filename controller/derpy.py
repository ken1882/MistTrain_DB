import _G
import os, json
import fileinput
import game
from pprint import PrettyPrinter
pp = PrettyPrinter(indent=2)


def load_header():
  if not os.path.exists(_G.DERPY_WAREHOUSE_HAEDER_PATH):
    return []
  ret = []
  with open(_G.DERPY_WAREHOUSE_HAEDER_PATH, 'r') as fp:
    for line in fp:
      ret.append(int(line))
  return ret

def save_header(dat, append=True):
  with open(_G.DERPY_WAREHOUSE_HAEDER_PATH, 'a' if append else 'w') as fp:
    if type(dat) == int:
      fp.write(f"{dat}\n")
    else:
      for n in dat:
        fp.write(f"{n}\n")

def load_database_incremental():
  if not os.path.exists(_G.DERPY_WAREHOUSE_CONTENT_PATH):
    yield {}
  else:
    for line in fileinput.input([_G.DERPY_WAREHOUSE_CONTENT_PATH]):
      yield line

def load_database():
  if not os.path.exists(_G.DERPY_WAREHOUSE_CONTENT_PATH):
    return []
  ret = []
  with open(_G.DERPY_WAREHOUSE_CONTENT_PATH, 'r') as fp:
    for line in fp:
      ret.append(json.loads(line))
  return ret

def save_database(dat, append=True):
  with open(_G.DERPY_WAREHOUSE_CONTENT_PATH, 'a' if append else 'w') as fp:
    if type(dat) == list:
      for obj in dat:
        fp.write(f"{json.dumps(obj)}\n")
    else:
      fp.write(f"{json.dumps(dat)}\n")

def get_upcoming_race():
  res = game.Session.post('https://mist-train-east4.azurewebsites.net/api/Casino/Race/GetPaddock')
  return res['r']['data']