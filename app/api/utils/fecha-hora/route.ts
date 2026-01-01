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
    // Fallback: usar métodos directos con timezone explícito
    const now = new Date()
    
    // Obtener fecha en formato DD/MM/YYYY usando timezone de Paraguay
    const fecha = now.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Asuncion'
    })
    
    const hora = now.toLocaleTimeString('es-PY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Asuncion'
    })
    
    return NextResponse.json({ fecha, hora })
  }
}

