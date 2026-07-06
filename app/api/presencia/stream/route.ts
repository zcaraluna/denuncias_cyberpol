import { NextRequest, NextResponse } from 'next/server'
import { leerSesion } from '@/lib/sesion'
import { listarPresencias, suscribirPresencia, type PresenciaOperador } from '@/lib/presencia'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET (SSE): flujo en tiempo real de operadores tomando denuncias.
 *
 * Solo accesible para el rol `developer`. Envía un snapshot inicial y luego un
 * evento cada vez que cambia la presencia (push inmediato, sin polling). Un ping
 * periódico mantiene viva la conexión a través de proxies.
 */
export async function GET(request: NextRequest) {
  const usuario = leerSesion(request)
  if (!usuario) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if (usuario.rol !== 'developer') {
    return NextResponse.json({ error: 'Acceso restringido' }, { status: 403 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let cerrado = false

      const enviar = (evento: string, data: unknown) => {
        if (cerrado) return
        try {
          controller.enqueue(encoder.encode(`event: ${evento}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          // El controlador puede estar cerrado; ignorar.
        }
      }

      // Snapshot inicial
      enviar('presencias', listarPresencias())

      // Suscripción a cambios (push inmediato)
      const desuscribir = suscribirPresencia((lista: PresenciaOperador[]) => {
        enviar('presencias', lista)
      })

      // Ping keepalive cada 15s
      const ping = setInterval(() => {
        if (cerrado) return
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`))
        } catch {
          // ignorar
        }
      }, 15_000)

      const cerrar = () => {
        if (cerrado) return
        cerrado = true
        clearInterval(ping)
        desuscribir()
        try {
          controller.close()
        } catch {
          // ya cerrado
        }
      }

      // Cerrar cuando el cliente se desconecta
      request.signal.addEventListener('abort', cerrar)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
