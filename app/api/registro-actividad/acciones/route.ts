import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar sesión del usuario
    const usuarioCookie = request.cookies.get('usuario_sesion')?.value
    if (!usuarioCookie) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    let usuario: { rol: string }
    try {
      usuario = JSON.parse(decodeURIComponent(usuarioCookie))
    } catch (e) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    // Restricción estricta: Solo superadmin y developer pueden visualizar estos logs
    if (usuario.rol !== 'superadmin' && usuario.rol !== 'developer') {
      return NextResponse.json({ error: 'Acción no autorizada' }, { status: 403 })
    }

    // 2. Consultar logs de auditoría de usuarios
    const result = await pool.query(
      `SELECT 
        r.id,
        r.usuario_realizador_id,
        r.usuario_afectado_id,
        r.accion,
        r.detalle,
        r.fecha_accion,
        u_real.nombre as nombre_realizador,
        u_real.apellido as apellido_realizador,
        u_real.grado as grado_realizador,
        u_real.oficina as oficina_realizador,
        u_afec.nombre as nombre_afectado,
        u_afec.apellido as apellido_afectado,
        u_afec.grado as grado_afectado,
        u_afec.oficina as oficina_afectado,
        u_afec.usuario as usuario_afectado
      FROM registro_auditoria_usuarios r
      LEFT JOIN usuarios u_real ON r.usuario_realizador_id = u_real.id
      LEFT JOIN usuarios u_afec ON r.usuario_afectado_id = u_afec.id
      ORDER BY r.fecha_accion DESC
      LIMIT 1000`
    )

    // Corregir las fechas restando 3 horas para ajustar la zona horaria del VPS (Paraguay)
    const accionesCorregidas = result.rows.map((accion: any) => {
      if (accion.fecha_accion) {
        const fecha = new Date(accion.fecha_accion)
        // Restar 3 horas (10800000 milisegundos)
        const fechaCorregida = new Date(fecha.getTime() - 3 * 60 * 60 * 1000)
        return {
          ...accion,
          fecha_accion: fechaCorregida.toISOString()
        }
      }
      return accion
    })

    return NextResponse.json(accionesCorregidas)

  } catch (error) {
    console.error('Error obteniendo log de acciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener log de acciones' },
      { status: 500 }
    )
  }
}
