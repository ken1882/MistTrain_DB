import _G
from flask import Flask
from flask import render_template
import controller.derpy

app = Flask(__name__, template_folder='view')
app.config['TEMPLATES_AUTO_RELOAD '] = True

@app.route('/')
def index():
  return render_template('index.html')

@app.route('/mistrunner_database')
def derpy_db_index():
  return render_template('derpy_db.html', db_path=_G.DERPY_WAREHOUSE_CONTENT_PATH)

@app.route('/mistrunner_predict')
def derpy_predict_index():
  return render_template('derpy_predict.html')

def setup():
  _G.DerpyRaceData = controller.derpy.load_database()

if __name__ == '__main__':
  setup()
  app.run('0.0.0.0', port=5000, debug=True)