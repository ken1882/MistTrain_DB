from datetime import datetime,timedelta
import _G
import os
from flask import Flask, make_response, redirect, abort
from flask import render_template,jsonify,send_from_directory,request
from _G import log_error,log_info,log_warning,log_debug
import controller.derpy as derpy
import controller.game  as game
import controller.story as story
import datamanager as dm
from config import DevelopmentConfig,ProductionConfig
from threading import Thread
import pytz
import auth
from utils import handle_exception,load_navbar
from controller.derpy import req_derpy_ready
from controller.story import req_story_ready
from urllib.parse import quote
from base64 import b64decode, b64encode
from datetime import datetime, timedelta

app = Flask(__name__, template_folder='view')
app.initialized = False
app.config['TEMPLATES_AUTO_RELOAD '] = True

ori_render_template = render_template
def render_template(*args, **kwargs):
  kwargs['debug_mode'] = app.debug
  return ori_render_template(*args, **kwargs)

## Auth

@app.route('/auth/discord/redirect', methods=['GET'])
def discord_oauth():
  res  = make_response(render_template('redirect.html', navbar_content=get_navbar()))
  code = request.args.get('code')
  if code:
    tokens = auth.issue_token(code)
    if not tokens:
      return res
    atoken = tokens['access_token']
    res.set_cookie('atoken', atoken)
    res.set_cookie('rtoken', tokens['refresh_token'])
  return res

# @app.route('/auth/discord/refresh', methods=['POST'])
# def discord_reauth():
#   token = request.args.get('token')
#   if token:
#     res = auth.refresh_token(token)
#     if res.status_code == 200:
#       return jsonify(res),200
#   return jsonify({}),400

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

@app.route('/character_database/<id>/bedroom')
def character_bedroom(id):
  res_ok = make_response(render_template('character_bedroom.html', 
    navbar_content=get_navbar(),
    ch_id=id,
  ))
  msg = auth.verify_request(request, response=[res_ok])
  if msg == _G.MSG_PIPE_REAUTH:
    ainfo = auth.get_dcauth_info()
    dest = quote(
      "https://discord.com/oauth2/authorize?" + \
      f"response_type={ainfo['type']}&client_id={ainfo['client_id']}&" + \
      f"scope={ainfo['scope']}&redirect_uri={ainfo['callback']}"
    )
    return redirect(f"/auth/discord/redirect?dir=out&callback={request.path}&dest={dest}")
  elif msg == _G.MSG_PIPE_CONT:
    res_ok.set_cookie('btoken', 
      b64encode('ミストトレインガールズ～霧の世界の車窓から～ X '.encode()).decode(),
      expires=datetime.now()+timedelta(days=30)
    )
    return res_ok
  elif msg == _G.MSG_PIPE_STOP:
    res = _G.PipeRetQueue.popleft()
    return jsonify(res.json()),res.status_code
  
  res_ban = make_response(jsonify({'msg': 'Forbidden'}), 403)
  res_ban.set_cookie('btoken', 
      b64encode('ミストトレインガールズ～霧の世界の車窓から～'.encode()).decode(),
      expires=datetime.now()+timedelta(days=3)
    )
  return res_ban
  
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

@app.route('/fieldskill_db', methods=['GET'])
def fieldskill_index():
  return render_template('field_skill.html', navbar_content=get_navbar())

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
  return jsonify({}),503

@app.route('/api/GetNextRacePredition', methods=['GET'])
@req_derpy_ready
def get_next_preditions():
  return jsonify({}),503

@app.route('/api/GetStoryDetail/<id>', methods=['GET'])
@req_story_ready
def get_story_content(id):
  return jsonify({}),503

## Main functions

def setup():
  derpy.init()
  story.init()
  if not _G.FlagUseCloudData:
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
      story.check_new_available()
    except (TypeError, KeyError) as err:
      log_warning("Server seems is under maintenance")
      handle_exception(err)
    log_debug("Server ticked")


if not app.initialized:
  app.initialized = True
  dm.init()
  # th = Thread(target=setup)
  # th.start()
  # _G.ThreadPool['setup'] = th
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