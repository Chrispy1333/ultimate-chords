import cloudscraper
import json
import urllib.parse

class Scraper:
    def __init__(self):
        self.scraper = cloudscraper.create_scraper(
            browser={
                'custom': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            }
        )

    def fetch_data(self, url):
        try:
            print(f"Fetching {url}")
            response = self.scraper.get(url)
            if response.status_code != 200:
                print(f"Failed to fetch {url}: {response.status_code}")
                return None
            
            data = None
            
            # Method 1: Try js-store div (most reliable)
            try:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(response.content, 'html.parser')
                store_div = soup.find('div', class_='js-store')
                if store_div:
                    data_content = store_div.get('data-content')
                    if data_content:
                        full_store = json.loads(data_content)
                        # Navigate to the page data
                        data = full_store.get('store', {}).get('page', {}).get('data', {})
                        print("Extracted data from js-store")
            except Exception as e:
                print(f"Error parsing js-store: {e}")

            # Method 2: Fallback to regex/split on window.UGAPP.store.page
            if not data and 'window.UGAPP.store.page = ' in response.text:
                try:
                    json_str = response.text.split('window.UGAPP.store.page = ')[1].split(';')[0]
                    data = json.loads(json_str)
                    print("Extracted data from window.UGAPP.store.page")
                except Exception as e:
                    print(f"Error parsing window.UGAPP.store.page: {e}")

            return data

        except Exception as e:
            print(f"Error scraping {url}: {e}")
            return None

    def search(self, query, type='Tabs'):
        # Navigate to search query
        # Type 'Tabs' ensures we get chords/tabs mostly
        encoded_query = urllib.parse.quote(query)
        # url = f"https://www.ultimate-guitar.com/explore?value={encoded_query}&type={type}"
        url = f"https://www.ultimate-guitar.com/search.php?value={encoded_query}&search_type=title"
        data, error = self.fetch_data(url)
        
        if error:
            return [], error
            
        results = []
        if data:
            try:
                # The data structure from store.page.data often contains 'data'
                # which then contains 'tabs' or 'results'
                
                # Direct access attempts based on common UG structures
                found_tabs = []
                
                if 'data' in data:
                    inner_data = data['data']
                    if 'tabs' in inner_data:
                        found_tabs = inner_data['tabs']
                    elif 'results' in inner_data:
                        found_tabs = inner_data['results']
                    elif 'other_tabs' in inner_data:
                         found_tabs = inner_data['other_tabs']
                
                # If not found in inner data, check top level of page data
                if not found_tabs:
                    if 'tabs' in data:
                        found_tabs = data['tabs']
                    elif 'results' in data:
                        found_tabs = data['results']
                    elif 'other_tabs' in data:
                        found_tabs = data['other_tabs']

                results = found_tabs
                
                # Normalize results
                cleaned_results = []
                for res in results:
                    cleaned_results.append({
                        'song_name': res.get('song_name'),
                        'artist_name': res.get('artist_name'),
                        'rating': res.get('rating'),
                        'votes': res.get('votes'),
                        'type': res.get('type'), # Chords, Tab, etc.
                        'url': res.get('tab_url'),
                        'version': res.get('version'),
                        'tab_access_type': res.get('tab_access_type')
                    })
                return cleaned_results, None
            except Exception as e:
                print(f"Error parsing search results: {e}")
                return [], str(e)
        
        return [], "No data found"

    def get_tab(self, url):
        data, error = self.fetch_data(url)
        if error:
            return None, error
            
        if not data:
            return None, "No data found"
            
        try:
            tab_view = data.get('tab_view', {})
            wiki_tab = tab_view.get('wiki_tab', {})
            meta = tab_view.get('meta', {})
            
            return {
                'song_name': meta.get('song_name'),
                'artist_name': meta.get('artist_name'),
                'content': wiki_tab.get('content'),
                'tuning': meta.get('tuning'),
                'key': meta.get('tonality_name'),
                'capo': meta.get('capo'),
                'url': url
            }, None
        except Exception as e:
            print(f"Error parsing tab data: {e}")
            return None, str(e)
