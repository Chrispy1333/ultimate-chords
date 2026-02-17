import requests
from bs4 import BeautifulSoup
import json
import sys

def search_ug(query):
    # Try the explore URL first
    url = f"https://www.ultimate-guitar.com/explore?value={query}&type=Tabs"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    }
    
    print(f"Searching: {url}")
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # UG often embeds data in a script tag "window.UGAPP.store.page"
        store_div = soup.find('div', class_='js-store')
        if store_div:
            data_content = store_div.get('data-content')
            if data_content:
                data = json.loads(data_content)
                # Look for data.store.page.data.other_tabs or similar
                # The structure varies, but usually under 'data' -> 'data' -> 'tabs'
                print("Found js-store data!")
                # Debug: print keys
                # print(data.keys())
                
                # Navigate strictly to find tabs
                # This path is a guess based on common React hydration patterns on UG
                try:
                    tabs = data.get('store', {}).get('page', {}).get('data', {}).get('data', {}).get('tabs', [])
                    if not tabs:
                        # try 'other_tabs' or just 'data'
                        tabs = data.get('store', {}).get('page', {}).get('data', {}).get('other_tabs', [])
                    
                    if not tabs:
                         # try 'results'
                         tabs = data.get('store', {}).get('page', {}).get('data', {}).get('results', [])

                    print(f"Found {len(tabs)} tabs via store")
                    for tab in tabs[:5]:
                        print(f"- {tab.get('song_name')} by {tab.get('artist_name')} ({tab.get('marketing_type')}) [{tab.get('tab_url')}]")
                    return
                except Exception as e:
                    print(f"Error parsing store data: {e}")
                    
        else:
            print("No js-store div found.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "hotel california"
    search_ug(query)
