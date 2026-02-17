import os
import sys

# Add the 'server' folder (one level up from api) to sys.path
# This allows 'import server' to find the inner 'server' package
sys.path.append(os.path.join(os.path.dirname(__file__), '../server'))

from server import app
