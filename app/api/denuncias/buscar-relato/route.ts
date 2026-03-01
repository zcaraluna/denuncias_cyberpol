import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { termino, fechaDesde, fechaHasta, tipoHecho, pagina = 1, limite = 20 } = body
        const offset = (pagina - 1) * limite

        let baseQuery = `
            FROM denuncias d
            LEFT JOIN denunciantes den ON d.denunciante_id = den.id
            WHERE d.estado = 'completada'
        `
        const values: any[] = []
        let paramIndex = 1

        if (termino && termino.trim() !== '') {
            baseQuery += ` AND d.relato ILIKE $${paramIndex}`
            values.push(`%${termino.trim()}%`)
            paramIndex++
        }

        if (tipoHecho && tipoHecho !== '') {
            baseQuery += ` AND d.tipo_denuncia = $${paramIndex}`
            values.push(tipoHecho)
            paramIndex++
        }

        if (fechaDesde) {
            baseQuery += ` AND d.fecha_denuncia >= $${paramIndex}`
            values.push(fechaDesde)
            paramIndex++
        }

        if (fechaHasta) {
            baseQuery += ` AND d.fecha_denuncia <= $${paramIndex}`
            values.push(fechaHasta)
            paramIndex++
        }

        // Query para contar total
        const countQuery = `SELECT COUNT(*) as total ${baseQuery}`
        const countResult = await pool.query(countQuery, values)
        const total = parseInt(countResult.rows[0].total)

        // Query para resultados paginados
        let dataQuery = `
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
                den.cedula as cedula_denunciante,
                d.monto_dano,
                d.moneda
            ${baseQuery}
            ORDER BY d.fecha_denuncia DESC, d.hora_denuncia DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `
        values.push(limite, offset)

        const result = await pool.query(dataQuery, values)

        return NextResponse.json({
            resultados: result.rows,
            total,
            pagina,
            limite
        })
    } catch (error) {
        console.error('Error en búsqueda por relato:', error)
        return NextResponse.json(
            { error: 'Error al realizar la búsqueda' },
            { status: 500 }
        )
    }
}
