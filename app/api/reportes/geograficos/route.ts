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

    // Denuncias por lugar del hecho (top lugares)
    const porLugar = await pool.query(
      `SELECT 
        lugar_hecho,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause} ${whereClause ? 'AND' : 'WHERE'} lugar_hecho IS NOT NULL
      GROUP BY lugar_hecho
      ORDER BY cantidad DESC
      LIMIT 50`,
      valores
    )

    // Denuncias con coordenadas GPS
    const conCoordenadas = await pool.query(
      `SELECT 
        id,
        orden,
        lugar_hecho,
        latitud,
        longitud,
        tipo_denuncia,
        fecha_denuncia
      FROM denuncias 
      ${whereClause} ${whereClause ? 'AND' : 'WHERE'} latitud IS NOT NULL AND longitud IS NOT NULL
      ORDER BY fecha_denuncia DESC
      LIMIT 1000`,
      valores
    )

    // Zonas con mayor concentración (agrupando por coordenadas aproximadas)
    const zonasConcentracion = await pool.query(
      `SELECT 
        ROUND(CAST(latitud AS NUMERIC), 2) as lat_redondeada,
        ROUND(CAST(longitud AS NUMERIC), 2) as lon_redondeada,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause.length > 0 ? whereClause + ' AND' : 'WHERE'} latitud IS NOT NULL AND longitud IS NOT NULL
      GROUP BY ROUND(CAST(latitud AS NUMERIC), 2), ROUND(CAST(longitud AS NUMERIC), 2)
      HAVING COUNT(*) >= 1
      ORDER BY cantidad DESC
      LIMIT 20`,
      valores
    )

    return NextResponse.json({
      porLugar: porLugar.rows,
      conCoordenadas: conCoordenadas.rows,
      zonasConcentracion: zonasConcentracion.rows
    })
  } catch (error) {
    console.error('Error obteniendo reportes geográficos:', error)
    return NextResponse.json(
      { error: 'Error al obtener reportes geográficos' },
      { status: 500 }
    )
  }
}

