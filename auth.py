from base64 import b64decode,b64encode
from dotenv import load_dotenv
import os
import requests
import _G
from _G import log_debug,log_error,log_info,log_warning
from datetime import date, datetime, timedelta
import random,time,hashlib

load_dotenv()
DC_AUTH_APP_SECRET   = os.getenv('DCAUTH_APP_SECRET')
DC_AUTH_CALLBACK_URI = os.getenv('DCAUTH_CALLBACK_URI')
DC_AUTH_SERVER_ROLE  = (os.getenv('DCAUTH_SERVER_ROLE') or '').split(':')
DC_AUTH_CLIENT_INFO  = (os.getenv('DCAUTH_CLIENT_INFO') or '').split(':')
DC_AUTH_CLIENT_INFO[-1] = ' '.join(DC_AUTH_CLIENT_INFO[-1].split('&'))

def init():
    global RSA_PRIVATEKEY
    try:
        RSA_PRIVATEKEY = rsa.PrivateKey(*[int(h,16) for h in b64decode(RSA_PRIVATEKEY).split(',')])
    except Exception as err:
        log_error("Error while loading private key:". err)
    return True

def is_auth_available():
    return DC_AUTH_CLIENT_INFO and DC_AUTH_SERVER_ROLE and DC_AUTH_APP_SECRET and DC_AUTH_CALLBACK_URI

def is_refresh_needed(timestamp):
    curt = int(datetime.now().timestamp())
    return curt - timestamp > 60 * 60 * 12 # 12 hours

def verify_request(request, response=[]):
    '''
    response: Response to set new tokens if refreshed
    '''
    atoken = request.cookies.get('atoken')
    rtoken = request.cookies.get('rtoken')
    btoken = request.cookies.get('btoken')
    msg = None
    try:
        magic = b64decode(btoken).decode()
        if magic == 'ミストトレインガールズ～霧の世界の車窓から～ X ':
            msg = _G.MSG_PIPE_CONT
        elif magic == 'ミストトレインガールズ～霧の世界の車窓から～':
            return _G.MSG_PIPE_UNAUTH
    except Exception:
        pass
    if not msg:
        log_debug('Request token:', atoken, rtoken)
        msg = verify_bedroom_access(atoken)
    if msg == _G.MSG_PIPE_CONT:
        try:
            ttoken = int(request.cookies.get('ttoken')) or 0
        except Exception:
            ttoken = 0
        if is_refresh_needed(ttoken):
            tokens = refresh_token(rtoken)
            if tokens:
                curt = int(datetime.now().timestamp())
                for res in response:
                    exp = datetime.now()+timedelta(days=7)
                    res.set_cookie('atoken', tokens['access_token'],  expires=exp)
                    res.set_cookie('rtoken', tokens['refresh_token'], expires=exp)
                    res.set_cookie('ttoken', str(curt), expires=exp)
    return msg

def verify_bedroom_access(token):
    if not token:
        return _G.MSG_PIPE_REAUTH
    if not is_auth_available():
        return _G.MSG_PIPE_ERROR
    res = requests.get(f"https://discord.com/api/users/@me/guilds/{DC_AUTH_SERVER_ROLE[0]}/member",
        headers={'Authorization': f"Bearer {token}"}
    )
    log_debug("Guild Info:\n", res, res.content)
    if res.status_code == 429:
        _G.PipeRetQueue.append(res)
        return _G.MSG_PIPE_STOP
    elif res.status_code == 401:
        return _G.MSG_PIPE_REAUTH
    elif res.status_code == 200:
        try:
            if DC_AUTH_SERVER_ROLE[1] in res.json()['roles']:
                return _G.MSG_PIPE_CONT
        except Exception:
            pass
    return _G.MSG_PIPE_UNAUTH

def issue_token(code):
    if not is_auth_available():
        return None
    res = requests.post('https://discord.com/api/oauth2/token', {
        'client_id': DC_AUTH_CLIENT_INFO[1],
        'client_secret': DC_AUTH_APP_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': DC_AUTH_CALLBACK_URI,
    }, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    log_debug("Issue token:", res, res.content)
    if res.status_code != 200:
        return None
    return res.json()

def refresh_token(token):
    if not is_auth_available():
        return None
    res = requests.post('https://discord.com/api/oauth2/token', {
        'client_id': DC_AUTH_CLIENT_INFO[1],
        'client_secret': DC_AUTH_APP_SECRET,
        'grant_type': 'refresh_token',
        'refresh_token': token,
    }, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    log_debug("Refresh token:", res, res.content)
    if res.status_code != 200:
        return None
    return res.json()

def get_dcauth_info():
    if not DC_AUTH_CLIENT_INFO:
        return None
    return {
        'type': DC_AUTH_CLIENT_INFO[0],
        'client_id': DC_AUTH_CLIENT_INFO[1],
        'scope': DC_AUTH_CLIENT_INFO[2],
        'callback': DC_AUTH_CALLBACK_URI,
    }

def generate_sessionid(length=0x30):
    allowed_chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    random.seed(
        hashlib.sha256(
            ("%s%s%s" % (
                random.getstate(),
                time.time(),
                'ミストトレインガールズ')).encode('utf-8')
        ).digest()
    )
    return ''.join(random.choice(allowed_chars) for _ in range(length))
