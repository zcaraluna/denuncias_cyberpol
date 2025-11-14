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

    // Denunciantes recurrentes
    const recurrentes = await pool.query(
      `SELECT 
        den.cedula,
        den.nombres,
        COUNT(d.id) as total_denuncias,
        MIN(d.fecha_denuncia) as primera_denuncia,
        MAX(d.fecha_denuncia) as ultima_denuncia
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      ${whereClause}
      GROUP BY den.id, den.cedula, den.nombres
      HAVING COUNT(d.id) > 1
      ORDER BY total_denuncias DESC
      LIMIT 50`,
      valores
    )

    // Distribución por edad
    const porEdad = await pool.query(
      `WITH grupos_edad AS (
        SELECT 
          CASE 
            WHEN den.edad IS NULL THEN 'Sin edad'
            WHEN den.edad < 18 THEN 'Menor de 18'
            WHEN den.edad < 25 THEN '18-24'
            WHEN den.edad < 35 THEN '25-34'
            WHEN den.edad < 45 THEN '35-44'
            WHEN den.edad < 55 THEN '45-54'
            WHEN den.edad < 65 THEN '55-64'
            ELSE '65 o más'
          END as grupo_edad,
          CASE 
            WHEN den.edad IS NULL THEN 8
            WHEN den.edad < 18 THEN 1
            WHEN den.edad < 25 THEN 2
            WHEN den.edad < 35 THEN 3
            WHEN den.edad < 45 THEN 4
            WHEN den.edad < 55 THEN 5
            WHEN den.edad < 65 THEN 6
            ELSE 7
          END as orden
        FROM denuncias d
        LEFT JOIN denunciantes den ON d.denunciante_id = den.id
        ${whereClause}
      )
      SELECT 
        grupo_edad,
        COUNT(*) as cantidad
      FROM grupos_edad
      GROUP BY grupo_edad, orden
      ORDER BY orden`,
      valores
    )

    // Distribución por estado civil
    const porEstadoCivil = await pool.query(
      `SELECT 
        COALESCE(den.estado_civil, 'No especificado') as estado_civil,
        COUNT(*) as cantidad
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      ${whereClause}
      GROUP BY den.estado_civil
      ORDER BY cantidad DESC`,
      valores
    )

    // Distribución por nacionalidad
    const porNacionalidad = await pool.query(
      `SELECT 
        COALESCE(den.nacionalidad, 'No especificado') as nacionalidad,
        COUNT(*) as cantidad
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      ${whereClause}
      GROUP BY den.nacionalidad
      ORDER BY cantidad DESC
      LIMIT 20`,
      valores
    )

    return NextResponse.json({
      recurrentes: recurrentes.rows,
      porEdad: porEdad.rows,
      porEstadoCivil: porEstadoCivil.rows,
      porNacionalidad: porNacionalidad.rows
    })
  } catch (error) {
    console.error('Error obteniendo reportes de denunciantes:', error)
    return NextResponse.json(
      { error: 'Error al obtener reportes de denunciantes' },
      { status: 500 }
    )
  }
}

