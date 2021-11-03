from datetime import datetime
import threading
from typing import final
import _G
import os
from flask import Flask
from flask import render_template
import controller.derpy as derpy
import controller.game  as game
from config import DevelopmentConfig,ProductionConfig
from threading import Thread

app = Flask(__name__, template_folder='view')
app.config['TEMPLATES_AUTO_RELOAD '] = True

ori_render_template = render_template
def render_template(*args, **kwargs):
  kwargs['debug_mode'] = app.debug
  return ori_render_template(*args, **kwargs)

@app.route('/')
def index():
  return render_template('index.html')

@app.route('/mistrunner_database')
def derpy_db_index():
  return render_template('derpy_db.html', db_path=_G.DERPY_WAREHOUSE_CONTENT_PATH)

@app.route('/mistrunner_predict')
def derpy_predict_index():
  return render_template('derpy_predict.html')

def setup():
  _G.DerpyRaceData = derpy.load_database()
  with _G.MutexLock:
    # if not game.is_connected():
    #   game.reauth_game()

    if 'game' not in _G.ThreadPool:
      _G.ThreadPool['game'] = Thread(target=loop_game_listner)
      _G.ThreadPool['game'].start()

def loop_game_listner():
  while _G.FlagRunning:
    _G.wait(_G.SERVER_TICK_INTERVAL)
    print(datetime.now())

if __name__ == '__main__':
  if not os.environ.get("WERKZEUG_RUN_MAIN"):
    setup()
  
  if (os.getenv('FLASK_ENV') or '').lower() == 'production':
    app.config.from_object(ProductionConfig)
  else:
    app.config.from_object(DevelopmentConfig)
  
  try:
    app.run()
  finally:
    _G.FlagRunning = False
    for k,th in _G.ThreadPool.items():
      _G.log_info(f"Waiting for worker `{k}` to stop")
      th.join()