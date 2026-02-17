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
        
    results = scraper.search(query)
    return jsonify(results)

@api.route('/tab')
def tab():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'Missing url parameter'}), 400

    tab_data = scraper.get_tab(url)
    if not tab_data:
        return jsonify({'error': 'Failed to fetch tab data'}), 500
        
    return jsonify(tab_data)
