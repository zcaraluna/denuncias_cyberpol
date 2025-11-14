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

    // Distribución porcentual de tipos
    const totalDenuncias = await pool.query(
      `SELECT COUNT(*) as total FROM denuncias ${whereClause}`,
      valores
    )
    const total = parseInt(totalDenuncias.rows[0].total) || 1

    // Obtener distribución
    const distribucionRaw = await pool.query(
      `SELECT 
        CASE 
          WHEN tipo_denuncia IS NULL THEN 'Sin tipo'
          WHEN tipo_denuncia = 'Otro (Especificar)' OR tipo_denuncia = 'OTRO' THEN COALESCE(NULLIF(otro_tipo, ''), 'Otro (Especificar)')
          ELSE tipo_denuncia 
        END as tipo,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause}
      GROUP BY tipo_denuncia, otro_tipo
      ORDER BY cantidad DESC`,
      valores
    )

    // Calcular porcentajes en JavaScript para evitar problemas con SQL
    const distribucion = distribucionRaw.rows.map(row => ({
      tipo: row.tipo,
      cantidad: parseInt(row.cantidad),
      porcentaje: total > 0 ? parseFloat((parseInt(row.cantidad) * 100.0 / total).toFixed(2)) : 0
    }))

    // Evolución de tipos específicos en el tiempo (últimos 30 días)
    const evolucion = await pool.query(
      `SELECT 
        DATE_TRUNC('day', fecha_denuncia) as fecha,
        CASE WHEN tipo_denuncia = 'Otro (Especificar)' OR tipo_denuncia = 'OTRO' THEN COALESCE(otro_tipo, 'Otro (Especificar)') ELSE tipo_denuncia END as tipo,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause} ${whereClause ? 'AND' : 'WHERE'} fecha_denuncia >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY fecha, tipo_denuncia, otro_tipo
      ORDER BY fecha DESC, cantidad DESC`,
      valores
    )

    // Tipos más frecuentes por oficina
    const tiposPorOficina = await pool.query(
      `SELECT 
        oficina,
        CASE WHEN tipo_denuncia = 'Otro (Especificar)' OR tipo_denuncia = 'OTRO' THEN COALESCE(otro_tipo, 'Otro (Especificar)') ELSE tipo_denuncia END as tipo,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause}
      GROUP BY oficina, tipo_denuncia, otro_tipo
      ORDER BY oficina, cantidad DESC`,
      valores
    )

    // Top tipos más frecuentes
    const topTipos = await pool.query(
      `SELECT 
        CASE WHEN tipo_denuncia = 'Otro (Especificar)' OR tipo_denuncia = 'OTRO' THEN COALESCE(otro_tipo, 'Otro (Especificar)') ELSE tipo_denuncia END as tipo,
        COUNT(*) as cantidad,
        MIN(fecha_denuncia) as primera_denuncia,
        MAX(fecha_denuncia) as ultima_denuncia
      FROM denuncias 
      ${whereClause}
      GROUP BY tipo_denuncia, otro_tipo
      ORDER BY cantidad DESC
      LIMIT 10`,
      valores
    )

    return NextResponse.json({
      distribucion,
      evolucion: evolucion.rows,
      tiposPorOficina: tiposPorOficina.rows,
      topTipos: topTipos.rows
    })
  } catch (error) {
    console.error('Error obteniendo reportes por tipo:', error)
    return NextResponse.json(
      { error: 'Error al obtener reportes por tipo' },
      { status: 500 }
    )
  }
}

