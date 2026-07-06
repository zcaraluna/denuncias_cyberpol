import { NextRequest, NextResponse } from 'next/server'
import { leerSesion } from '@/lib/sesion'
import { actualizarPresencia, eliminarPresencia } from '@/lib/presencia'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST: heartbeat de presencia de un operador que está tomando una denuncia.
 * La identidad se toma de la sesión firmada (no del cliente), de modo que un
 * operador no puede reportarse como otro.
 */
export async function POST(request: NextRequest) {
  const usuario = leerSesion(request)
  if (!usuario) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const paso = Number(body?.paso)
  actualizarPresencia({
    usuarioId: usuario.id,
    usuario: usuario.usuario,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    grado: usuario.grado,
    oficina: usuario.oficina,
    paso: Number.isFinite(paso) ? paso : 1,
    pasoLabel: typeof body?.pasoLabel === 'string' ? body.pasoLabel : '',
    tipoFormulario: typeof body?.tipoFormulario === 'string' ? body.tipoFormulario : null,
    borradorId: typeof body?.borradorId === 'number' ? body.borradorId : null,
    horaInicio: typeof body?.horaInicio === 'string' ? body.horaInicio : null,
    fechaInicio: typeof body?.fechaInicio === 'string' ? body.fechaInicio : null,
  })

  return NextResponse.json({ ok: true })
}

/**
 * DELETE: el operador deja de tomar la denuncia (finalizó o abandonó el formulario).
 */
export async function DELETE(request: NextRequest) {
  const usuario = leerSesion(request)
  if (!usuario) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  eliminarPresencia(usuario.id)
  return NextResponse.json({ ok: true })
}
