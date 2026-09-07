import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { leerSesion } from '@/lib/sesion'

// Habilita, de forma puntual y de un solo uso, una edición extraordinaria de
// una denuncia completada ya fuera del período de gracia de 10 minutos.
// Solo cuentas con rol 'developer' pueden otorgarla, y solo el operador que
// originalmente cargó la denuncia puede consumirla (ver PUT en
// app/api/denuncias/[id]/route.ts).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect()
  try {
    const usr = leerSesion(request)
    if (!usr) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    if (usr.rol !== 'developer') {
      return NextResponse.json({ error: 'Solo una cuenta developer puede habilitar una edición extraordinaria.' }, { status: 403 })
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)

    const result = await client.query(
      `SELECT d.id, d.estado, d.orden, d.oficina, d.usuario_id,
              COALESCE(NULLIF(d.operador_grado, ''), u.grado) as operador_grado,
              COALESCE(NULLIF(d.operador_nombre, ''), u.nombre) as operador_nombre,
              COALESCE(NULLIF(d.operador_apellido, ''), u.apellido) as operador_apellido
       FROM denuncias d
       LEFT JOIN usuarios u ON d.usuario_id = u.id
       WHERE d.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Denuncia no encontrada' }, { status: 404 })
    }

    const dbDenuncia = result.rows[0]

    if (dbDenuncia.estado !== 'completada') {
      return NextResponse.json({ error: 'Solo se puede habilitar la edición de denuncias completadas.' }, { status: 400 })
    }

    await client.query('BEGIN')

    await client.query(
      `UPDATE denuncias SET
        edicion_extra_otorgada_por = $1,
        edicion_extra_otorgada_en = CURRENT_TIMESTAMP,
        edicion_extra_usada_en = NULL
       WHERE id = $2`,
      [usr.id, id]
    )

    const operadorNombreCompleto = `${dbDenuncia.operador_grado || ''} ${dbDenuncia.operador_nombre || ''} ${dbDenuncia.operador_apellido || ''}`.trim()
    const detalleAudit = `Edición extraordinaria de un solo uso habilitada por ${usr.grado || ''} ${usr.nombre || ''} ${usr.apellido || ''} (ID: ${usr.id}) para la denuncia N° ${dbDenuncia.orden}, a ser consumida exclusivamente por ${operadorNombreCompleto || 'el operador original'} (ID: ${dbDenuncia.usuario_id}).`

    await client.query(
      `INSERT INTO registro_auditoria_denuncias (denuncia_id, usuario_id, accion, detalle)
       VALUES ($1, $2, 'EDICION_EXTRAORDINARIA_OTORGADA', $3)`,
      [id, usr.id, detalleAudit]
    )

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      operador: operadorNombreCompleto || null,
      usuario_id: dbDenuncia.usuario_id,
    })
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('Error habilitando edición extraordinaria:', error)
    return NextResponse.json({ error: 'Error al habilitar la edición extraordinaria.', details: error.message }, { status: 500 })
  } finally {
    client.release()
  }
}
