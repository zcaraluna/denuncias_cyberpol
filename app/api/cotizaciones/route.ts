import { NextResponse } from 'next/server'

// Fuente: Free Currency API (fawazahmed0), servida vía CDN de jsdelivr.
// Se eligió esta fuente porque tanto cambioschaco.com.py como bcp.gov.py
// bloquean los pedidos salientes del servidor (Cloudflare "Just a moment..."
// en el primero, y un 403 tipo WAF en el segundo — probablemente por IP de
// datacenter). jsdelivr es una de las CDN más usadas del mundo y no bloquea
// tráfico de servidores. Devuelve una única cotización de referencia por
// moneda (no un par compra/venta de una casa de cambios), por lo que el
// widget muestra "Cotización de referencia" en vez de Compra/Venta.
const FUENTE_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'

export async function GET() {
    try {
        const response = await fetch(FUENTE_URL, {
            next: { revalidate: 600 } // Cache por 10 minutos
        })

        if (!response.ok) {
            throw new Error(`Fuente de cotizaciones respondió HTTP ${response.status}`)
        }

        const data = await response.json()
        const usd = data?.usd

        if (!usd || typeof usd.pyg !== 'number') {
            throw new Error('Respuesta de la fuente de cotizaciones sin el campo esperado (usd.pyg)')
        }

        // Todos los valores de la fuente vienen expresados "por 1 USD".
        // Los convertimos a "guaraníes por 1 unidad de esa moneda" (cruzando
        // por el dólar), que es lo que necesita el widget.
        const pygPorUsd = usd.pyg

        const currencies = [
            { code: 'USD', usdRate: 1 },
            { code: 'EUR', usdRate: usd.eur },
            { code: 'BRL', usdRate: usd.brl },
            { code: 'ARS', usdRate: usd.ars },
        ]

        const results: Record<string, { valor: number }> = {}
        for (const curr of currencies) {
            if (typeof curr.usdRate === 'number' && curr.usdRate > 0) {
                results[curr.code] = { valor: Math.round((pygPorUsd / curr.usdRate) * 100) / 100 }
            }
        }

        return NextResponse.json({
            rates: results,
            fecha: data.date,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Error fetching currency rates:', error)
        return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 })
    }
}
