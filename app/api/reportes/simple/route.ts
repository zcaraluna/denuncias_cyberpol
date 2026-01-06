import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { obtenerCapitulo } from '@/lib/data/hechos-punibles'

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

    // Procesar los resultados para mostrar el tipo específico con fallback al genérico
    // El tipo_denuncia en la BD ya es el específico (ej: "Estafa", "Robo")
    // Si por alguna razón es un genérico, lo mostramos como fallback
    const rowsProcessed = result.rows.map((row: any) => {
      let shp = row.shp || ''
      
      // Si el tipo_denuncia es un capítulo genérico (empieza con "HECHO PUNIBLE"),
      // lo mostramos tal cual como fallback
      // Si es un tipo específico, lo mostramos tal cual
      // Los casos especiales OTRO y EXTRAVÍO se muestran tal cual
      if (!shp) {
        shp = '-'
      }
      
      return { ...row, shp }
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

