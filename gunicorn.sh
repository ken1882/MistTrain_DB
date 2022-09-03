sudo sg www-data -c '/home/compeador/miniconda3/bin/gunicorn --workers 2 --bind unix:gunicorn.sock --capture-output --log-level debug -m 007 app:app'
