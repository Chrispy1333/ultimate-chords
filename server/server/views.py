from flask import Blueprint, request, jsonify
from .scraper import Scraper

# Create Blueprint
api = Blueprint('api', __name__)
scraper = Scraper()

@api.route('/')
def index():
    return 'Ultimate Chords API'

@api.errorhandler(Exception)
def handle_exception(e):
    # Print exception for logs
    import traceback
    traceback.print_exc()
    return jsonify({'error': f"Internal Server Error: {str(e)}"}), 500

@api.route('/search')
def search():
    try:
        query = request.args.get('q')
        if not query:
            return jsonify({'error': 'Missing query parameter q'}), 400
            
        results, error = scraper.search(query)
        
        if error:
            print(f"Search error for {query}: {error}")
            return jsonify({'error': error, 'results': []}), 500
            
        return jsonify(results)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Search crash: {str(e)}"}), 500

@api.route('/tab')
def tab():
    try:
        url = request.args.get('url')
        if not url:
            return jsonify({'error': 'Missing url parameter'}), 400

        tab_data, error = scraper.get_tab(url)
        
        if error:
            print(f"Tab error for {url}: {error}")
            return jsonify({'error': error}), 500
            
        if not tab_data:
            return jsonify({'error': 'Failed to fetch tab data'}), 404
            
        return jsonify(tab_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Tab crash: {str(e)}"}), 500
