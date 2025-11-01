import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT 
        v.id,
        v.denuncia_id,
        v.usuario_id,
        v.fecha_visita,
        u.nombre as nombre_usuario,
        u.apellido as apellido_usuario,
        u.grado as grado_usuario,
        d.orden as numero_orden,
        den.nombres as nombre_denunciante,
        d.hash as hash_denuncia
      FROM visitas_denuncias v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN denuncias d ON v.denuncia_id = d.id
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      ORDER BY v.fecha_visita DESC
      LIMIT 1000`
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error obteniendo log de visitas:', error)
    return NextResponse.json(
      { error: 'Error al obtener log de visitas' },
      { status: 500 }
    )
  }
}

