import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
import { canonicalizarOficina } from '@/lib/data/oficinas'
import { leerSesion } from '@/lib/sesion'

// GET: Obtener lista de usuarios (filtrado regional y enmascaramiento para supervisores)
export async function GET(request: NextRequest) {
  try {
    // 1. Obtener la sesión del usuario para aplicar filtrado regional y enmascaramiento
    const usuario = leerSesion(request)
    let oficinaFilter: string | null = null
    let esSupervisor = false

    if (usuario) {
      if (usuario.rol === 'supervisor') {
        oficinaFilter = usuario.oficina
        esSupervisor = true
      } else if (usuario.rol === 'operador') {
        return NextResponse.json({ error: 'Acción no autorizada' }, { status: 403 })
      }
    }

    let query = `
      SELECT id, usuario, nombre, apellido, grado, oficina, rol, activo, creado_en, tipo_cuenta,
        (SELECT COUNT(*) FROM preguntas_seguridad_usuarios WHERE usuario_id = usuarios.id) >= 5 AS preguntas_configuradas
      FROM usuarios
    `
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
    const creador = leerSesion(request)
    if (!creador) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Solo developer, superadmin y admin pueden crear usuarios
    if (creador.rol !== 'developer' && creador.rol !== 'superadmin' && creador.rol !== 'admin') {
      return NextResponse.json({ error: 'Acción no autorizada' }, { status: 403 })
    }

    const body = await request.json()
    const { usuario, contraseña, nombre, apellido, grado, oficina: oficinaRaw, rol, tipo_cuenta } = body

    // Canonicalizar la oficina para que coincida exactamente con la numeración de
    // denuncias y el índice único por oficina+año.
    const oficina = oficinaRaw ? canonicalizarOficina(oficinaRaw) : oficinaRaw

    const accountType = tipo_cuenta || 'personal'

    // Validar campos requeridos
    if (!usuario || !contraseña || !oficina || !rol) {
      return NextResponse.json(
        { error: 'Campos usuario, contraseña, oficina y rol son obligatorios' },
        { status: 400 }
      )
    }

    if (accountType === 'personal') {
      if (!nombre || !apellido || !grado) {
        return NextResponse.json(
          { error: 'Para cuentas personales, el nombre, apellido y grado son obligatorios' },
          { status: 400 }
        )
      }
    } else {
      if (!nombre) {
        return NextResponse.json(
          { error: 'Para cuentas de oficina, el nombre de la oficina es obligatorio' },
          { status: 400 }
        )
      }
    }

    // Validar rol
    if (!['superadmin', 'admin', 'operador', 'supervisor', 'developer', 'visor'].includes(rol)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      )
    }

    // Solo el rol developer puede crear un usuario con el rol developer
    if (rol === 'developer' && creador.rol !== 'developer') {
      return NextResponse.json(
        { error: 'No autorizado para asignar el rol Developer' },
        { status: 403 }
      )
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10)

    // Insertar usuario (debe_cambiar_contraseña se establece automáticamente a TRUE por defecto)
    const result = await pool.query(
      `INSERT INTO usuarios (usuario, contraseña, nombre, apellido, grado, oficina, rol, debe_cambiar_contraseña, tipo_cuenta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8)
       RETURNING id, usuario, nombre, apellido, grado, oficina, rol, activo, tipo_cuenta`,
      [usuario, hashedPassword, nombre || null, apellido || null, grado || null, oficina, rol, accountType]
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

