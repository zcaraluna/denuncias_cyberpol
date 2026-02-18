import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { termino, fechaDesde, fechaHasta, tipoHecho } = body

        let query = `
      SELECT 
        d.id,
        d.denunciante_id,
        d.orden as numero_orden,
        d.fecha_denuncia,
        d.hora_denuncia,
        d.tipo_denuncia as tipo_hecho,
        d.hash as hash_denuncia,
        d.estado,
        d.relato,
        den.nombres as nombre_denunciante,
        den.cedula as cedula_denunciante
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.estado = 'completada'
    `
        const values: any[] = []
        let paramIndex = 1

        if (termino && termino.trim() !== '') {
            query += ` AND d.relato ILIKE $${paramIndex}`
            values.push(`%${termino.trim()}%`)
            paramIndex++
        }

        if (tipoHecho && tipoHecho !== '') {
            query += ` AND d.tipo_denuncia = $${paramIndex}`
            values.push(tipoHecho)
            paramIndex++
        }

        if (fechaDesde) {
            query += ` AND d.fecha_denuncia >= $${paramIndex}`
            values.push(fechaDesde)
            paramIndex++
        }

        if (fechaHasta) {
            query += ` AND d.fecha_denuncia <= $${paramIndex}`
            values.push(fechaHasta)
            paramIndex++
        }

        query += ` ORDER BY d.fecha_denuncia DESC, d.hora_denuncia DESC LIMIT 100`

        const result = await pool.query(query, values)
        return NextResponse.json(result.rows)
    } catch (error) {
        console.error('Error en búsqueda por relato:', error)
        return NextResponse.json(
            { error: 'Error al realizar la búsqueda' },
            { status: 500 }
        )
    }
}
