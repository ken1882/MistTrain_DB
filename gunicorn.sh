sudo sg www-data -c '/home/compeador/miniconda3/bin/gunicorn --workers 2 --bind=0.0.0.0:5000 --capture-output --log-level debug -m 007 app:app'
