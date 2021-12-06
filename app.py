from datetime import datetime,timedelta
import _G
import os
from flask import Flask
from flask import render_template,jsonify,send_from_directory
from _G import log_error,log_info,log_warning,log_debug
import controller.derpy as derpy
import controller.game  as game
import datamanager as dm
from config import DevelopmentConfig,ProductionConfig
from threading import Thread
import pytz
from utils import handle_exception

app = Flask(__name__, template_folder='view')
app.initialized = False
app.config['TEMPLATES_AUTO_RELOAD '] = True

ori_render_template = render_template
def render_template(*args, **kwargs):
  kwargs['debug_mode'] = app.debug
  return ori_render_template(*args, **kwargs)

@app.route('/', methods=['GET'])
def index():
  return render_template('index.html', navbar_content=get_navbar())

@app.route('/favicon.ico')
def favicon():
  return send_from_directory(os.path.join(app.root_path, 'static'),
                              'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/mistrunner_database', methods=['GET'])
def derpy_db_index():
  return render_template('derpy_db.html', db_path=_G.DERPY_WAREHOUSE_CONTENT_PATH, navbar_content=get_navbar())

@app.route('/mistrunner_predict', methods=['GET'])
def derpy_predict_index():
  return render_template('derpy_predict.html', navbar_content=get_navbar())

@app.route('/character_database', methods=['GET'])
def character_database():
  return render_template('character_db.html',
    navbar_content=get_navbar(),
    ch_aw=_G.CHARACTER_AVATAR_SRC_SIZE[0],
    ch_ah=_G.CHARACTER_AVATAR_SRC_SIZE[1],
    ch_fw=_G.CHARACTER_FRAME_SRC_SIZE[0],
    ch_fh=_G.CHARACTER_FRAME_SRC_SIZE[1],
  )

@app.route('/character_database/<id>')
def character_info(id):
  return render_template('character_info.html', 
    navbar_content=get_navbar(),
    ch_id=id,
    ch_aw=_G.CHARACTER_AVATAR_SRC_SIZE[0],
    ch_ah=_G.CHARACTER_AVATAR_SRC_SIZE[1],
    ch_fw=_G.CHARACTER_FRAME_SRC_SIZE[0],
    ch_fh=_G.CHARACTER_FRAME_SRC_SIZE[1],
  )

@app.route('/story_transcript', methods=['GET'])
def story_transcript_index():
  return render_template('story_db.html', navbar_content=get_navbar())

## Auxiliary methods

@app.route('/static/<path:path>')
def serve_static_resources(path):
    return send_from_directory('static', path)


@app.route('/navbar', methods=['GET'])
def get_navbar():
  ret = _G.GetCacheString('navbar.html')
  if ret:
    return ret.replace("'" ,'"')
  with open('view/navbar.html') as fp:
    ret = fp.read()
    ret = ret.replace('\n', '').replace('\r','').replace('"',"'")
  _G.SetCacheString('navbar.html', ret)
  return ret.replace("'" ,'"')

@app.route('/api/GetNextRace', methods=['GET'])
def get_next_race():
  try:
    race = derpy.get_upcoming_race()
    code = 200
    if _G.KEY_ERRNO in race:
      code = race[_G.KEY_ERRNO]
    return jsonify(race),code
  except (TypeError, KeyError) as err:
    handle_exception(err)
  return jsonify({}),503

@app.route('/api/GetNextRacePredition', methods=['GET'])
def get_next_preditions():
  try:
    result = derpy.get_next_prediction()
    code = 200
    return jsonify(result),code
  except (TypeError, KeyError) as err:
    handle_exception(err)
  return jsonify({}),503


def setup():
  dm.init()
  derpy.init()
  return
  if not game.is_connected():
    res = game.reauth_game()
    if res == _G.ERRNO_MAINTENANCE:
      log_warning("Server is under maintenance!")
    else:
      pass
      # log_info("Sweeping race history")
      # sbegin = int(os.getenv('MTG_DERPY_SWEEP_BEGIN') or 0)
      # derpy.sweep_race_replays(sbegin)
      # log_info("Saving race history")
      # derpy.save_database(_G.DerpySavedRaceContent)
      # log_info("Race history saved")
  if 'game' not in _G.ThreadPool:
    _G.ThreadPool['game'] = Thread(target=loop_game_listner, daemon=True)
    _G.ThreadPool['game'].start()

def loop_game_listner():
  while _G.FlagRunning:
    _G.wait(_G.SERVER_TICK_INTERVAL)
    try:
      derpy.update_race_history_db()
    except (TypeError, KeyError) as err:
      log_warning("Server seems is under maintenance")
      handle_exception(err)
    log_debug("Server ticked")


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