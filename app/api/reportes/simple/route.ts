import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const tipoDenuncia = searchParams.get('tipoDenuncia')

    if (!fecha) {
      return NextResponse.json(
        { error: 'La fecha es requerida' },
        { status: 400 }
      )
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!fechaRegex.test(fecha)) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    console.log('Buscando denuncias para fecha:', fecha, 'tipo:', tipoDenuncia)

    // Construir condiciones WHERE
    const condiciones: string[] = [
      "d.fecha_denuncia = $1::DATE",
      "d.estado = 'completada'"
    ]
    const valores: any[] = [fecha]
    let paramIndex = 2

    if (tipoDenuncia) {
      condiciones.push(`d.tipo_denuncia = $${paramIndex}`)
      valores.push(tipoDenuncia)
      paramIndex++
    }

    const whereClause = condiciones.join(' AND ')

    // Obtener denuncias del día con denunciante e interviniente (personal policial)
    // Usar comparación directa de DATE en lugar de convertir a texto
    const result = await pool.query(
      `SELECT 
        d.orden as numero_denuncia,
        EXTRACT(YEAR FROM d.fecha_denuncia)::integer as año,
        d.hora_denuncia,
        d.tipo_denuncia as shp,
        den.nombres as denunciante,
        TRIM(
          COALESCE(d.operador_grado, '') || ' ' || 
          COALESCE(d.operador_nombre, '') || ' ' || 
          COALESCE(d.operador_apellido, '')
        ) as interviniente,
        d.oficina
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE ${whereClause}
      ORDER BY d.hora_denuncia ASC`,
      valores
    )

    console.log(`Encontradas ${result.rows.length} denuncias para la fecha ${fecha}`)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error obteniendo reporte simple:', error)
    return NextResponse.json(
      { error: 'Error al obtener reporte', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

