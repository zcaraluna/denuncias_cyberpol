import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { leerSesion } from '@/lib/sesion'
import { canonicalizarOficina } from '@/lib/data/oficinas'

const ROLES_PERMITIDOS = ['developer', 'superadmin']

function autorizar(request: NextRequest) {
  const usuario = leerSesion(request)
  if (!usuario) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) }
  if (!ROLES_PERMITIDOS.includes(usuario.rol)) {
    return { error: NextResponse.json({ error: 'Acción no autorizada' }, { status: 403 }) }
  }
  return { usuario }
}

/**
 * GET: lista las bases de numeración configuradas (offset por oficina y año).
 */
export async function GET(request: NextRequest) {
  const auth = autorizar(request)
  if (auth.error) return auth.error

  try {
    const result = await pool.query(
      `SELECT id, oficina, anio, ultimo_orden_previo, nota, creado_en, actualizado_en
       FROM numeracion_base
       ORDER BY anio DESC, oficina ASC`
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    // Si la tabla no existe todavía (migración 025 sin aplicar), devolver lista vacía.
    if (error?.code === '42P01') {
      return NextResponse.json([])
    }
    console.error('Error listando numeracion_base:', error)
    return NextResponse.json({ error: 'Error al obtener la configuración' }, { status: 500 })
  }
}

/**
 * POST: crea o actualiza (upsert) el offset de una oficina y año.
 * Body: { oficina, anio, ultimoOrdenPrevio, nota? }
 */
export async function POST(request: NextRequest) {
  const auth = autorizar(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const oficinaRaw = body?.oficina
    const anio = parseInt(body?.anio, 10)
    const ultimoOrdenPrevio = parseInt(body?.ultimoOrdenPrevio, 10)
    const nota = typeof body?.nota === 'string' ? body.nota.trim().slice(0, 500) : null

    if (!oficinaRaw || typeof oficinaRaw !== 'string') {
      return NextResponse.json({ error: 'La oficina es obligatoria' }, { status: 400 })
    }
    if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
      return NextResponse.json({ error: 'Año inválido' }, { status: 400 })
    }
    if (!Number.isInteger(ultimoOrdenPrevio) || ultimoOrdenPrevio < 0) {
      return NextResponse.json({ error: 'El número previo debe ser un entero mayor o igual a 0' }, { status: 400 })
    }

    // Canonicalizar la oficina para que coincida exactamente con la numeración.
    const oficina = canonicalizarOficina(oficinaRaw)

    const result = await pool.query(
      `INSERT INTO numeracion_base (oficina, anio, ultimo_orden_previo, nota)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (oficina, anio)
       DO UPDATE SET ultimo_orden_previo = EXCLUDED.ultimo_orden_previo,
                     nota = EXCLUDED.nota,
                     actualizado_en = CURRENT_TIMESTAMP
       RETURNING id, oficina, anio, ultimo_orden_previo, nota, creado_en, actualizado_en`,
      [oficina, anio, ultimoOrdenPrevio, nota]
    )

    return NextResponse.json({ success: true, registro: result.rows[0] })
  } catch (error: any) {
    if (error?.code === '42P01') {
      return NextResponse.json(
        { error: 'La tabla de numeración no existe. Aplique la migración 025 antes de configurar.' },
        { status: 409 }
      )
    }
    console.error('Error guardando numeracion_base:', error)
    return NextResponse.json({ error: 'Error al guardar la configuración' }, { status: 500 })
  }
}

/**
 * DELETE: elimina la configuración de una (oficina, año) por id. Equivale a base 0.
 * Query: ?id=123
 */
export async function DELETE(request: NextRequest) {
  const auth = autorizar(request)
  if (auth.error) return auth.error

  try {
    const id = parseInt(new URL(request.url).searchParams.get('id') || '', 10)
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    await pool.query('DELETE FROM numeracion_base WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error eliminando numeracion_base:', error)
    return NextResponse.json({ error: 'Error al eliminar la configuración' }, { status: 500 })
  }
}
