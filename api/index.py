import os
import sys

# Get the directory of the current file (api/index.py)
current_dir = os.path.dirname(os.path.abspath(__file__))

# The 'server' package is in specific folder structure: root/server/server
# We need to add 'root/server' to sys.path so we can do 'from server import app'
# root/server contains the outer 'server' package which contains __init__.py and inner 'server' package
server_dir = os.path.join(current_dir, '..', 'server')

if os.path.exists(server_dir):
    sys.path.append(server_dir)
else:
    # Fallback or debug
    print(f"Warning: {server_dir} does not exist", file=sys.stderr)

try:
    from server import app
except ImportError as e:
    print(f"Error importing app: {e}", file=sys.stderr)
    print(f"sys.path: {sys.path}", file=sys.stderr)
    raise e
