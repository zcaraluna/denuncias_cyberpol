import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET: Obtener lista de usuarios (filtrado regional y enmascaramiento para supervisores)
export async function GET(request: NextRequest) {
  try {
    // 1. Obtener la sesión del usuario para aplicar filtrado regional y enmascaramiento
    const usuarioCookie = request.cookies.get('usuario_sesion')?.value
    let oficinaFilter: string | null = null
    let esSupervisor = false

    if (usuarioCookie) {
      try {
        const usuario = JSON.parse(decodeURIComponent(usuarioCookie))
        if (usuario.rol === 'supervisor') {
          oficinaFilter = usuario.oficina
          esSupervisor = true
        } else if (usuario.rol === 'operador') {
          return NextResponse.json({ error: 'Acción no autorizada' }, { status: 403 })
        }
      } catch (e) {
        // Ignorar
      }
    }

    let query = 'SELECT id, usuario, nombre, apellido, grado, oficina, rol, activo, creado_en FROM usuarios'
    const queryParams: any[] = []

    if (oficinaFilter) {
      query += ' WHERE oficina = $1'
      queryParams.push(oficinaFilter)
    }

    query += ' ORDER BY creado_en DESC'

    const result = await pool.query(query, queryParams)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

// POST: Crear nuevo usuario (solo administradores)
export async function POST(request: NextRequest) {
  try {
    // Verificar sesión del creador
    const usuarioCookie = request.cookies.get('usuario_sesion')?.value
    if (!usuarioCookie) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    let creador: { rol: string }
    try {
      creador = JSON.parse(decodeURIComponent(usuarioCookie))
    } catch (e) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    // Solo developer, superadmin y admin pueden crear usuarios
    if (creador.rol !== 'developer' && creador.rol !== 'superadmin' && creador.rol !== 'admin') {
      return NextResponse.json({ error: 'Acción no autorizada' }, { status: 403 })
    }

    const body = await request.json()
    const { usuario, contraseña, nombre, apellido, grado, oficina, rol } = body

    // Validar campos requeridos
    if (!usuario || !contraseña || !nombre || !apellido || !grado || !oficina || !rol) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar rol
    if (!['superadmin', 'admin', 'operador', 'supervisor', 'developer'].includes(rol)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      )
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10)

    // Insertar usuario (debe_cambiar_contraseña se establece automáticamente a TRUE por defecto)
    const result = await pool.query(
      `INSERT INTO usuarios (usuario, contraseña, nombre, apellido, grado, oficina, rol, debe_cambiar_contraseña)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING id, usuario, nombre, apellido, grado, oficina, rol, activo`,
      [usuario, hashedPassword, nombre, apellido, grado, oficina, rol]
    )

    return NextResponse.json({
      success: true,
      usuario: result.rows[0]
    })
  } catch (error: any) {
    console.error('Error creando usuario:', error)
    
    if (error.code === '23505') { // unique_violation
      return NextResponse.json(
        { error: 'El nombre de usuario ya existe' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}

