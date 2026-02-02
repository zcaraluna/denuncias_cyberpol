import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

/**
 * GET: Genera y descarga un backup de la base de datos PostgreSQL
 * Implementación compatible con Vercel (Pure JavaScript)
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Verificar sesión del usuario
        const usuarioCookie = request.cookies.get('usuario_sesion')?.value

        if (!usuarioCookie) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const usuario = JSON.parse(decodeURIComponent(usuarioCookie))

        // 2. Restringir solo a 'garv'
        if (usuario.usuario !== 'garv') {
            return NextResponse.json({ error: 'Acceso restringido solo al administrador garv' }, { status: 403 })
        }

        // 3. Verificar autorización del dispositivo (Fingerprint)
        const fingerprint = request.cookies.get('device_fingerprint')?.value
        if (!fingerprint) {
            return NextResponse.json({ error: 'Dispositivo no autorizado' }, { status: 401 })
        }

        let sqlDump = `-- Backup generado dinámicamente (Vercel Compatible)\n-- Fecha: ${new Date().toISOString()}\n\n`
        sqlDump += `SET statement_timeout = 0;\nSET client_encoding = 'UTF8';\nSET standard_conforming_strings = on;\nSET check_function_bodies = false;\nSET client_min_messages = warning;\n\n`

        // 4. Obtener lista de tablas
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `)

        for (const tableRow of tablesResult.rows) {
            const tableName = tableRow.table_name

            // Ignorar tablas de sistema si las hubiera
            if (tableName === 'spatial_ref_sys') continue

            sqlDump += `--\n-- Estructura y datos de tabla: ${tableName}\n--\n\n`

            // Obtener columnas para la tabla
            const columnsResult = await pool.query(`
                SELECT column_name, data_type, column_default, is_nullable
                FROM information_schema.columns
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position;
            `, [tableName])

            const columns = columnsResult.rows.map(c => c.column_name)

            // Obtener datos
            const dataResult = await pool.query(`SELECT * FROM public."${tableName}"`)

            if (dataResult.rows.length > 0) {
                sqlDump += `INSERT INTO public."${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES\n`

                const rowsSql = dataResult.rows.map(row => {
                    const values = columnsResult.rows.map(col => {
                        const val = row[col.column_name]
                        if (val === null) return 'NULL'

                        // Manejar tipos de datos
                        if (typeof val === 'string') {
                            return `'${val.replace(/'/g, "''")}'`
                        }
                        if (val instanceof Date) {
                            return `'${val.toISOString()}'`
                        }
                        if (Buffer.isBuffer(val)) {
                            return `decode('${val.toString('hex')}', 'hex')`
                        }
                        if (typeof val === 'object') {
                            return `'${JSON.stringify(val).replace(/'/g, "''")}'`
                        }
                        return val
                    })
                    return `(${values.join(', ')})`
                })

                sqlDump += rowsSql.join(',\n') + ';\n\n'
            }
        }

        // 5. Devolver como archivo adjunto
        const fecha = new Date().toISOString().split('T')[0]
        const filename = `backup_cyberpol_js_${fecha}.sql`

        return new NextResponse(sqlDump, {
            headers: {
                'Content-Type': 'application/sql',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })

    } catch (error: any) {
        console.error('Error detallado en API de backup:', error)
        return NextResponse.json(
            { error: 'Error al generar el backup', details: error.message },
            { status: 500 }
        )
    }
}
