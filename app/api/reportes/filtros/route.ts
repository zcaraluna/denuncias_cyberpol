import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Obtener oficinas únicas
    const oficinasResult = await pool.query(
      `SELECT DISTINCT oficina FROM denuncias WHERE oficina IS NOT NULL ORDER BY oficina`
    )
    const oficinas = oficinasResult.rows.map(row => row.oficina)

    // Obtener tipos de denuncia únicos
    const tiposResult = await pool.query(
      `SELECT DISTINCT 
        CASE WHEN tipo_denuncia = 'OTRO' THEN COALESCE(otro_tipo, 'OTRO') ELSE tipo_denuncia END as tipo
      FROM denuncias 
      WHERE tipo_denuncia IS NOT NULL
      ORDER BY tipo`
    )
    const tipos = tiposResult.rows.map(row => row.tipo)

    // Obtener operadores únicos
    const operadoresResult = await pool.query(
      `SELECT DISTINCT 
        u.id,
        u.nombre || ' ' || u.apellido as nombre_completo,
        u.grado,
        d.oficina
      FROM denuncias d
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      WHERE u.id IS NOT NULL
      ORDER BY nombre_completo`
    )
    const operadores = operadoresResult.rows

    return NextResponse.json({
      oficinas,
      tipos,
      operadores
    })
  } catch (error) {
    console.error('Error obteniendo opciones de filtros:', error)
    return NextResponse.json(
      { error: 'Error al obtener opciones de filtros' },
      { status: 500 }
    )
  }
}






