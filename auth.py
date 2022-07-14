from dotenv import load_dotenv
import os
import requests

load_dotenv()
DC_AUTH_APP_SECRET  = os.getenv('DCAUTH_APP_SECRET')
DC_AUTH_SERVER_ROLE = (os.getenv('DCAUTH_SERVER_ROLE') or '').split(':')
DC_AUTH_CLIENT_INFO = (os.getenv('DCAUTH_CLIENT_INFO') or '').split(':')
DC_AUTH_CLIENT_INFO[-1] = DC_AUTH_CLIENT_INFO[-1].split('&')

'''
https://discord.com/oauth2/authorize?response_type=token&client_id=896819089832554556&scope=guilds%20identify%20guilds.members.read&redirect_uri=http://localhost/auth/discord/redirect

import requests
se = requests.Session()
se.headers['Authorization'] = 'Bearer %token%'
res = se.get('https://discord.com/api/users/@me/guilds/757987970954559489/member')
'''

def is_auth_available():
    return DC_AUTH_CLIENT_INFO and DC_AUTH_SERVER_ROLE and DC_AUTH_APP_SECRET

def verify_token(token):
    if not is_auth_available():
        return False
    res = requests.get(f"https://discord.com/api/users/@me/guilds/{DC_AUTH_SERVER_ROLE[0]}/member",
        headers={'Authorization': f"Bearer {token}"}
    )
    if res.status_code != 200:
        return False
    try:
        if DC_AUTH_SERVER_ROLE[1] in res.json()['roles']:
            return True
    except Exception:
        pass
    return False

def issue_token(code):
    if not is_auth_available():
        return None
    res = requests.post(f"https://discord.com/api/oauth2/token", {
        'client_id': DC_AUTH_CLIENT_INFO[1],
        'client_secret': DC_AUTH_APP_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': 'http://localhost/auth/discord/redirect'
    }, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    if res.status_code != 200:
        return None
    return res.json()

def get_dcauth_info():
    if not DC_AUTH_CLIENT_INFO:
        return None
    return {
        'response_type': DC_AUTH_CLIENT_INFO[0],
        'client_id': DC_AUTH_CLIENT_INFO[1],
        'scope': DC_AUTH_CLIENT_INFO[2],
    }