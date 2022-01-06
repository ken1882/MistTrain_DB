import enum
import _G
import os, json
import controller.game as game
import datamanager as dm
from flask import render_template
from copy import deepcopy
from datetime import date, datetime, timedelta
from pprint import PrettyPrinter
from _G import log_warning,log_debug,log_error,log_info
from time import mktime,strptime
from threading import Thread
import pytz
import requests
import urllib.parse
import utils
pp = PrettyPrinter(indent=2)

IsStoryReady = False
IsStoryInitCalled = False

SceneMeta = {}

MaruHeaders = {
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept': 'text/plain, */*; q=0.01',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Host': 'www.jpmarumaru.com',
  'Origin': 'https://www.jpmarumaru.com',
  'Referer': 'https://www.jpmarumaru.com/tw/toolKanjiFurigana.asp'
}

def init():
  global IsStoryReady,IsStoryInitCalled
  IsStoryInitCalled = True
  load_metas()
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

