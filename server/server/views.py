from server import app
from flask import request, jsonify
from .scraper import Scraper

scraper = Scraper()

@app.route('/')
def index():
    return 'Ultimate Chords API'

@app.route('/search')
def search():
    query = request.args.get('q')
    if not query:
        return jsonify({'error': 'Missing query parameter q'}), 400
        
    results = scraper.search(query)
    return jsonify(results)

@app.route('/tab')
def tab():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'Missing url parameter'}), 400

    tab_data = scraper.get_tab(url)
    if not tab_data:
        return jsonify({'error': 'Failed to fetch tab data'}), 500
        
    return jsonify(tab_data)
