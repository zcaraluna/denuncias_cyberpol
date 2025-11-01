import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Intentar obtener la hora desde una API externa
    try {
      const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=America/Asuncion', {
        next: { revalidate: 60 }
      })
      
      if (response.ok) {
        const data = await response.json()
        let fechaHora: Date
        
        if (data.datetime) {
          fechaHora = new Date(data.datetime)
        } else if (data.dateTime) {
          fechaHora = new Date(data.dateTime)
        } else {
          throw new Error('Formato no válido')
        }
        
        const fecha = fechaHora.toLocaleDateString('es-PY', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
        const hora = fechaHora.toLocaleTimeString('es-PY', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
        
        return NextResponse.json({ fecha, hora })
      }
    } catch (error) {
      console.error('Error obteniendo hora online:', error)
    }
    
    // Si falla, usar la hora del sistema con timezone de Asunción
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

