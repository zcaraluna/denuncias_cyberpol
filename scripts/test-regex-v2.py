import re

def test_scraping_v2():
    try:
        with open('chaco_final.html', 'r', encoding='utf-8') as f:
            html = f.read()

        currencies = [
            {'class': 'dolarUs', 'code': 'USD'},
            {'class': 'euro', 'code': 'EUR'},
            {'class': 'real', 'code': 'BRL'},
            {'class': 'pesoAr', 'code': 'ARS'}
        ]

        print("Testing Scraping Logic (v2 - Class Based):")
        for curr in currencies:
            # Match the pattern used in the route.ts
            pattern = rf'class="moneda {curr["class"]}".*?<td[^>]*>\s*([\d.,]+).*?<td[^>]*>\s*([\d.,]+)'
            match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
            if match:
                compra = match.group(1).replace('.', '').replace(',', '.')
                venta = match.group(2).replace('.', '').replace(',', '.')
                print(f"{curr['code']}: Compra={compra}, Venta={venta}")
            else:
                print(f"{curr['code']}: {curr['class']} NOT FOUND")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_scraping_v2()
