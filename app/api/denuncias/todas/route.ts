import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // 1. Obtener la sesión del usuario para aplicar filtrado regional
    const usuarioCookie = request.cookies.get('usuario_sesion')?.value
    let oficinaFilter: string | null = null

    if (usuarioCookie) {
      try {
        const usuario = JSON.parse(decodeURIComponent(usuarioCookie))
        if (usuario.rol === 'supervisor') {
          oficinaFilter = usuario.oficina
        } else if (usuario.rol === 'operador') {
          return NextResponse.json({ error: 'Acción no autorizada' }, { status: 403 })
        }
      } catch (e) {
        // Ignorar errores de parseo
      }
    }

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
        den.nombres as nombre_denunciante,
        den.cedula as cedula_denunciante
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.estado = 'completada'
    `
    const queryParams: any[] = []
    if (oficinaFilter) {
      query += ` AND d.oficina = $1`
      queryParams.push(oficinaFilter)
    }

    query += ` ORDER BY d.orden DESC, d.fecha_denuncia DESC, d.hora_denuncia DESC`

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

