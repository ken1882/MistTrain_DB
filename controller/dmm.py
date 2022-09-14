import _G
import os
import requests
import json
from _G import log_error,log_info,log_debug,log_warning,wait
from utils import get_last_error,handle_exception,set_last_error
from requests.exceptions import *
from bs4 import BeautifulSoup as BS
from base64 import b64encode,b64decode
import pytz

def login(username, password):
    se = requests.Session()
    res  = se.get('https://accounts.dmm.co.jp/service/login/password')
    page = BS(res.content, 'html.parser')
    form = {
        'token': page.find('input', {'name': 'token'})['value'],
        'path':   '',
        'prompt': '',
        'device': '',
    }
    ret = {'status': 400}
    form['login_id'],form['password'] = username,password
    res2 = se.post('https://accounts.dmm.co.jp/service/login/password/authenticate', form)
    if res2.status_code != 200:
        log_info("Failed to login DMM Account:", res2, '\n', res2.content)
        ret['status'] = res2.status_code
        return ret

    if 'login/totp' in res2.url:
        ret['status'] = 100
        page  = BS(res2.content, 'html.parser')
        ret['token'] = page.find('input', {'name': 'token'})['value']
        return ret
    
    ret['result'] = b64encode(stringify_cookies(se.cookies).encode()).decode()
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
    if 'login' in res.url:
        ret['status'] = 401
        return ret
    ret['result'] = b64encode(stringify_cookies(se.cookies).encode()).decode()
    return ret

def stringify_cookies(jar):
    raw_cookies = ''
    for k in jar.keys():
        raw_cookies += f"{k}={jar[k]};"
    return raw_cookies

def load_cookies(sjar):
    ret = {}
    for line in sjar.split(';'):
      seg = line.strip().split('=')
      k = seg[0]
      v = '='.join(seg[1:])
      ret[k] = v
    return ret
