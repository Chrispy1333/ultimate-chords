import requests
from server.tab_parser import dict_from_ultimate_tab
import json

def test_fetch_tab():
    url = "https://tabs.ultimate-guitar.com/tab/eagles/hotel_california_chords_46190"
    print(f"Testing fetching tab: {url}")
    try:
        # The provided API uses requests.get without headers in tab_parser.py
        # I'll try to use the function directly to see if it works
        data = dict_from_ultimate_tab(url)
        print("Success!")
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error fetching tab: {e}")
        # Try nicely with headers to see if that fixes it
        try:
            print("Retrying with headers...")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            html = requests.get(url, headers=headers).content
            if b'Just a moment' in html or b'Access denied' in html: # Cloudflare challenge
                print("Cloudflare blocked.")
                print(str(html[:500]))
            else:
                 # We can't easily pass this html to dict_from_ultimate_tab as it expects a URL
                 # But we can check if it works.
                 print(f"Got content, length: {len(html)}")
        except Exception as ex:
             print(f"Retry failed: {ex}")

if __name__ == "__main__":
    test_fetch_tab()
