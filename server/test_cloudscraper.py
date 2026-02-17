import cloudscraper
import json

def test_cloudscraper():
    url = "https://tabs.ultimate-guitar.com/tab/eagles/hotel_california_chords_46190"
    scraper = cloudscraper.create_scraper()
    print(f"Testing fetching tab with Cloudscraper: {url}")
    try:
        response = scraper.get(url)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Success! Got content.")
            # Verify it's not a captcha page
            if "Just a moment" in response.text:
                print("Still blocked by Cloudflare (captcha page returned with 200? unlikely but possible)")
            else:
                print(f"Content length: {len(response.text)}")
                # Quick check for data
                if "js-store" in response.text:
                    print("Found js-store! Data is likely accessible.")
                else: 
                    print("js-store not found, might have different structure or still blocked.")
        else:
            print(f"Failed with status {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_cloudscraper()
