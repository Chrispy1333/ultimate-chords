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

    def fetch_with_scrape_do(self, target_url):
        token = "cdf0ed79db184c918ffc2336ccb94b78ceb789c7684"
        encoded_url = urllib.parse.quote(target_url)
        scrape_do_url = f"http://api.scrape.do?token={token}&url={encoded_url}"
        
        try:
            print(f"Attempting Scrape.do fetch for {target_url}")
            # Use a specialized timeout since proxies can be slow
            response = self.scraper.get(scrape_do_url, timeout=60)
            if response.status_code != 200:
                print(f"Scrape.do failed with status {response.status_code}")
                return None
            return response
        except Exception as e:
            print(f"Scrape.do error: {e}")
            return None

    def fetch_data(self, url):
        try:
            # Method 1: Try Scrape.do first
            response = self.fetch_with_scrape_do(url)

            # Method 2: Fallback to direct fetch if Scrape.do failed
            if not response:
                print(f"Falling back to direct fetch for {url}")
                try:
                    response = self.scraper.get(url)
                except Exception as e:
                    print(f"Direct fetch error: {e}")
                    return None, str(e)

            if response.status_code != 200:
                print(f"Failed to fetch {url}: {response.status_code}")
                return None, f"HTTP {response.status_code}"
            
            data = None
            
            # Parsing Logic (Method A): Try js-store div (most reliable)
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
            
            # Parsing Logic (Method B): Fallback to regex/split on window.UGAPP.store.page
            if not data and 'window.UGAPP.store.page = ' in response.text:
                try:
                    json_str = response.text.split('window.UGAPP.store.page = ')[1].split(';')[0]
                    data = json.loads(json_str)
                    print("Extracted data from window.UGAPP.store.page")
                except Exception as e:
                    print(f"Error parsing window.UGAPP.store.page: {e}")
            
            if not data:
                # Check if it's a captcha page or just failed parsing
                if "captcha" in response.text.lower():
                    return None, "Captcha detected"
                return None, "Failed to parse data from page"

            return data, None

        except Exception as e:
            print(f"Error scraping {url}: {e}")
            return None, str(e)

    def search_ddg(self, query):
        print(f"Searching via DDG library for: {query}")
        try:
            from duckduckgo_search import DDGS
            results = []
            
            # search for "query chords ultimate guitar"
            search_query = f"{query} chords ultimate guitar"
            
            with DDGS() as ddgs:
                ddg_gen = ddgs.text(search_query, max_results=10)
                if not ddg_gen:
                    return [], "No DDG results"
                    
                for r in ddg_gen:
                    link = r.get('href', '')
                    title = r.get('title', '')
                    
                    if 'tabs.ultimate-guitar.com/tab/' in link:
                         # Parse details from URL
                        try:
                            parts = link.split('/tab/')[1].split('/')
                            if len(parts) >= 2:
                                artist_slug = parts[0]
                                song_slug = parts[1]
                                
                                artist_name = artist_slug.replace('-', ' ').title()
                                
                                song_parts = song_slug.split('-')
                                if song_parts[-1].isdigit():
                                    song_parts.pop()
                                
                                type_ = "Tab"
                                if 'chords' in song_parts:
                                    type_ = "Chords"
                                elif 'ukulele' in song_parts:
                                    type_ = "Ukulele"
                                elif 'bass' in song_parts:
                                    type_ = "Bass"
                                    
                                song_name = ' '.join(song_parts).title()
                                
                                results.append({
                                    'song_name': song_name,
                                    'artist_name': artist_name,
                                    'type': type_,
                                    'rating': 0,
                                    'votes': 0,
                                    'url': link,
                                    'version': 1,
                                    'tab_access_type': 'public'
                                })
                        except Exception as e:
                            print(f"Error parsing link {link}: {e}")
                            continue

            return results, None
            
        except Exception as e:
            print(f"DDG Lib Error: {e}")
            return [], str(e)

    def search(self, query, type='Tabs'):
        # Try DDG first because UG is blocking Vercel
        print(f"Attempting DDG search for {query}")
        ddg_results, ddg_error = self.search_ddg(query)
        if ddg_results:
            return ddg_results, None
        
        print("DDG failed or returned no results, falling back to UG internal search...")
        
        encoded_query = urllib.parse.quote(query)
        url = f"https://www.ultimate-guitar.com/search.php?value={encoded_query}&search_type=title"
        data, error = self.fetch_data(url)
        
        if error:
            return [], error
            
        results = []
        if data:
            try:
                found_tabs = []
                if 'data' in data:
                    inner_data = data['data']
                    if 'tabs' in inner_data:
                        found_tabs = inner_data['tabs']
                    elif 'results' in inner_data:
                        found_tabs = inner_data['results']
                    elif 'other_tabs' in inner_data:
                         found_tabs = inner_data['other_tabs']
                
                if not found_tabs:
                    if 'tabs' in data:
                        found_tabs = data['tabs']
                    elif 'results' in data:
                        found_tabs = data['results']
                    elif 'other_tabs' in data:
                        found_tabs = data['other_tabs']

                results = found_tabs
                
                cleaned_results = []
                for res in results:
                    cleaned_results.append({
                        'song_name': res.get('song_name'),
                        'artist_name': res.get('artist_name'),
                        'rating': res.get('rating'),
                        'votes': res.get('votes'),
                        'type': res.get('type'),
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
        
        # If blocked, try Google Cache
        if error and "403" in str(error):
            print("Direct fetch failed (403), trying Google Cache...")
            # http://webcache.googleusercontent.com/search?q=cache:URL
            cache_url = f"http://webcache.googleusercontent.com/search?q=cache:{urllib.parse.quote(url)}"
            data, error = self.fetch_data(cache_url)
            
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
