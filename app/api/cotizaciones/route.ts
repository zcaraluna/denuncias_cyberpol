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
            { class: 'dolarUs', code: 'USD' },
            { class: 'euro', code: 'EUR' },
            { class: 'real', code: 'BRL' },
            { class: 'pesoAr', code: 'ARS' }
        ]

        currencies.forEach(curr => {
            // Usamos la clase del icono como ancla más fiable que el texto con acentos
            const regex = new RegExp(`class="moneda ${curr.class}".*?<td[^>]*>\\s*([\\d.,]+).*?<td[^>]*>\\s*([\\d.,]+)`, 'is')
            const match = html.match(regex)

            if (match) {
                // Limpiamos los números: quitar puntos (miles) y cambiar coma por punto (decimal)
                const parseValue = (val: string) => {
                    const clean = val.replace(/\./g, '').replace(',', '.')
                    return parseFloat(clean)
                }

                results[curr.code] = {
                    compra: Math.round(parseValue(match[1])),
                    venta: Math.round(parseValue(match[2]))
                }
            }
        })

        return NextResponse.json({
            rates: results,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Error fetching Chaco rates:', error)
        return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 })
    }
}
