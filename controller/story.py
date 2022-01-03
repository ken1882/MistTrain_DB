import enum
import _G
import os, json
import controller.game as game
import datamanager as dm
from flask import Response
from copy import deepcopy
from datetime import date, datetime, timedelta
from pprint import PrettyPrinter
from _G import log_warning,log_debug,log_error,log_info
from utils import handle_exception
from time import mktime,strptime
import pytz
import requests
import urllib.parse
pp = PrettyPrinter(indent=2)

IsStoryReady = False

SceneMeta = {}

MaruHeaders = {
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept': 'text/plain, */*; q=0.01',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Host': 'www.jpmarumaru.com',
  'Origin': 'https://www.jpmarumaru.com',
  'Referer': 'https://www.jpmarumaru.com/tw/toolKanjiFurigana.asp'
}

def req_story_ready(func):
  def wrapper(*args, **kwargs):
    global IsStoryReady
    if not IsStoryReady:
      return Response('"Please retry later"', status=202, mimetype="application/json")
    return func(*args, **kwargs)
  wrapper.__name__ = func.__name__
  return wrapper

def init():
  global IsStoryReady
  load_metas()
  IsStoryReady = True

def load_metas():
  files = dm.load_story_meta()
  for k, fname in _G.SCENE_METAS.items():
    for path in files:
      if fname in path and os.path.exists(path):
        log_info(f"{fname} ready")

def rubifiy_japanese(text):
  res = requests.post(
    "https://www.jpmarumaru.com/tw/api/json_KanjiFurigana.asp",
    'Text='+urllib.parse.quote_plus(text),
    headers=MaruHeaders
  )
  return res.content

