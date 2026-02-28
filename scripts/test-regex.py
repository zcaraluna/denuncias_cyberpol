import re

def test_scraping():
    try:
        with open('chaco_final.html', 'r', encoding='utf-8') as f:
            html = f.read()

        currencies = [
            {'name': 'Dólar Americano', 'code': 'USD'},
            {'name': 'Euro', 'code': 'EUR'},
            {'name': 'Real', 'code': 'BRL'},
            {'name': 'Peso Argentino', 'code': 'ARS'}
        ]

        print("Testing Scraping Logic:")
        for curr in currencies:
            # Match the pattern used in the route.ts
            pattern = rf"{curr['name']}.*?<td[^>]*>\s*([\d.,]+).*?<td[^>]*>\s*([\d.,]+)"
            match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
            if match:
                compra = match.group(1).replace('.', '').replace(',', '.')
                venta = match.group(2).replace('.', '').replace(',', '.')
                print(f"{curr['code']}: Compra={compra}, Venta={venta}")
            else:
                print(f"{curr['code']}: NOT FOUND")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_scraping()
