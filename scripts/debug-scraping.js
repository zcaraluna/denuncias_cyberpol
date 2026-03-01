const fetch = require('node-fetch');

async function debug() {
    try {
        const response = await fetch('https://www.cambioschaco.com.py/widgets/cotizacion/?lang=es');
        const html = await response.text();
        console.log('HTML CONTENT START');
        console.log(html);
        console.log('HTML CONTENT END');

        const currencies = [
            { name: 'Dolar', code: 'USD' },
            { name: 'Euro', code: 'EUR' },
            { name: 'Real', code: 'BRL' },
            { name: 'Peso', code: 'ARS' }
        ];

        currencies.forEach(curr => {
            const regex = new RegExp(`${curr.name}.*?<td>([\\d.]+)</td>.*?<td>([\\d.]+)</td>`, 's');
            const match = html.match(regex);
            if (match) {
                console.log(`MATCH FOUND for ${curr.code}:`, match[1], match[2]);
            } else {
                console.log(`NO MATCH for ${curr.code}`);
            }
        });
    } catch (e) {
        console.error(e);
    }
}

debug();
