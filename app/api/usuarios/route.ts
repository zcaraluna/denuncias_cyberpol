import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET: Obtener lista de usuarios
export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      'SELECT id, usuario, nombre, apellido, grado, oficina, rol, activo, creado_en FROM usuarios ORDER BY creado_en DESC'
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

// POST: Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
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
    if (!['superadmin', 'admin', 'operador', 'supervisor'].includes(rol)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      )
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10)

    // Insertar usuario
    const result = await pool.query(
      `INSERT INTO usuarios (usuario, contraseña, nombre, apellido, grado, oficina, rol)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
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

