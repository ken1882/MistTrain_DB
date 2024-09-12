import _G
from _G import log_debug,log_error,log_info,log_warning
import datamanager as dm
from controller import story, derpy
from datetime import datetime, timedelta
from utils import handle_exception

# lazy method, shall use individual queue for each worker
WORK_TIMEOUT = timedelta(hours=1)

WorkQueue = []

def set_signal(k, v):
    _G.SetCacheString(f"SIG_{k}", v)

def get_signal(k):
    _G.GetCacheString(f"SIG_{k}")

def flag_reload():
    set_signal('reload', '1')

def process_reload():
    WorkQueue.append(('reload', datetime.now()))
    dm.update_cache()
    story.init()

def update_queue():
    global WorkQueue
    queue = []
    for pair in WorkQueue:
        if datetime.now() - pair[1] > WORK_TIMEOUT:
            set_signal(pair[0], '')
            continue
        queue.append(pair)
    WorkQueue = queue

def check_reload():
    if any([p[0] == 'reload' for p in WorkQueue]):
        return
    if not get_signal('reload'):
        return
    process_reload()

def update_story():
    try:
        story.check_new_available()
    except Exception as err:
        log_error("Error while updating story cache")
        handle_exception(err)

def update_derpy():
    derpy.update_race_history_db()

def update():
    check_reload()
    update_story()
    # update_derpy()