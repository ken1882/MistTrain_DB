from datetime import datetime,timedelta
import _G
import os
from flask import Flask
from flask import render_template,jsonify,send_from_directory,request
from _G import log_error,log_info,log_warning,log_debug
import controller.derpy as derpy
import controller.game  as game
import controller.story as story
import datamanager as dm
from config import DevelopmentConfig,ProductionConfig
from threading import Thread
import pytz
from utils import handle_exception,load_navbar
from controller.derpy import req_derpy_ready
from controller.story import req_story_ready

app = Flask(__name__, template_folder='view')
app.initialized = False
app.config['TEMPLATES_AUTO_RELOAD '] = True

ori_render_template = render_template
def render_template(*args, **kwargs):
  kwargs['debug_mode'] = app.debug
  return ori_render_template(*args, **kwargs)

## Routes

@app.route('/', methods=['GET'])
def index():
  return render_template('index.html', navbar_content=get_navbar())


@app.route('/favicon.ico')
def favicon():
  return send_from_directory(os.path.join(app.root_path, 'static'),
                              'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/mistrunner_database', methods=['GET'])
@req_derpy_ready
def derpy_db_index():
  return render_template('derpy_db.html', db_path=_G.DERPY_WAREHOUSE_CONTENT_PATH, navbar_content=get_navbar())

@app.route('/mistrunner_predict', methods=['GET'])
@req_derpy_ready
def derpy_predict_index():
  return render_template('derpy_predict.html', navbar_content=get_navbar())

@app.route('/character_database', methods=['GET'])
def character_database():
  return render_template('character_db.html',
    navbar_content=get_navbar(),
  )

@app.route('/character_database/<id>')
def character_info(id):
  return render_template('character_info.html', 
    navbar_content=get_navbar(),
    ch_id=id,
  )

@app.route('/story_transcript', methods=['GET'])
@req_story_ready
def story_transcript_index():
  return render_template('story_db.html', navbar_content=get_navbar())


@app.route('/mainstory_map/<volume>', methods=['GET'])
@req_story_ready
def story_main_worldmap(volume=1):
  return render_template('main_story.html', 
    navbar_content=get_navbar(),
    vol_id=volume,
  )


@app.route('/story_transcript/<id>', methods=['GET'])
@req_story_ready
def story_view(id=1):
  return render_template('story_view.html', 
    navbar_content=get_navbar(),
    sc_id=id,
  )

## Auxiliary methods / API

@app.route('/static/<path:path>')
def serve_static_resources(path):
    return send_from_directory('static', path)


@app.route('/navbar', methods=['GET'])
def get_navbar():
  return load_navbar()

@app.route('/api/GetNextRace', methods=['GET'])
@req_derpy_ready
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
@req_derpy_ready
def get_next_preditions():
  try:
    result = derpy.get_next_prediction()
    code = 200
    return jsonify(result),code
  except (TypeError, KeyError) as err:
    handle_exception(err)
  return jsonify({}),503

@app.route('/api/GetStoryDetail/<id>', methods=['GET'])
@req_story_ready
def get_story_content(id):
  try:
    return jsonify(dm.get_scene(id)),200
  except (TypeError, KeyError) as err:
    handle_exception(err)
  return jsonify({}),503

## Main functions

def setup():
  derpy.init()
  story.init()
  return
  if not game.is_connected():
    res = game.reauth_game()
    if res == _G.ERRNO_MAINTENANCE:
      log_warning("Server is under maintenance!")
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
  dm.init()
  th = Thread(target=setup)
  th.start()
  _G.ThreadPool['setup'] = th
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