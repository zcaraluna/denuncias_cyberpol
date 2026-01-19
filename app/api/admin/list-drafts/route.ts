import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
    const client = await pool.connect()
    try {
        const result = await client.query(`
      SELECT 
        d.id, 
        d.fecha_denuncia, 
        d.hora_denuncia,
        d.estado,
        u.nombre as operador_nombre,
        u.apellido as operador_apellido,
        de.nombres as denunciante_principal
      FROM denuncias d
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      LEFT JOIN denunciantes de ON d.denunciante_id = de.id
      WHERE d.estado = 'borrador'
      ORDER BY d.id DESC
    `)
        return NextResponse.json(result.rows)
    } catch (error) {
        console.error('Error listing drafts:', error)
        return NextResponse.json({ error: 'Error listing drafts' }, { status: 500 })
    } finally {
        client.release()
    }
}
