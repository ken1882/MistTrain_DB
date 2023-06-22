import _G
import os
import re
import requests
import json
from ast import literal_eval
from _G import log_error,log_info,log_debug,log_warning,wait
from utils import get_last_error,handle_exception,set_last_error
from requests.exceptions import *
from bs4 import BeautifulSoup as BS
from base64 import b64encode,b64decode
from html import unescape
from urllib.parse import unquote,urlparse,urlencode
from cryptography.hazmat.primitives import serialization,hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
import pytz

def login(username, password, remember=False):
    se = requests.Session()
    res  = se.get('https://accounts.dmm.co.jp/service/login/password')
    page = BS(res.content, 'html.parser')
    form = {
        'token': page.find('input', {'name': 'token'})['value'],
        'path':   '',
        'prompt': '',
        'device': '',
    }
    if remember:
        form['save_login_id'] = '1'
        form['save_password'] = '1'
        form['use_auto_login'] = '1'
    
    ret = {'status': 400}
    form['login_id'],form['password'] = username,password
    res2 = se.post('https://accounts.dmm.co.jp/service/login/password/authenticate', form)
    if res2.status_code != 200 or 'login/password' in res2.url:
        log_info("Failed to login DMM Account for:", username)
        with open('.tmp/tmp.html', 'w') as fp:
            fp.write(res2.content.decode())
        try:
            page = BS(res2.content, 'html.parser')
            ret['msg'] = page.select('#loginbutton_script_on')[0].find('p').text
            log_info("Message:", ret['msg'])
        except Exception:
            pass
        ret['status'] = 401 if res2.status_code == 200 else res2.status_code
        return ret

    ret['result'] = b64encode(stringify_cookies(se.cookies).encode()).decode()
    log_info("Success login DMM Account for:", username)
    if 'login/totp' in res2.url:
        ret['status'] = 200
        page  = BS(res2.content, 'html.parser')
        ret['token'] = page.find('input', {'name': 'token'})['value']
        ret['totp'] = True
        return ret
    ret['status'] = 200
    return ret

def login_totp(b64ck, token, pin):
    se = requests.Session()
    ret = {'status': 400}
    form = {
        'token': token,
        'totp': pin,
        'path': '',
        'device': ''
    }
    for k,v in load_cookies(b64decode(b64ck).decode()).items():
        se.cookies.set(k, v)
    res = se.post('https://accounts.dmm.co.jp/service/login/totp/authenticate', form)
    rsc = res.status_code
    if rsc != 200 or 'login' in res.url:
        with open('.tmp/tmp2.html', 'w') as fp:
            fp.write(res.content.decode())
        ret['status'] = 401 if rsc == 200 else rsc
        return ret
    ret['result'] = b64encode(stringify_cookies(se.cookies).encode()).decode()
    ret['status'] = 200
    return ret

def stringify_cookies(jar):
    raw_cookies = ''
    for k,v in jar.items():
        raw_cookies += f"{k}={v};"
    return raw_cookies

def load_cookies(sjar):
    ret = {}
    for line in sjar.split(';'):
      seg = line.strip().split('=')
      k = seg[0]
      if not k:
        continue
      v = '='.join(seg[1:])
      ret[k] = v
    return ret

def login_game(b64ck):
    se = requests.Session()
    ret = {'status': 400}
    for k,v in load_cookies(b64decode(b64ck).decode()).items():
        se.cookies.set(k, v)
    res  = se.get('https://pc-play.games.dmm.co.jp/play/MistTrainGirlsX/')
    page = res.content.decode('utf8')
    inf_raw = re.search(r"var gadgetInfo = {((?:.*?|\n)*?)};", page)
    try:
        inf_raw = inf_raw.group(0)
    except Exception as err:
        with open('.errorpage.html', 'w') as fp:
            fp.write(page)
        raise err
    inf     = {}
    for line in inf_raw.split('\n'):
      line = [l.strip() for l in line.split(':')]
      if len(line) < 2:
        continue
      inf[line[0].lower()] = literal_eval(line[1].strip()[:-1])
    
    inf['url'] = unescape(unquote(inf['url']))
    inf['st']  = unquote(inf['st'])
    tmp  = inf['url'].split('&url=')[-1].split('&st=')
    _url = [u for u in tmp if u[:4] == 'http'][0]
    urld = urlparse(_url)
    se.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    server_host = f"{urld.scheme}://{urld.hostname}"
    payload = {
    'url': f"{server_host}/api/DMM/auth?fromGadget=true",
    'gadget': _url,
    'st': inf['st'],
    'httpMethod': 'POST',
    'headers': 'Content-Type=application%2Fx-www-form-urlencoded',
    'postData': 'key=value',
    'authz': 'signed',
    'contentType': 'JSON',
    'numEntries': '3',
    'getSummaries': 'false',
    'signOwner': 'true',
    'signViewer': 'true',
    'container': 'dmm',
    'bypassSpecCache': '',
    'getFullHeaders': 'false',
    'oauthState': '',
    'OAUTH_SIGNATURE_PUBLICKEY': 'key_2032',
    }
    log_debug("Try game login")
    payload = urlencode(payload)
    res = se.post('https://osapi.dmm.com/gadgets/makeRequest', payload)
    log_debug("Response:", res)
    content = ''.join(res.content.decode('utf8').split('>')[1:])
    data = json.loads(content)
    log_debug(data)
    if "'rc': 403" in str(data):
        ret['status'] = 403
        return ret
    new_token = json.loads(data[list(data.keys())[0]]['body'])
    ret['mtg_token'] = f"Bearer {new_token['r']}"
    ret['server'] = server_host
    ret['status'] = 200
    return ret

def decrypt_token(a, b):
    try:
        private_key = serialization.load_pem_private_key(os.getenv('MTG_TOKEN_PVKEY').encode(), password=None)
    except Exception as err:
        handle_exception(err)
        return _G.ERRNO_UNAVAILABLE
    try:
        ret_a = private_key.decrypt(
            b64decode(a.encode()),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        ).decode()
        ret_b = private_key.decrypt(
            b64decode(b.encode()),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        ).decode()
    except Exception:
        return _G.ERRNO_UNAUTH
    return ret_a+ret_b[1:] if ret_a[-1] == ret_b[0] else ret_a+ret_b
