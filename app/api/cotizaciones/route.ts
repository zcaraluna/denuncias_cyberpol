import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const response = await fetch('https://www.cambioschaco.com.py/widgets/cotizacion/?lang=es', {
            next: { revalidate: 600 } // Cache por 10 minutos
        })
        const html = await response.text()

        // Regex para extraer los valores de la tabla
        // El widget tiene una estructura de tabla: <tr> <td>Moneda</td> <td>Compra</td> <td>Venta</td> </tr>

        const results: Record<string, { compra: number; venta: number }> = {}

        const currencies = [
            { name: 'Dolar', code: 'USD' },
            { name: 'Euro', code: 'EUR' },
            { name: 'Real', code: 'BRL' },
            { name: 'Peso', code: 'ARS' }
        ]

        currencies.forEach(curr => {
            // Buscamos la fila que contiene el nombre de la moneda y extraemos los dos siguientes <td>
            const regex = new RegExp(`${curr.name}.*?<td>([\\d.]+)</td>.*?<td>([\\d.]+)</td>`, 's')
            const match = html.match(regex)
            if (match) {
                results[curr.code] = {
                    compra: parseInt(match[1].replace(/\./g, '')),
                    venta: parseInt(match[2].replace(/\./g, ''))
                }
            }
        })

        return NextResponse.json(results)
    } catch (error) {
        console.error('Error fetching Chaco rates:', error)
        return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 })
    }
}
