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
pp = PrettyPrinter(indent=2)

IsStoryReady = False

SceneMeta = {}


def req_story_ready(func):
  def wrapper(*args, **kwargs):
    global IsDerpyReady
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