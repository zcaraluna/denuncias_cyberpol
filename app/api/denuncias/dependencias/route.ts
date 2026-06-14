import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

const DEPARTAMENTOS_PREDEFINIDOS = [
  "Departamento Especializado Contra el Lavado de Dinero y Financiamiento del Terrorismo",
  "Departamento Especializado Contra la Violación de los Derechos Intelectuales",
  "Departamento Especializado en la Investigación del Cybercrímen y los Hechos Punibles Informáticos",
  "Departamento Especializado Contra los Hechos Punibles Financieros",
  "Departamento Especializado Contra los Hechos Punibles Económicos",
  "Departamento Especializado Contra la Falsificación de Documentos y Abuso de Documentos de Identidad",
  "Departamento Especializado en el Control y Fiscalización de Empresas de Seguridad Privada y afines",
  "Departamento Especializado en Seguridad Bancaria",
  "Subunidad de Administración y Finanzas (SUAF)",
  "Asesoría Jurídica",
  "Gabinete"
]

export async function GET(request: NextRequest) {
  try {
    // Consultar las acumulaciones históricas
    const result = await pool.query(
      `SELECT dependencia_remitida, COUNT(*) as cantidad 
       FROM denuncias 
       WHERE dependencia_remitida IS NOT NULL AND dependencia_remitida != 'Ninguna'
       GROUP BY dependencia_remitida`
    )

    const countMap = new Map<string, number>()
    result.rows.forEach((row: { dependencia_remitida: string; cantidad: string }) => {
      countMap.set(row.dependencia_remitida, parseInt(row.cantidad, 10))
    })

    // Ordenar dependencias predefinidas según la lógica:
    // 1. Mayor cantidad de acumulaciones (descendente)
    // 2. Orden original de la lista en caso de empate (ascendente)
    const departamentosOrdenados = [...DEPARTAMENTOS_PREDEFINIDOS].sort((a, b) => {
      const countA = countMap.get(a) || 0
      const countB = countMap.get(b) || 0

      if (countB !== countA) {
        return countB - countA
      }

      return DEPARTAMENTOS_PREDEFINIDOS.indexOf(a) - DEPARTAMENTOS_PREDEFINIDOS.indexOf(b)
    })

    return NextResponse.json({
      success: true,
      departamentos: departamentosOrdenados
    })
  } catch (error) {
    console.error('Error al obtener dependencias ordenadas:', error)
    return NextResponse.json(
      { error: 'Error al obtener dependencias' },
      { status: 500 }
    )
  }
}
