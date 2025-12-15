import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // 'excel' o 'csv'
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const oficina = searchParams.get('oficina')
    const tipoDenuncia = searchParams.get('tipoDenuncia')
    const usuarioId = searchParams.get('usuarioId')

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
    if (tipoDenuncia) {
      condiciones.push(`d.tipo_denuncia = $${valores.length + 1}`)
      valores.push(tipoDenuncia)
    }
    if (usuarioId) {
      condiciones.push(`d.usuario_id = $${valores.length + 1}`)
      valores.push(usuarioId)
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : ''

    // Obtener datos de denuncias para exportar
    const result = await pool.query(
      `SELECT 
        d.orden as numero_orden,
        d.hash,
        d.fecha_denuncia,
        d.hora_denuncia,
        d.fecha_hecho,
        d.hora_hecho,
        CASE WHEN d.tipo_denuncia = 'OTRO' THEN COALESCE(d.otro_tipo, 'OTRO') ELSE d.tipo_denuncia END as tipo_denuncia,
        d.lugar_hecho,
        d.latitud,
        d.longitud,
        d.monto_dano,
        d.moneda,
        d.oficina,
        d.operador_grado || ' ' || d.operador_nombre || ' ' || d.operador_apellido as operador,
        den.nombres as nombre_denunciante,
        den.cedula as cedula_denunciante,
        den.edad as edad_denunciante,
        den.estado_civil as estado_civil_denunciante,
        den.nacionalidad as nacionalidad_denunciante,
        den.domicilio as domicilio_denunciante,
        den.correo as correo_denunciante
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      ${whereClause}
      ORDER BY d.fecha_denuncia DESC, d.hora_denuncia DESC`,
      valores
    )

    // Convertir a formato para exportación
    const datos = result.rows.map(row => ({
      'Número de Orden': row.numero_orden,
      'Hash': row.hash,
      'Fecha Denuncia': row.fecha_denuncia,
      'Hora Denuncia': row.hora_denuncia,
      'Fecha Hecho': row.fecha_hecho,
      'Hora Hecho': row.hora_hecho,
      'Tipo Denuncia': row.tipo_denuncia,
      'Lugar Hecho': row.lugar_hecho,
      'Latitud': row.latitud,
      'Longitud': row.longitud,
      'Monto Daño': row.monto_dano,
      'Moneda': row.moneda,
      'Oficina': row.oficina,
      'Operador': row.operador,
      'Nombre Denunciante': row.nombre_denunciante,
      'Cédula Denunciante': row.cedula_denunciante,
      'Edad Denunciante': row.edad_denunciante,
      'Estado Civil': row.estado_civil_denunciante,
      'Nacionalidad': row.nacionalidad_denunciante,
      'Domicilio Denunciante': row.domicilio_denunciante,
      'Correo Denunciante': row.correo_denunciante
    }))

    if (tipo === 'csv') {
      // Generar CSV
      const headers = Object.keys(datos[0] || {}).join(',')
      const rows = datos.map(row => Object.values(row).map(val => 
        val === null || val === undefined ? '' : String(val).replace(/,/g, ';')
      ).join(','))
      const csv = [headers, ...rows].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="denuncias_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      // Generar Excel usando exceljs (alternativa segura a xlsx)
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Denuncias')
      
      // Agregar encabezados
      if (datos.length > 0) {
        worksheet.columns = Object.keys(datos[0]).map(key => ({
          header: key,
          key: key,
          width: 15
        }))
        
        // Agregar datos
        datos.forEach(row => {
          worksheet.addRow(row)
        })
      }
      
      // Generar buffer
      const excelBuffer = await workbook.xlsx.writeBuffer()
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="denuncias_${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      })
    }
  } catch (error) {
    console.error('Error exportando datos:', error)
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    )
  }
}

