import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    if (searchParams.get('obtener_oficinas') === 'true') {
      const result = await pool.query(
        `SELECT DISTINCT oficina 
         FROM denuncias 
         WHERE oficina IS NOT NULL AND oficina != '' AND estado = 'completada'
         ORDER BY oficina`
      )
      return NextResponse.json(result.rows.map(r => r.oficina))
    }

    const periodo = searchParams.get('periodo') || 'mensual'
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0]
    const mes = searchParams.get('mes') || String(new Date().getMonth() + 1)
    const año = searchParams.get('año') || String(new Date().getFullYear())
    const oficina = searchParams.get('oficina')

    const condiciones: string[] = [
      "d.estado = 'completada'",
      "d.dependencia_remitida IS NOT NULL",
      "d.dependencia_remitida != 'Ninguna'"
    ]
    const valores: any[] = []

    if (periodo !== 'historico') {
      let start = ''
      let end = ''

      if (periodo === 'diario') {
        start = fecha
        end = fecha
      } else if (periodo === 'semanal') {
        // Encontrar lunes y domingo de la semana para la fecha dada en UTC para evitar desfases de zona horaria
        const dateObj = new Date(fecha)
        const day = dateObj.getUTCDay()
        // Si getUTCDay() es 0 es domingo, queremos restar de manera correspondiente para llegar al lunes
        const diffToMonday = dateObj.getUTCDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(dateObj.setUTCDate(diffToMonday))
        const sunday = new Date(monday)
        sunday.setUTCDate(monday.getUTCDate() + 6)
        
        start = monday.toISOString().split('T')[0]
        end = sunday.toISOString().split('T')[0]
      } else if (periodo === 'mensual') {
        start = `${año}-${mes.padStart(2, '0')}-01`
        end = new Date(parseInt(año), parseInt(mes), 0).toISOString().split('T')[0]
      } else if (periodo === 'anual') {
        start = `${año}-01-01`
        end = `${año}-12-31`
      }

      condiciones.push(`d.fecha_denuncia BETWEEN $${valores.length + 1}::DATE AND $${valores.length + 2}::DATE`)
      valores.push(start, end)
    }

    if (oficina) {
      condiciones.push(`d.oficina = $${valores.length + 1}`)
      valores.push(oficina)
    }

    const whereClause = `WHERE ${condiciones.join(' AND ')}`

    // ranking de dependencias con más denuncias remitidas
    const result = await pool.query(
      `SELECT d.dependencia_remitida as departamento, COUNT(*)::integer as cantidad 
       FROM denuncias d
       ${whereClause}
       GROUP BY d.dependencia_remitida
       ORDER BY cantidad DESC`,
      valores
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error al obtener reporte por departamentos:', error)
    return NextResponse.json(
      { error: 'Error al obtener reporte por departamentos', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
