from server.scraper import Scraper
import json
import sys

def debug_url(url):
    scraper = Scraper()
    print(f"Scraping {url}...")
    data = scraper.fetch_data(url)
    
    if not data:
        print("No data returned!")
        return

    # print keys to see structure
    print("Top level keys:", data.keys())
    
    if 'tab_view' in data:
        print("tab_view keys:", data['tab_view'].keys())
        if 'meta' in data['tab_view']:
            print("meta:", json.dumps(data['tab_view']['meta'], indent=2))
        else:
            print("No 'meta' in tab_view")

    if 'tab' in data:
        print("tab:", json.dumps(data['tab'], indent=2))
    else:
        print("No 'tab' key in data")
        # Check if it's somewhere else
        print("Full data structure (truncated):", str(data)[:500])

if __name__ == "__main__":
    url = "https://tabs.ultimate-guitar.com/tab/hillsong-worship/broken-vessels-amazing-grace-chords-1486963"
    debug_url(url)
