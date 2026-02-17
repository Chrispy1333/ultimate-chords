from flask import Flask
app = Flask(__name__)

# Import and register blueprint
from server.views import api
app.register_blueprint(api, url_prefix='/api')
