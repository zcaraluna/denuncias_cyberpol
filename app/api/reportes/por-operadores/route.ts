import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const oficina = searchParams.get('oficina')

    const condiciones: string[] = ["d.estado = 'completada'"]
    const valores: any[] = []

    if (fechaInicio) {
      condiciones.push(`d.fecha_denuncia >= $${valores.length + 1}`)
      valores.push(fechaInicio)
    }
    if (fechaFin) {
      condiciones.push(`d.fecha_denuncia <= $${valores.length + 1}`)
      valores.push(fechaFin)
    }
    if (oficina) {
      condiciones.push(`d.oficina = $${valores.length + 1}`)
      valores.push(oficina)
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : ''

    // Top operadores por cantidad de denuncias
    const topOperadores = await pool.query(
      `SELECT 
        d.usuario_id,
        u.nombre || ' ' || u.apellido as nombre_completo,
        u.grado,
        d.oficina,
        COUNT(d.id) as total_denuncias
      FROM denuncias d
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      ${whereClause}
      GROUP BY d.usuario_id, u.nombre, u.apellido, u.grado, d.oficina
      ORDER BY total_denuncias DESC
      LIMIT 20`,
      valores
    )

    // Promedio de denuncias por operador
    const promedioResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT d.usuario_id) as total_operadores,
        COUNT(d.id) as total_denuncias,
        ROUND(COUNT(d.id)::numeric / NULLIF(COUNT(DISTINCT d.usuario_id), 0), 2) as promedio
      FROM denuncias d
      ${whereClause}`,
      valores
    )
    const promedio = promedioResult.rows[0]

    // Actividad de consultas por operador
    const consultasPorOperador = await pool.query(
      `SELECT 
        v.usuario_id,
        u.nombre || ' ' || u.apellido as nombre_completo,
        u.grado,
        COUNT(v.id) as total_consultas,
        COUNT(DISTINCT v.denuncia_id) as denuncias_consultadas
      FROM visitas_denuncias v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      GROUP BY v.usuario_id, u.nombre, u.apellido, u.grado
      ORDER BY total_consultas DESC
      LIMIT 20`
    )

    // Comparativa entre oficinas
    const comparativaOficinas = await pool.query(
      `SELECT 
        oficina,
        COUNT(DISTINCT usuario_id) as operadores,
        COUNT(*) as total_denuncias,
        ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT usuario_id), 0), 2) as promedio_por_operador
      FROM denuncias d
      ${whereClause}
      GROUP BY oficina
      ORDER BY total_denuncias DESC`,
      valores
    )

    return NextResponse.json({
      topOperadores: topOperadores.rows,
      promedio,
      consultasPorOperador: consultasPorOperador.rows,
      comparativaOficinas: comparativaOficinas.rows
    })
  } catch (error) {
    console.error('Error obteniendo reportes por operadores:', error)
    return NextResponse.json(
      { error: 'Error al obtener reportes por operadores' },
      { status: 500 }
    )
  }
}








