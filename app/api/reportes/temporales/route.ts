import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const oficina = searchParams.get('oficina')

    const condiciones: string[] = ["estado = 'completada'"]
    const valores: any[] = []

    if (fechaInicio) {
      condiciones.push(`fecha_denuncia >= $${valores.length + 1}`)
      valores.push(fechaInicio)
    }
    if (fechaFin) {
      condiciones.push(`fecha_denuncia <= $${valores.length + 1}`)
      valores.push(fechaFin)
    }
    if (oficina) {
      condiciones.push(`oficina = $${valores.length + 1}`)
      valores.push(oficina)
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : ''

    // Comparativa mes a mes
    const mesAMes = await pool.query(
      `SELECT 
        DATE_TRUNC('month', fecha_denuncia) as mes,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause}
      GROUP BY mes
      ORDER BY mes DESC
      LIMIT 12`
    )

    // Comparativa año a año
    const añoAAño = await pool.query(
      `SELECT 
        EXTRACT(YEAR FROM fecha_denuncia) as año,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause}
      GROUP BY año
      ORDER BY año DESC`
    )

    // Tendencias (crecimiento/descenso)
    const tendencias = await pool.query(
      `WITH denuncias_mensuales AS (
        SELECT 
          DATE_TRUNC('month', fecha_denuncia) as mes,
          COUNT(*) as cantidad
        FROM denuncias 
        ${whereClause}
        GROUP BY mes
      )
      SELECT 
        mes,
        cantidad,
        LAG(cantidad) OVER (ORDER BY mes) as cantidad_anterior,
        cantidad - LAG(cantidad) OVER (ORDER BY mes) as diferencia,
        CASE 
          WHEN LAG(cantidad) OVER (ORDER BY mes) IS NULL THEN NULL
          WHEN cantidad > LAG(cantidad) OVER (ORDER BY mes) THEN 'crecimiento'
          WHEN cantidad < LAG(cantidad) OVER (ORDER BY mes) THEN 'descenso'
          ELSE 'estable'
        END as tendencia
      FROM denuncias_mensuales
      ORDER BY mes DESC
      LIMIT 12`
    )

    // Denuncias del día actual vs promedio
    const diaActualVsPromedio = await pool.query(
      `WITH denuncias_diarias AS (
        SELECT 
          fecha_denuncia,
          COUNT(*) as cantidad
        FROM denuncias 
        ${whereClause}
        GROUP BY fecha_denuncia
      ),
      estadisticas AS (
        SELECT 
          AVG(cantidad) as promedio,
          COUNT(*) as total_dias
        FROM denuncias_diarias
      )
      SELECT 
        (SELECT cantidad FROM denuncias_diarias WHERE fecha_denuncia = CURRENT_DATE) as hoy,
        (SELECT promedio FROM estadisticas) as promedio,
        (SELECT total_dias FROM estadisticas) as total_dias
      `
    )

    return NextResponse.json({
      mesAMes: mesAMes.rows,
      añoAAño: añoAAño.rows,
      tendencias: tendencias.rows,
      diaActualVsPromedio: diaActualVsPromedio.rows[0] || { hoy: 0, promedio: 0, total_dias: 0 }
    })
  } catch (error) {
    console.error('Error obteniendo reportes temporales:', error)
    return NextResponse.json(
      { error: 'Error al obtener reportes temporales' },
      { status: 500 }
    )
  }
}






