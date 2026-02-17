from server.scraper import Scraper
import json
import logging

# Configure logging to see cloudscraper/requests output if needed
logging.basicConfig(level=logging.DEBUG)

def debug_scraper():
    scraper = Scraper()
    
    print("--- Testing Search ---")
    results = scraper.search("hotel california")
    print(f"Search Results: {len(results)}")
    if results:
        print(results[0])
    
    print("\n--- Testing Tab Fetch ---")
    url = "https://tabs.ultimate-guitar.com/tab/eagles/hotel_california_chords_46190"
    tab = scraper.get_tab(url)
    print("Tab Data:")
    print(json.dumps(tab, indent=2))

if __name__ == "__main__":
    import sys
    query = "hotel california"
    if len(sys.argv) > 1:
        query = sys.argv[1]
    
    print(f"--- Testing Search: {query} ---")
    scraper = Scraper()
    results = scraper.search(query)
    print(f"Found {len(results)} results")
    if results:
        print("First result:")
        print(json.dumps(results[0], indent=2))
