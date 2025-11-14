import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const oficina = searchParams.get('oficina')
    const tipoDenuncia = searchParams.get('tipoDenuncia')

    // Construir condiciones WHERE
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
    if (tipoDenuncia) {
      condiciones.push(`tipo_denuncia = $${valores.length + 1}`)
      valores.push(tipoDenuncia)
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : ''

    // Total de denuncias
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM denuncias ${whereClause}`,
      valores
    )
    const total = parseInt(totalResult.rows[0].total)

    // Denuncias por período
    const porPeriodo = await pool.query(
      `SELECT 
        DATE_TRUNC('day', fecha_denuncia) as fecha,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause}
      GROUP BY DATE_TRUNC('day', fecha_denuncia)
      ORDER BY fecha DESC
      LIMIT 30`
    )

    // Denuncias por oficina
    const porOficina = await pool.query(
      `SELECT 
        oficina,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause}
      GROUP BY oficina
      ORDER BY cantidad DESC`
    )

    // Denuncias por tipo
    const porTipo = await pool.query(
      `SELECT 
        CASE WHEN tipo_denuncia = 'Otro (Especificar)' OR tipo_denuncia = 'OTRO' THEN COALESCE(otro_tipo, 'Otro (Especificar)') ELSE tipo_denuncia END as tipo,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause}
      GROUP BY tipo_denuncia, otro_tipo
      ORDER BY cantidad DESC
      LIMIT 20`,
      valores
    )

    // Denuncias por estado (aunque todas deberían ser completadas)
    const porEstado = await pool.query(
      `SELECT 
        estado,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause}
      GROUP BY estado`
    )

    // Monto total de daños
    const montoResult = await pool.query(
      `SELECT 
        COALESCE(SUM(monto_dano), 0) as total_monto,
        COUNT(*) FILTER (WHERE monto_dano IS NOT NULL) as denuncias_con_monto
      FROM denuncias 
      ${whereClause}`
    )
    const montoTotal = parseFloat(montoResult.rows[0].total_monto) || 0
    const denunciasConMonto = parseInt(montoResult.rows[0].denuncias_con_monto)

    // Denuncias por día de la semana
    const porDiaSemana = await pool.query(
      `SELECT 
        EXTRACT(DOW FROM fecha_denuncia) as dia_semana,
        CASE EXTRACT(DOW FROM fecha_denuncia)
          WHEN 0 THEN 'Domingo'
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
        END as nombre_dia,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause}
      GROUP BY dia_semana, nombre_dia
      ORDER BY dia_semana`
    )

    // Denuncias por hora del día
    const porHora = await pool.query(
      `SELECT 
        EXTRACT(HOUR FROM CAST(hora_denuncia AS TIME)) as hora,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause} AND hora_denuncia IS NOT NULL
      GROUP BY hora
      ORDER BY hora`
    )

    return NextResponse.json({
      total,
      porPeriodo: porPeriodo.rows,
      porOficina: porOficina.rows,
      porTipo: porTipo.rows,
      porEstado: porEstado.rows,
      montoTotal,
      denunciasConMonto,
      porDiaSemana: porDiaSemana.rows,
      porHora: porHora.rows
    })
  } catch (error) {
    console.error('Error obteniendo estadísticas generales:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas generales' },
      { status: 500 }
    )
  }
}

