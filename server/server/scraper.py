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
                return None, f"HTTP {response.status_code}"
            
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
        print(f"Searching via DDG for: {query}")
        search_query = f"{query} chords ultimate guitar"
        encoded_query = urllib.parse.quote(search_query)
        url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
        
        try:
            # We use the existing scraper but for DDG
            # DDG might block cloudscraper if it looks too bot-like, but usually html version is fine
            response = self.scraper.get(url)
            if response.status_code != 200:
                print(f"DDG Failed: {response.status_code}")
                return [], f"DDG HTTP {response.status_code}"
                
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.content, 'html.parser')
            
            results = []
            for result in soup.select('.result'):
                title_elem = result.select_one('.result__a')
                if not title_elem:
                    continue
                    
                link = title_elem['href']
                
                # Check if it's an ultimate-guitar tab link
                if 'tabs.ultimate-guitar.com/tab/' in link:
                    # Clean up URL (DDG might wrap it)
                    if 'uddg=' in link:
                         # /l/?kh=-1&uddg=https%3A%2F%2Ftabs.ultimate-guitar.com...
                         try:
                             from urllib.parse import parse_qs, urlparse
                             parsed = urlparse(link)
                             qs = parse_qs(parsed.query)
                             if 'uddg' in qs:
                                 link = qs['uddg'][0]
                         except:
                             pass

                    # Parse details from URL
                    # https://tabs.ultimate-guitar.com/tab/artist-name/song-name-type-123456
                    try:
                        parts = link.split('/tab/')[1].split('/')
                        if len(parts) >= 2:
                            artist_slug = parts[0]
                            song_slug = parts[1]
                            
                            # Clean up artist name
                            artist_name = artist_slug.replace('-', ' ').title()
                            
                            # Clean up song name
                            # song-name-chords-12345
                            # Remove ID at end
                            song_parts = song_slug.split('-')
                            if song_parts[-1].isdigit():
                                song_parts.pop()
                            
                            # Detect type from slug if possible
                            type_ = "Tab"
                            if 'chords' in song_parts:
                                type_ = "Chords"
                                # optional: remove 'chords' from name? 
                                # usually "song-name-chords" -> Song Name
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
            print(f"DDG Error: {e}")
            return [], str(e)

    def search(self, query, type='Tabs'):
        # Try DDG first because UG is blocking Vercel
        print(f"Attempting DDG search for {query}")
        ddg_results, ddg_error = self.search_ddg(query)
        if ddg_results:
            return ddg_results, None
        
        print("DDG failed or returned no results, falling back to UG internal search...")
        
        # Navigate to search query
        # Type 'Tabs' ensures we get chords/tabs mostly
        encoded_query = urllib.parse.quote(query)
        # url = f"https://www.ultimate-guitar.com/explore?value={encoded_query}&type={type}"
        url = f"https://www.ultimate-guitar.com/search.php?value={encoded_query}&search_type=title"
        data, error = self.fetch_data(url)
        
        if error:
            # If DDG also failed, return the error from UG (likely 403)
            # Or maybe combine them?
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
