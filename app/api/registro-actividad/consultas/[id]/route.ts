import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioId = parseInt((await params).id)

    const result = await pool.query(
      `SELECT 
        v.id,
        v.denuncia_id,
        v.fecha_visita,
        d.orden as numero_orden,
        den.nombres as nombre_denunciante,
        d.hash as hash_denuncia,
        d.tipo_denuncia as tipo_hecho,
        d.fecha_denuncia
      FROM visitas_denuncias v
      LEFT JOIN denuncias d ON v.denuncia_id = d.id
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE v.usuario_id = $1
      ORDER BY v.fecha_visita DESC
      LIMIT 1000`,
      [usuarioId]
    )

    // Corregir las fechas restando 3 horas para ajustar la zona horaria del VPS
    const visitasCorregidas = result.rows.map((visita: any) => {
      if (visita.fecha_visita) {
        const fecha = new Date(visita.fecha_visita)
        // Restar 3 horas (10800000 milisegundos)
        const fechaCorregida = new Date(fecha.getTime() - 3 * 60 * 60 * 1000)
        return {
          ...visita,
          fecha_visita: fechaCorregida.toISOString()
        }
      }
      return visita
    })

    return NextResponse.json(visitasCorregidas)
  } catch (error) {
    console.error('Error obteniendo visitas de usuario:', error)
    return NextResponse.json(
      { error: 'Error al obtener visitas de usuario' },
      { status: 500 }
    )
  }
}

