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
import os, sys

MaxWorkers  = 1 # more then 1 will rate limited using yahoo's service
RubyWorkers = []

def scan_err_files():
    files = glob('static/scenes/*.json')
    for f in files:
        try:
            with open(f, 'r') as fp:
                data = json.load(fp)
            if 'MSceneDetailViewModel' not in data:
                continue
            for dia in data['MSceneDetailViewModel']:
                if 'Ruby' not in dia or '<span>' not in dia['Ruby']:
                    print(f, dia['Ruby'])
                    break
        except Exception:
            pass

def main():
    game.load_database()
    dm.init()
    dm.update_cache()
    story.init()
    files = glob(f"{_G.DCTmpFolder}/scenes/*.json")
    news  = []
    force = '-f' in sys.argv
    for f in files:
        try:
            sid = re.search(r"(\d+).json", f).groups()[0]
            sid = int(sid)
        except Exception as err:
            utils.handle_exception(err)
            continue
        cpath = f"/{_G.SCENE_CLOUD_FOLDERNAME}/{sid}.json"
        if not force and dm.get_cache(cpath):
            _G.log_info(f"Scene already on cloud: {cpath}, skip")
            continue
        news.append(sid)

    _G.log_info("New scenes:", news)
    if not news:
        _G.log_info('No new scenes, abort')
        return
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

# patch scene status if exists
def patch():
    for ch in story.SceneMeta['main']:
        for sc in ch['Scenes']:
            sid = sc['MSceneId']
            cpath = f"/{_G.SCENE_CLOUD_FOLDERNAME}/{sid}.json"
            if not dm.get_cache(cpath):
                continue
            sc['Status'] = 1
    for ch in story.SceneMeta['event']:
        for sc in ch['Scenes']:
            sid = sc['MSceneId']
            cpath = f"/{_G.SCENE_CLOUD_FOLDERNAME}/{sid}.json"
            if not dm.get_cache(cpath):
                continue
            sc['Status'] = 1
    for base in story.SceneMeta['character']:
        for layer in base['CharacterScenes']:
            for sc in layer['Scenes']:
                sid = sc['MSceneId']
                cpath = f"/{_G.SCENE_CLOUD_FOLDERNAME}/{sid}.json"
                if not dm.get_cache(cpath):
                    continue
                sc['Status'] = 1
    for ch in story.SceneMeta['side']:
        for sc in ch['Scenes']:
            sid = sc['MSceneId']
            cpath = f"/{_G.SCENE_CLOUD_FOLDERNAME}/{sid}.json"
            if not dm.get_cache(cpath):
                continue
            sc['Status'] = 1
    for ch in story.SceneMeta['pt']:
        for sc in ch['Scenes']:
            sid = sc['MSceneId']
            cpath = f"/{_G.SCENE_CLOUD_FOLDERNAME}/{sid}.json"
            if not dm.get_cache(cpath):
                continue
            sc['Status'] = 1
    story.save_meta(story.SceneMeta)
    dm.upload_story_meta(copy(story.SceneMeta))

if __name__ == '__main__':
    main()
    patch()
    print("Errored files:")
    print(ruby.ErrorFiles)