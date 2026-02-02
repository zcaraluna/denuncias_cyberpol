import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

/**
 * GET: Genera y descarga un backup completo de la base de datos PostgreSQL
 * Restringido al usuario 'garv'
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Verificar sesión del usuario
        const usuarioCookie = request.cookies.get('usuario_sesion')?.value

        if (!usuarioCookie) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }

        const usuario = JSON.parse(decodeURIComponent(usuarioCookie))

        // 2. Restringir solo a 'garv'
        if (usuario.usuario !== 'garv') {
            return NextResponse.json(
                { error: 'Acceso restringido solo al administrador garv' },
                { status: 403 }
            )
        }

        // 3. Verificar autorización del dispositivo (Fingerprint)
        const fingerprint = request.cookies.get('device_fingerprint')?.value
        if (!fingerprint) {
            return NextResponse.json(
                { error: 'Dispositivo no autorizado' },
                { status: 401 }
            )
        }

        const dbUrl = process.env.DATABASE_URL
        if (!dbUrl) {
            return NextResponse.json(
                { error: 'DATABASE_URL no está configurada' },
                { status: 500 }
            )
        }

        // 3. Ejecutar pg_dump
        // Usamos --no-owner y --no-privileges para que el backup sea más portable
        const command = `pg_dump "${dbUrl}" --no-owner --no-privileges`

        try {
            const { stdout, stderr } = await execPromise(command, { maxBuffer: 10 * 1024 * 1024 }) // 10MB buffer

            if (stderr && !stdout) {
                throw new Error(stderr)
            }

            // 4. Devolver como archivo adjunto
            const fecha = new Date().toISOString().split('T')[0]
            const filename = `backup_cyberpol_${fecha}.sql`

            return new NextResponse(stdout, {
                headers: {
                    'Content-Type': 'application/sql',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            })
        } catch (execError: any) {
            console.error('Error ejecutando pg_dump:', execError)
            return NextResponse.json(
                { error: 'Error al generar el backup. Asegúrate de que pg_dump esté instalado.' },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('Error en API de backup:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
