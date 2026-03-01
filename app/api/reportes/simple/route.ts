import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { obtenerCapitulo } from '@/lib/data/hechos-punibles'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const fechaFin = searchParams.get('fechaFin')
    const horaInicio = searchParams.get('horaInicio') || '07:00'
    const horaFin = searchParams.get('horaFin') || '07:00'
    const tipoDenuncia = searchParams.get('tipoDenuncia')

    if (!fecha) {
      return NextResponse.json(
        { error: 'La fecha de inicio es requerida' },
        { status: 400 }
      )
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!fechaRegex.test(fecha) || (fechaFin && !fechaRegex.test(fechaFin))) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    console.log('Buscando denuncias para guardia:', fecha, horaInicio, 'al', fechaFin || fecha, horaFin, 'tipo:', tipoDenuncia)

    // Si no hay fechaFin, la guardia termina el día siguiente a la hora especificada
    const fechaHastaCalculada = fechaFin || fecha;
    const intervalFin = fechaFin ? "0 days" : "1 day";

    // Construir condiciones WHERE usando timestamps para respetar el rango manual
    const condiciones: string[] = [
      "(d.fecha_denuncia + d.hora_denuncia::TIME) >= $1::TIMESTAMP",
      `(d.fecha_denuncia + d.hora_denuncia::TIME) < ($2::DATE + INTERVAL '${intervalFin}' + $3::TIME)`,
      "d.estado = 'completada'"
    ]
    const valores: any[] = [`${fecha} ${horaInicio}:00`, fechaHastaCalculada, `${horaFin}:00`]

    let paramIndex = 4

    if (tipoDenuncia) {
      condiciones.push(`d.tipo_denuncia = $${paramIndex}`)
      valores.push(tipoDenuncia)
      paramIndex++
    }

    const whereClause = condiciones.join(' AND ')

    // Obtener denuncias y ampliaciones en una sola consulta cronológica
    const query = `
      WITH denuncias_query AS (
        SELECT 
          d.orden::text as numero_denuncia,
          EXTRACT(YEAR FROM d.fecha_denuncia)::integer as año,
          d.fecha_denuncia,
          d.hora_denuncia,
          d.tipo_denuncia as shp,
          den.nombres as denunciante,
          TRIM(
            COALESCE(d.operador_grado, '') || ' ' || 
            COALESCE(d.operador_nombre, '') || ' ' || 
            COALESCE(d.operador_apellido, '')
          ) as interviniente,
          d.oficina,
          d.monto_dano,
          d.moneda,
          (SELECT sa.entidad_bancaria FROM supuestos_autores sa WHERE sa.denuncia_id = d.id AND sa.entidad_bancaria IS NOT NULL AND sa.entidad_bancaria != '' LIMIT 1) as entidad_reportada
        FROM denuncias d
        LEFT JOIN denunciantes den ON d.denunciante_id = den.id
        WHERE ${whereClause}
      ),
      ampliaciones_query AS (
        SELECT 
          'AMP-' || a.numero_ampliacion || '-' || d.orden as numero_denuncia,
          EXTRACT(YEAR FROM a.fecha_ampliacion)::integer as año,
          a.fecha_ampliacion as fecha_denuncia,
          a.hora_ampliacion as hora_denuncia,
          'AMPLIACION' as shp,
          den.nombres as denunciante,
          TRIM(
            COALESCE(a.operador_grado, '') || ' ' || 
            COALESCE(a.operador_nombre, '') || ' ' || 
            COALESCE(a.operador_apellido, '')
          ) as interviniente,
          d.oficina,
          0 as monto_dano,
          d.moneda,
          (SELECT sa.entidad_bancaria FROM supuestos_autores sa WHERE sa.denuncia_id = d.id AND sa.entidad_bancaria IS NOT NULL AND sa.entidad_bancaria != '' LIMIT 1) as entidad_reportada
        FROM ampliaciones_denuncia a
        JOIN denuncias d ON a.denuncia_id = d.id
        LEFT JOIN denunciantes den ON d.denunciante_id = den.id
        WHERE (a.fecha_ampliacion + a.hora_ampliacion::TIME) >= $1::TIMESTAMP
          AND (a.fecha_ampliacion + a.hora_ampliacion::TIME) < ($2::DATE + INTERVAL '${intervalFin}' + $3::TIME)
          ${tipoDenuncia ? "AND d.tipo_denuncia = $4" : ""}
      )
      SELECT * FROM denuncias_query
      UNION ALL
      SELECT * FROM ampliaciones_query
      ORDER BY fecha_denuncia ASC, hora_denuncia ASC
    `;

    const result = await pool.query(query, valores)

    console.log(`Encontradas ${result.rows.length} denuncias para la fecha ${fecha}`)
    if (result.rows.length > 0) {
      console.log('Primera denuncia encontrada:', result.rows[0])
    } else {
      // Verificar si hay denuncias en esa fecha sin el filtro de estado
      const checkResult = await pool.query(
        `SELECT COUNT(*) as total, 
         COUNT(CASE WHEN estado = 'completada' THEN 1 END) as completadas
         FROM denuncias 
         WHERE fecha_denuncia = $1::DATE`,
        [fecha]
      )
      console.log('Verificación de denuncias para fecha:', checkResult.rows[0])
    }

    // Procesar los resultados para mostrar el tipo específico y el general
    const rowsProcessed = result.rows.map((row: any) => {
      const tipoEspecifico = row.shp || 'SIN ESPECIFICAR'
      const tipoGeneral = obtenerCapitulo(tipoEspecifico) || tipoEspecifico

      return {
        ...row,
        shp: tipoEspecifico, // Mantenemos shp para compatibilidad
        tipo_especifico: tipoEspecifico,
        tipo_general: tipoGeneral
      }
    })

    return NextResponse.json(rowsProcessed)
  } catch (error) {
    console.error('Error obteniendo reporte simple:', error)
    return NextResponse.json(
      { error: 'Error al obtener reporte', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

