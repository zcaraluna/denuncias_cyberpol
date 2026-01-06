import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const oficina = searchParams.get('oficina')
    const hechoPunible = searchParams.get('hechoPunible') // Filtro opcional por hecho específico

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
    if (hechoPunible) {
      condiciones.push(`tipo_denuncia = $${valores.length + 1}`)
      valores.push(hechoPunible)
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : ''

    // Total de denuncias
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM denuncias ${whereClause}`,
      valores
    )
    const total = parseInt(totalResult.rows[0].total) || 0

    // Estadísticas por hecho punible específico
    const porHechoPunible = await pool.query(
      `SELECT 
        tipo_denuncia as hecho_punible,
        COUNT(*) as cantidad,
        MIN(fecha_denuncia) as primera_denuncia,
        MAX(fecha_denuncia) as ultima_denuncia
      FROM denuncias 
      ${whereClause}
        AND tipo_denuncia IS NOT NULL
        AND tipo_denuncia != 'OTRO'
        AND tipo_denuncia != 'EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS'
      GROUP BY tipo_denuncia
      ORDER BY cantidad DESC`,
      valores
    )

    // Si se especificó un hecho punible específico, obtener detalles diarios
    let detallesDiarios: any[] = []
    if (hechoPunible) {
      const detalles = await pool.query(
        `SELECT 
          fecha_denuncia::text as fecha,
          COUNT(*) as cantidad
        FROM denuncias 
        ${whereClause}
          AND tipo_denuncia = $${valores.length}
        GROUP BY fecha_denuncia
        ORDER BY fecha_denuncia DESC`,
        valores
      )
      detallesDiarios = detalles.rows
    }

    // Estadísticas por día (si no hay filtro de hecho específico, mostrar top hechos por día)
    let evolucionDiaria: any[] = []
    if (!hechoPunible) {
      const evolucion = await pool.query(
        `SELECT 
          fecha_denuncia::text as fecha,
          tipo_denuncia as hecho_punible,
          COUNT(*) as cantidad
        FROM denuncias 
        ${whereClause}
          AND tipo_denuncia IS NOT NULL
          AND tipo_denuncia != 'OTRO'
          AND tipo_denuncia != 'EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS'
        GROUP BY fecha_denuncia, tipo_denuncia
        ORDER BY fecha_denuncia DESC, cantidad DESC
        LIMIT 100`,
        valores
      )
      evolucionDiaria = evolucion.rows
    }

    // Estadísticas por oficina y hecho punible
    const porOficinaYHecho = await pool.query(
      `SELECT 
        oficina,
        tipo_denuncia as hecho_punible,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause}
        AND tipo_denuncia IS NOT NULL
        AND tipo_denuncia != 'OTRO'
        AND tipo_denuncia != 'EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS'
      GROUP BY oficina, tipo_denuncia
      ORDER BY oficina, cantidad DESC`,
      valores
    )

    // Estadísticas especiales (OTRO y EXTRAVÍO) por separado
    const otrosTipos = await pool.query(
      `SELECT 
        CASE 
          WHEN tipo_denuncia = 'OTRO' THEN COALESCE(NULLIF(otro_tipo, ''), 'OTRO')
          WHEN tipo_denuncia = 'EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS' THEN 'EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS'
          ELSE tipo_denuncia
        END as tipo_especial,
        COUNT(*) as cantidad
      FROM denuncias 
      ${whereClause}
        AND (tipo_denuncia = 'OTRO' OR tipo_denuncia = 'EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS')
      GROUP BY tipo_denuncia, otro_tipo
      ORDER BY cantidad DESC`,
      valores
    )

    return NextResponse.json({
      total,
      porHechoPunible: porHechoPunible.rows,
      detallesDiarios,
      evolucionDiaria,
      porOficinaYHecho: porOficinaYHecho.rows,
      otrosTipos: otrosTipos.rows
    })
  } catch (error) {
    console.error('Error obteniendo estadísticas por hecho punible:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas por hecho punible' },
      { status: 500 }
    )
  }
}

