'''
This file should run manually alongside `controller.story`,
which with option of `RUBIFY_FILES = False`
'''

import _G
import controller.ruby as ruby
import controller.story as story
import controller.game as game
import datamanager as dm
from glob import glob
import json
import utils
from copy import copy
from threading import Thread
from time import sleep
import re
import os

MaxWorkers  = 8
RubyWorkers = []

def main():
    game.load_database()
    dm.init()
    story.init()
    files = glob(f"{_G.DCTmpFolder}/scenes/*.json")
    news  = []
    for f in files:
        try:
            sid = re.search(r"(\d+).json", f).groups()[0]
        except Exception as err:
            utils.handle_exception(err)
            continue
        cpath = f"/{_G.SCENE_CLOUD_FOLDERNAME}/{sid}.json"
        if dm.get_cache(cpath):
            continue
        news.append(sid)

    new_total = len(news)
    csize = new_total // MaxWorkers
    for chunk in utils.chop(news, csize):
      th = Thread(target=story.rubify_scenes, args=(chunk,))
      RubyWorkers.append(th)
      th.start()
    
    _running = True
    while _running:
      sleep(1)
      _running = not all([not th.is_alive() for th in RubyWorkers])

    _G.log_info('Rubify done, uploading files')
    for sid in news:
        file = f"{_G.STATIC_FILE_DIRECTORY}/scenes/{sid}.json"
        try:
            with open(file, 'r') as fp:
                dm.save_scene(sid, json.load(fp))
        except Exception as err:
            utils.handle_exception(err)
            continue
    
    nmeta = {}
    # load tmp meta and upload as serving meta
    for k, fname in _G.SCENE_METAS.items():
        nmeta[k] = []
        path = f"{_G.STATIC_FILE_DIRECTORY}/json/t_{fname}"
        if not os.path.exists(path):
            continue
        with open(path, 'r') as fp:
            nmeta[k] = json.load(fp)
    print(nmeta.keys())
    story.update_meta(story.SceneMeta, nmeta, news)
    story.save_meta(story.SceneMeta)
    dm.upload_story_meta(copy(story.SceneMeta))

if __name__ == '__main__':
    main()