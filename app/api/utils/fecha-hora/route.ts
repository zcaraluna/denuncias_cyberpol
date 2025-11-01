import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Usar la hora del sistema con timezone de Asunción
    const now = new Date()
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
  } catch (error) {
    console.error('Error en fecha-hora:', error)
    const now = new Date()
    return NextResponse.json({
      fecha: now.toLocaleDateString('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Asuncion'
      }),
      hora: now.toLocaleTimeString('es-PY', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Asuncion'
      })
    })
  }
}

