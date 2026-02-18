from flask import Blueprint, request, jsonify
from .scraper import Scraper

# Create Blueprint
api = Blueprint('api', __name__)
scraper = Scraper()

@api.route('/')
def index():
    return 'Ultimate Chords API'

@api.route('/search')
def search():
    query = request.args.get('q')
    if not query:
        return jsonify({'error': 'Missing query parameter q'}), 400
        
    results, error = scraper.search(query)
    
    if error:
        print(f"Search error for {query}: {error}")
        # Return empty list but with error in headers or a specific error object?
        # For now, to solve the mystery, let's return the error in the body if we can
        return jsonify({'error': error, 'results': []}), 500
        
    return jsonify(results)

@api.route('/tab')
def tab():
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
