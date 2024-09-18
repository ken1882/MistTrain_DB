import _G, utils
from _G import log_debug,log_error,log_info,log_warning
import datamanager as dm
from copy import copy
from controller import story, derpy
from datetime import datetime, timedelta
from utils import handle_exception

# Lazy method, shall use individual queue for each worker.
# When a work/job is start processing, it'll push the job's name
# into `WorkQueue` to prevent duplicate job for each worker.
# The job is expected to finish in `WORK_TIMEOUT`.
DEFAULT_WORK_TIMEOUT = timedelta(hours=1)
JobQueue = []

class WorkerBase:
    def __init__(self, name:str, **kwargs):
        self.name = name
        self.kwargs = kwargs
        if 'timeout' not in kwargs:
            kwargs['timeout'] = copy(DEFAULT_WORK_TIMEOUT)
        else:
            pass
        if 'created_at' not in kwargs:
            kwargs['created_at'] = datetime.now()
        for k, v in kwargs.items():
            self.__setattr__(k, v)
    def __str__(self):
        return type(self) + str(vars(self))

class WorkerJob(WorkerBase):
    pass

def set_signal(k, v):
    return _G.SetCacheString(f"SIG_{k}", v)

def get_signal(k):
    return _G.GetCacheString(f"SIG_{k}")

def get_job(k):
    return next((w for w in JobQueue if w.name == k), None)

def sig_reload():
    return set_signal('reload', '1')

def process_reload():
    JobQueue.append(WorkerJob('reload'))
    dm.update_cache()
    story.init()

def update_queue():
    global JobQueue
    queue = []
    for w in JobQueue:
        if datetime.now() - w.created_at > w.timeout:
            set_signal(w.name, '')
            continue
        queue.append(w)
    JobQueue = queue

def is_job_doable(k):
    if get_job(k): # job queued
        return False
    if not get_signal(k): # not signaled
        return False
    return True

def check_reload():
    if not is_job_doable('reload'):
        return
    process_reload()

def update_story():
    if datetime.now().hour == 4:
        set_signal('story', '1')
    if not is_job_doable('story'):
        return
    try:
        JobQueue.append(WorkerJob('story', timeout=timedelta(days=1)))
        story.check_new_available()
    except Exception as err:
        log_error("Error while updating story cache")
        handle_exception(err)

def update_derpy():
    if not is_job_doable('derpy'):
        return
    JobQueue.append(WorkerJob('derpy'))
    derpy.update_race_history_db()

def update():
    update_queue()
    check_reload()
    update_story()
    # update_derpy()