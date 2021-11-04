from datetime import datetime,timedelta
import _G
import os
from flask import Flask
from flask import render_template,jsonify
from _G import log_error,log_info,log_warning,log_debug
import controller.derpy as derpy
import controller.game  as game
import datamanager as dm
from config import DevelopmentConfig,ProductionConfig
from threading import Thread
import pytz

app = Flask(__name__, template_folder='view')
app.initialized = False
app.config['TEMPLATES_AUTO_RELOAD '] = True

ori_render_template = render_template
def render_template(*args, **kwargs):
  kwargs['debug_mode'] = app.debug
  return ori_render_template(*args, **kwargs)

@app.route('/', methods=['GET'])
def index():
  return render_template('index.html')

@app.route('/mistrunner_database', methods=['GET'])
def derpy_db_index():
  return render_template('derpy_db.html', db_path=_G.DERPY_WAREHOUSE_CONTENT_PATH)

@app.route('/mistrunner_predict', methods=['GET'])
def derpy_predict_index():
  return render_template('derpy_predict.html')

@app.route('/api/GetNextRace', methods=['GET'])
def get_next_race():
  race = derpy.get_upcoming_race()
  code = 200
  if _G.KEY_ERRNO in race:
    code = 503
  return jsonify(race),code

@app.route('/api/GetNextRacePredition', methods=['GET'])
def get_next_preditions():
  result = derpy.get_next_prediction()
  code = 200
  return jsonify(result),code

def setup():
  dm.init()
  derpy.init()
  if not game.is_connected():
    game.reauth_game()
    log_info("Sweeping race history")
    sbegin = int(os.getenv('MTG_DERPY_SWEEP_BEGIN') or 0)
    derpy.sweep_race_replays(sbegin)
    log_info("Saving race history")
    derpy.save_database(_G.DerpySavedRaceContent)
    log_info("Race history saved")
  if 'game' not in _G.ThreadPool:
    _G.ThreadPool['game'] = Thread(target=loop_game_listner, daemon=True)
    _G.ThreadPool['game'].start()

def loop_game_listner():
  last_scan_time = datetime.now(tz=pytz.timezone('Asia/Tokyo'))
  max_scan_time  = timedelta(days=1)
  min_scan_time  = timedelta(minutes=30)
  while _G.FlagRunning:
    _G.wait(_G.SERVER_TICK_INTERVAL)
    curt = datetime.now(tz=pytz.timezone('Asia/Tokyo'))
    elapsed = curt - last_scan_time
    if elapsed > max_scan_time or \
        (curt.hour in _G.DerpyUpdateHour and elapsed > min_scan_time):
      derpy.save_recent_races()


if not app.initialized:
  app.initialized = True
  setup()
  if (os.getenv('FLASK_ENV') or '').lower() == 'production':
    app.config.from_object(ProductionConfig)
  else:
    app.config.from_object(DevelopmentConfig)

if __name__ == '__main__':
  try:
    app.run()
  finally:
    _G.FlagRunning = False
    for k,th in _G.ThreadPool.items():
      _G.log_info(f"Waiting for worker `{k}` to stop")