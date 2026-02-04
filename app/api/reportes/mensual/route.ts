import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { obtenerCapitulo } from '@/lib/data/hechos-punibles'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const mes = searchParams.get('mes')
        const año = searchParams.get('año')

        if (!mes || !año) {
            return NextResponse.json(
                { error: 'El mes y el año son requeridos' },
                { status: 400 }
            )
        }

        const primerDia = `${año}-${mes.padStart(2, '0')}-01`
        const ultimoDia = new Date(parseInt(año), parseInt(mes), 0).toISOString().split('T')[0]

        // Obtener todas las denuncias del mes para procesar en memoria los tipos y evolución diaria
        const denunciasResult = await pool.query(
            `SELECT d.tipo_denuncia, d.orden, EXTRACT(YEAR FROM d.fecha_denuncia)::integer as año, d.denunciante_id, TO_CHAR(d.fecha_denuncia, 'YYYY-MM-DD') as fecha
       FROM denuncias d
       WHERE d.fecha_denuncia BETWEEN $1::DATE AND $2::DATE
         AND d.estado = 'completada'`,
            [primerDia, ultimoDia]
        )

        const denuncias = denunciasResult.rows

        // 1. Resumen por Tipo de Denuncia y Evolución Diaria
        const statsEspecifico: Record<string, number> = {}
        const statsGeneral: Record<string, number> = {}
        const statsDiarios: Record<string, number> = {}

        denuncias.forEach(d => {
            const esp = d.tipo_denuncia || 'SIN ESPECIFICAR'
            const gen = obtenerCapitulo(esp) || esp
            const fecha = d.fecha

            statsEspecifico[esp] = (statsEspecifico[esp] || 0) + 1
            statsGeneral[gen] = (statsGeneral[gen] || 0) + 1
            statsDiarios[fecha] = (statsDiarios[fecha] || 0) + 1
        })

        const resumen_especifico = Object.entries(statsEspecifico)
            .map(([tipo, total]) => ({ tipo, total }))
            .sort((a, b) => b.total - a.total)

        const resumen_general = Object.entries(statsGeneral)
            .map(([tipo, total]) => ({ tipo, total }))
            .sort((a, b) => b.total - a.total)

        // Generar lista completa de días para el gráfico (incluso los que tienen 0)
        const evolucion_diaria = []
        const datePtr = new Date(parseInt(año), parseInt(mes) - 1, 1)
        const lastDate = new Date(parseInt(año), parseInt(mes), 0).getDate()

        for (let day = 1; day <= lastDate; day++) {
            const dateStr = `${año}-${mes.padStart(2, '0')}-${day.toString().padStart(2, '0')}`
            evolucion_diaria.push({
                fecha: dateStr,
                dia: day,
                total: statsDiarios[dateStr] || 0
            })
        }

        // 2. Denunciantes Recurrentes (más de una vez al mes)
        const recurrentesResult = await pool.query(
            `SELECT 
        den.nombres as denunciante,
        den.cedula,
        COUNT(d.id) as cantidad,
        ARRAY_AGG(d.orden || '/' || EXTRACT(YEAR FROM d.fecha_denuncia)::integer) as numeros_denuncia,
        ARRAY_AGG(COALESCE(d.tipo_denuncia, 'SIN ESPECIFICAR')) as tipos,
        ARRAY_AGG(TO_CHAR(d.fecha_denuncia, 'YYYY-MM-DD') || ' ' || COALESCE(d.hora_denuncia, '')) as fechas,
        ARRAY_AGG(
          TRIM(
            COALESCE(d.operador_grado, '') || ' ' || 
            COALESCE(d.operador_nombre, '') || ' ' || 
            COALESCE(d.operador_apellido, '')
          )
        ) as oficiales
      FROM denuncias d
      JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.fecha_denuncia BETWEEN $1::DATE AND $2::DATE
        AND d.estado = 'completada'
      GROUP BY den.nombres, den.cedula
      HAVING COUNT(d.id) > 1
      ORDER BY cantidad DESC`,
            [primerDia, ultimoDia]
        )

        // 3. Top 5 Operadores del mes
        const topOperadoresResult = await pool.query(
            `SELECT 
                TRIM(
                    COALESCE(operador_grado, '') || ' ' || 
                    COALESCE(operador_nombre, '') || ' ' || 
                    COALESCE(operador_apellido, '')
                ) as operador,
                COUNT(*) as total
             FROM denuncias
             WHERE fecha_denuncia BETWEEN $1::DATE AND $2::DATE
               AND estado = 'completada'
             GROUP BY operador
             ORDER BY total DESC
             LIMIT 5`,
            [primerDia, ultimoDia]
        )

        return NextResponse.json({
            resumen_especifico,
            resumen_general,
            evolucion_diaria,
            denunciantes_recurrentes: recurrentesResult.rows,
            top_operadores: topOperadoresResult.rows
        })
    } catch (error) {
        console.error('Error obteniendo resumen mensual:', error)
        return NextResponse.json(
            { error: 'Error al obtener resumen', details: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        )
    }
}
