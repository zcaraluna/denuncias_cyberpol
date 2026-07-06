import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { leerSesion } from '@/lib/sesion'

export async function GET(request: NextRequest) {
  try {
    // 1. Obtener la sesión del usuario para aplicar filtrado regional
    const usuario = leerSesion(request)
    let oficinaFilter: string | null = null

    if (usuario) {
      if (usuario.rol === 'supervisor') {
        oficinaFilter = usuario.oficina
      } else if (usuario.rol === 'operador') {
        return NextResponse.json({ error: 'Acción no autorizada' }, { status: 403 })
      }
    }

    // Solo el rol developer puede incluir denuncias en estado borrador.
    const { searchParams } = new URL(request.url)
    const incluirBorradores = searchParams.get('incluirBorradores') === '1' && usuario?.rol === 'developer'

    const filtroEstado = incluirBorradores
      ? `d.estado IN ('completada', 'borrador')`
      : `d.estado = 'completada'`

    let query = `
      SELECT
        d.id,
        d.denunciante_id,
        d.orden as numero_orden,
        d.fecha_denuncia,
        d.hora_denuncia,
        d.tipo_denuncia as tipo_hecho,
        d.hash as hash_denuncia,
        d.estado,
        d.oficina,
        den.nombres as nombre_denunciante,
        den.cedula as cedula_denunciante
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE ${filtroEstado}
    `
    const queryParams: any[] = []
    if (oficinaFilter) {
      query += ` AND d.oficina = $1`
      queryParams.push(oficinaFilter)
    }

    // Completadas primero ('completada' > 'borrador'); dentro, por número de orden desc.
    query += ` ORDER BY d.estado DESC, d.orden DESC, d.fecha_denuncia DESC, d.hora_denuncia DESC`

    const result = await pool.query(query, queryParams)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error obteniendo denuncias:', error)
    return NextResponse.json(
      { error: 'Error al obtener denuncias' },
      { status: 500 }
    )
  }
}

