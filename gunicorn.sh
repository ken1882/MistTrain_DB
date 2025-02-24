#!/bin/sh
GUNICORN_PATH=/home/compeador/.asdf/installs/python/3.11.8/bin/gunicorn
bash -c "$GUNICORN_PATH --timeout 180 --workers 2 --bind=0.0.0.0:5000 --capture-output --log-level debug -m 007 app:app"
