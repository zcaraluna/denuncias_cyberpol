import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { leerSesion } from '@/lib/sesion'

// Devuelve el historial completo de versiones de una denuncia: cada snapshot
// guardado justo antes de una edición, más un snapshot sintético del estado
// ACTUAL (armado con la misma forma), para que el frontend pueda comparar
// (diff) cualquier par de versiones, incluyendo la vigente.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usr = leerSesion(request)
    if (!usr) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)

    const versionesRes = await pool.query(
      `SELECT id, version_numero, snapshot, motivo, editado_por, editor_nombre, creado_en
       FROM denuncias_versiones
       WHERE denuncia_id = $1
       ORDER BY version_numero ASC`,
      [id]
    )

    const actualRes = await pool.query(
      `SELECT row_to_json(d) as denuncia,
              COALESCE((
                SELECT json_agg(row_to_json(inv))
                FROM (
                  SELECT di.rol, di.representa_denunciante_id, di.con_carta_poder,
                         di.carta_poder_fecha, di.carta_poder_notario,
                         den.*
                  FROM denuncias_involucrados di
                  JOIN denunciantes den ON di.denunciante_id = den.id
                  WHERE di.denuncia_id = d.id
                ) inv
              ), '[]'::json) as involucrados,
              COALESCE((
                SELECT json_agg(row_to_json(sa))
                FROM supuestos_autores sa
                WHERE sa.denuncia_id = d.id
              ), '[]'::json) as supuestos_autores
       FROM denuncias d
       WHERE d.id = $1`,
      [id]
    )

    if (actualRes.rows.length === 0) {
      return NextResponse.json({ error: 'Denuncia no encontrada' }, { status: 404 })
    }

    const versiones = versionesRes.rows.map((v) => ({
      id: v.id,
      version_numero: v.version_numero,
      snapshot: v.snapshot,
      motivo: v.motivo,
      editado_por: v.editado_por,
      editor_nombre: v.editor_nombre,
      creado_en: v.creado_en,
      actual: false,
    }))

    const ultimoNumero = versiones.length > 0 ? versiones[versiones.length - 1].version_numero : 0

    versiones.push({
      id: -1,
      version_numero: ultimoNumero + 1,
      snapshot: actualRes.rows[0],
      motivo: 'ACTUAL',
      editado_por: null,
      editor_nombre: null,
      creado_en: null,
      actual: true,
    })

    return NextResponse.json({ versiones })
  } catch (error) {
    console.error('Error obteniendo historial de versiones:', error)
    return NextResponse.json({ error: 'Error al obtener el historial de versiones' }, { status: 500 })
  }
}
