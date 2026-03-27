import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const client = await pool.connect()
    
    // 1. Promedio de denuncias por día
    const dailyComplaintsResult = await client.query(`
      SELECT AVG(count)::float as avg_complaints_per_day
      FROM (
        SELECT fecha_denuncia, COUNT(*) as count
        FROM denuncias
        WHERE estado = 'completada'
        GROUP BY fecha_denuncia
      ) as subquery
    `)

    // 2. Tiempo promedio de formulación (en minutos)
    // Usamos la diferencia entre creado_en (fin) y fecha_denuncia + hora_denuncia (inicio)
    const formulationTimeResult = await client.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (creado_en - (fecha_denuncia + (CASE 
        WHEN hora_denuncia ~ '^[0-9]{2}:[0-9]{2}$' THEN hora_denuncia 
        ELSE '00:00' 
      END)::time))) / 60)::float as avg_formulation_time_minutes
      FROM denuncias
      WHERE estado = 'completada' 
        AND fecha_denuncia IS NOT NULL
        AND hora_denuncia IS NOT NULL
    `)

    // 3. Cantidad total de oficinas (basado en los usuarios registrados)
    const officesResult = await client.query(`
      SELECT COUNT(DISTINCT oficina) as total_offices
      FROM usuarios
      WHERE oficina IS NOT NULL AND oficina != ''
    `)

    // 4. Últimas denuncias para un mini-gráfico o lista (opcional, pero útil)
    const recentActivity = await client.query(`
      SELECT fecha_denuncia, COUNT(*) as count
      FROM denuncias
      WHERE estado = 'completada'
      GROUP BY fecha_denuncia
      ORDER BY fecha_denuncia DESC
      LIMIT 7
    `)

    client.release()

    return NextResponse.json({
      avgComplaintsPerDay: dailyComplaintsResult.rows[0].avg_complaints_per_day || 0,
      avgFormulationTimeMinutes: formulationTimeResult.rows[0].avg_formulation_time_minutes || 0,
      totalOffices: parseInt(officesResult.rows[0].total_offices || 0),
      recentActivity: recentActivity.rows.reverse()
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json({ error: 'Error fetching metrics', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
