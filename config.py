import os
from flask import Config

class DevelopmentConfig(Config):
  ENV = 'development'
  DEBUG = True
  TESTING = True
  SERVER_NAME = 'localhost:5000'
  SECRET_KEY = os.getenv('MTG_SECRET_KEY')


class ProductionConfig(Config):
  ENV = 'production'
  SECRET_KEY = os.getenv('MTG_SECRET_KEY')
  DEBUG = False
  TESTING = False