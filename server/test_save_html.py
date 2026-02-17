from server.scraper import Scraper
import logging

logging.basicConfig(level=logging.ERROR)

def save_html():
    scraper = Scraper()
    url = "https://www.ultimate-guitar.com/explore?value=hotel%20california&type=Tabs"
    print(f"Fetching {url}...")
    response = scraper.scraper.get(url)
    print(f"Status: {response.status_code}")
    
    with open('server/debug_search.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
    print("Saved to server/debug_search.html")

if __name__ == "__main__":
    save_html()
