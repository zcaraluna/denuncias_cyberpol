import { NextRequest, NextResponse } from 'next/server'
import { leerSesion } from '@/lib/sesion'
import { eliminarPresencia } from '@/lib/presencia'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST: da de baja la presencia del operador. Pensado para `navigator.sendBeacon`,
 * que solo emite POST y sobrevive al cierre de la pestaña.
 */
export async function POST(request: NextRequest) {
  const usuario = leerSesion(request)
  if (!usuario) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  eliminarPresencia(usuario.id)
  return NextResponse.json({ ok: true })
}
