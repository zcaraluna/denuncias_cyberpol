import { NextResponse } from 'next/server'
import { getFechaHoraParaguay } from '@/lib/utils/timezone'

export async function GET() {
  try {
    // Usar la función de utilidad que maneja correctamente la zona horaria de Paraguay
    const { fecha, hora } = getFechaHoraParaguay()
    
    // La función devuelve fecha en formato YYYY-MM-DD, necesitamos DD/MM/YYYY
    const fechaFormateada = fecha.split('-').reverse().join('/')
    
    return NextResponse.json({ fecha: fechaFormateada, hora })
  } catch (error) {
    console.error('Error en fecha-hora:', error)
    // Fallback: usar desplazamiento UTC-3 fijo
    const now = new Date()
    const pyTime = new Date(now.getTime() - (3 * 3600000))
    const year = pyTime.getUTCFullYear()
    const month = String(pyTime.getUTCMonth() + 1).padStart(2, '0')
    const day = String(pyTime.getUTCDate()).padStart(2, '0')
    const hour = String(pyTime.getUTCHours()).padStart(2, '0')
    const minute = String(pyTime.getUTCMinutes()).padStart(2, '0')
    
    return NextResponse.json({
      fecha: `${day}/${month}/${year}`,
      hora: `${hour}:${minute}`
    })
  }
}

