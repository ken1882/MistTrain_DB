from datetime import datetime,timedelta
import _G
import os
from flask import Flask, make_response, redirect, abort
from flask import render_template,jsonify,send_from_directory,request
from _G import log_error,log_info,log_warning,log_debug
import controller.derpy as derpy
import controller.game  as game
import controller.story as story
import controller.dmm as dmm
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
app.config['TEMPLATES_AUTO_RELOAD'] = True

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

@app.route('/api/login/pwd', methods=['POST'])
def dmm_login():
  return jsonify({'status': 503}),503
  email = request.form.get('email')
  pwd   = request.form.get('password')
  reme  = (not not request.form.get('remember'))
  try:
    ret = dmm.login(email, pwd, reme)
  except Exception as err:
    handle_exception(err, debug=True)
    ret = {'status': 403}
  if ret['status'] == 200:
    if 'totp' not in ret:
      try:
        ret['mtg_result'] = dmm.login_game(ret['result'])
      except Exception as err:
        handle_exception(err, debug=True)
        ret = {'status': 403}
  return jsonify(ret),ret['status']

@app.route('/api/login/totp', methods=['POST'])
def dmm_login_totp():
  return jsonify({'status': 503}),503
  b64ck = request.form.get('b64ck')
  token = request.form.get('token')
  pin   = request.form.get('pin')
  try:
    ret = dmm.login_totp(b64ck, token, pin)
  except Exception as err:
    handle_exception(err, debug=True)
    ret = {'status': 403}
  
  try:
    ret['mtg_result'] = dmm.login_game(ret['result'])
  except Exception as err:
    handle_exception(err, debug=True)
    ret = {'status': 403}
  
  return jsonify(ret),ret['status']

@app.route('/api/login/game', methods=['POST'])
def mtg_login():
  return jsonify({'status': 503}),503
  b64ck = request.form.get('b64ck')
  try:
    ret = dmm.login_game(b64ck)
  except Exception as err:
    handle_exception(err, debug=True)
    ret = {'status': 403}
  return jsonify(ret),ret['status']

@app.route('/api/game_server', methods=['GET'])
def get_game_server_url():
  ret = game.ServerLocation
  if not ret:
    ret = game.determine_server()
  if ret == _G.ERRNO_MAINTENANCE:
    ret = {'status': 503}
  else:
    ret = {'status': 200, 'uri': ret}
  return jsonify(ret),ret['status']

## Routes

@app.route('/', methods=['GET'])
def index():
  return render_template('index.html', navbar_content=get_navbar())

@app.route('/favicon.ico')
def favicon():
  return send_from_directory(os.path.join(app.root_path, 'static'),
                              'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/dmmlogin', methods=['GET'])
def login_dmm():
  return render_template('login_dmm.html', navbar_content=get_navbar())

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

@app.route('/character_scene', methods=['GET'])
@req_story_ready
def character_scene_db_index():
  return render_template('character_scene_db.html', navbar_content=get_navbar())

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

@app.route('/spine_editor', methods=['GET'])
def speditor_index():
  return render_template('spine_editor.html', navbar_content=get_navbar())

@app.route('/party_builder', methods=['GET'])
def partybuilder_index():
  return render_template('party_builder.html', navbar_content=get_navbar())

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
  return jsonify({'status': 503}),503
  try:
    race = derpy.get_upcoming_race()
    code = 200
    if _G.KEY_ERRNO in race:
      code = race[_G.KEY_ERRNO]
      if code == _G.ERRNO_UNAVAILABLE:
        code = 503
    return jsonify(race),code
  except (TypeError, KeyError) as err:
    handle_exception(err)
  return jsonify({}),503

@app.route('/api/GetNextRacePrediction', methods=['GET'])
@req_derpy_ready
def get_next_predictions():
  return jsonify({'status': 503}),503
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
  lang = request.args.get('lang')
  try:
    return jsonify(dm.get_scene(id, lang)),200
  except (TypeError, KeyError) as err:
    handle_exception(err)
  return jsonify({}),503

@app.route('/api/AvailableCharacterScene', methods=['GET'])
@req_story_ready
def get_available_character_scene():
  try:
    return jsonify(story.CharacterSceneCache),200
  except (TypeError, KeyError) as err:
    handle_exception(err)
  return jsonify({}),500

@app.route('/api/SponsorScenes', methods=['POST'])
def spnosor_scene():
  return jsonify({'status': 503}),503
  token = request.form.get('token')
  msg = story.dump_sponspred_scene(token)
  if msg == _G.ERROR_LOCKED:
    return jsonify({'msg': 'Locked'}),409
  if msg == _G.ERRNO_UNAUTH:
    return jsonify({'msg': 'Unauthorized'}),401
  if msg == _G.ERRNO_UNAVAILABLE:
    return jsonify({'msg': 'Maintenance'}),403
  elif msg == _G.ERRNO_OK:
    return jsonify({'msg': 'OK'}),200
  return jsonify({'msg': 'Error'}),500

@app.route('/api/GetOAuthToken', methods=['POST'])
def decrypt_token():
  token_a = request.form.get('token_a')
  token_b = request.form.get('token_b')
  msg = dmm.decrypt_token(token_a, token_b)
  if msg == _G.ERROR_LOCKED:
    return jsonify({'msg': 'Locked'}),409
  if msg == _G.ERRNO_UNAUTH:
    return jsonify({'msg': 'Unauthorized'}),401
  if msg == _G.ERRNO_UNAVAILABLE:
    return jsonify({'msg': 'Maintenance'}),403
  return jsonify({'msg': 'OK', 'token': msg, 'server': game.ServerLocation}),200

## Main functions

def setup():
  dm.update_cache()
  # derpy.init()
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
    except Exception as err:
      log_warning("Server seems is under maintenance")
      handle_exception(err)
    try:
      story.check_new_available()
    except Exception as err:
      log_error("Error while updating story cache")
      handle_exception(err)
    # log_debug("Server ticked")


if not app.initialized:
  app.initialized = True
  dm.init()
  th = Thread(target=setup)
  th.start()
  _G.ThreadPool['setup'] = th
  if _G.PRODUCTION:
    app.config.from_object(ProductionConfig)
  else:
    app.config.from_object(DevelopmentConfig)

if __name__ == '__main__':
  try:
    _G.ClearCache()
    app.run()
  finally:
    _G.FlagRunning = False
    for k,th in _G.ThreadPool.items():
      _G.log_info(f"Waiting for worker `{k}` to stop")
