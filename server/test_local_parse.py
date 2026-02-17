from bs4 import BeautifulSoup
import json

def debug_local_html():
    print("Reading server/debug_search.html...")
    with open('server/debug_search.html', 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    store_div = soup.find('div', class_='js-store')
    
    if store_div:
        print("Found js-store div")
        data_content = store_div.get('data-content')
        if data_content:
            print(f"Found data-content (length: {len(data_content)})")
            try:
                data = json.loads(data_content)
                print("Successfully parsed JSON from data-content")
                # print keys
                print("Keys:", data.keys())
                
                page_data = data.get('store', {}).get('page', {}).get('data', {})
                if 'h1_title' in page_data:
                    print(f"Page Title: {page_data['h1_title']}")
                
                # Check for tab data
                tab_view = data.get('store', {}).get('page', {}).get('data', {}).get('tab_view', {})
                if tab_view:
                    print("Found tab_view in store.page.data")
                else: 
                     print("tab_view NOT found in store.page.data")
                     # Try to traverse and find where the data is
                     print("store keys:", data.get('store', {}).keys())
                     print("store.page keys:", data.get('store', {}).get('page', {}).keys())
                     page_data = data.get('store', {}).get('page', {}).get('data', {})
                     print("store.page.data keys:", page_data.keys())
                     if 'data' in page_data:
                         print("store.page.data.data keys:", page_data['data'].keys())
                         # Check if tabs are there
                         if 'tabs' in page_data['data']:
                             print(f"Found tabs in store.page.data.data! Count: {len(page_data['data']['tabs'])}")
                         if 'other_tabs' in page_data['data']:
                             print(f"Found other_tabs in store.page.data.data! Count: {len(page_data['data']['other_tabs'])}")


            except Exception as e:
                print(f"Failed to parse JSON: {e}")
        else:
            print("data-content is empty")
    else:
        print("js-store div not found")

if __name__ == "__main__":
    debug_local_html()
