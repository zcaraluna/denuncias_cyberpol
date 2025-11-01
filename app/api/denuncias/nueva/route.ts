import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { randomBytes } from 'crypto'

function generarHash(oficina: string): string {
  const identificadores: Record<string, string> = {
    'Asunción': 'A',
    'Ciudad del Este': 'B',
    'Encarnación': 'C',
    'Coronel Oviedo': 'D'
  }

  const idOficina = identificadores[oficina] || '0'
  const año = new Date().getFullYear() % 100
  const hashBase = randomBytes(3).toString('hex').toUpperCase()
  
  return `${hashBase}${idOficina}${año.toString().padStart(2, '0')}`
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    const body = await request.json()
    const { borradorId, denunciante, denuncia, autor, infoAdicional, usuarioId } = body

    // Si viene un borradorId, actualizar el borrador existente
    if (borradorId) {
      // Usar la lógica de actualización existente
      const now = new Date()
      const fechaActual = now.toLocaleDateString('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Asuncion'
      }).split('/').reverse().join('-')
      const horaActual = now.toLocaleTimeString('es-PY', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Asuncion'
      })

      // Actualizar denunciante
      const numeroDoc = denunciante.numeroDocumento || denunciante.cedula
      await client.query(
        `UPDATE denunciantes SET
          nombres = $1, cedula = $2, tipo_documento = $3, nacionalidad = $4, 
          estado_civil = $5, edad = $6, fecha_nacimiento = $7, lugar_nacimiento = $8,
          telefono = $9, profesion = $10
        WHERE id = (SELECT denunciante_id FROM denuncias WHERE id = $11)`,
        [
          denunciante.nombres,
          numeroDoc,
          denunciante.tipoDocumento,
          denunciante.nacionalidad,
          denunciante.estadoCivil,
          parseInt(denunciante.edad),
          denunciante.fechaNacimiento,
          denunciante.lugarNacimiento,
          denunciante.telefono,
          denunciante.profesion || null,
          borradorId
        ]
      )

      // Obtener número de orden
      const año = fechaActual.split('-')[0]
      const ordenResult = await client.query(
        `SELECT COALESCE(MAX(orden), 0) + 1 as orden
         FROM denuncias
         WHERE EXTRACT(YEAR FROM fecha_denuncia) = $1 AND orden >= 1`,
        [año]
      )
      const numeroOrden = ordenResult.rows[0].orden

      // Obtener datos del usuario y generar hash
      const usuarioResult = await client.query(
        'SELECT nombre, apellido, grado, oficina FROM usuarios WHERE id = $1',
        [usuarioId]
      )
      const usuario = usuarioResult.rows[0]
      const hash = generarHash(usuario.oficina)

      // Actualizar denuncia a completada
      await client.query(
        `UPDATE denuncias SET
          fecha_denuncia = $1, hora_denuncia = $2, fecha_hecho = $3, hora_hecho = $4,
          tipo_denuncia = $5, otro_tipo = $6, relato = $7, lugar_hecho = $8,
          latitud = $9, longitud = $10, monto_dano = $11, moneda = $12,
          estado = 'completada', orden = $13, hash = $14
        WHERE id = $15`,
        [
          fechaActual,
          horaActual,
          denuncia.fechaHecho,
          denuncia.horaHecho,
          denuncia.tipoDenuncia,
          denuncia.otroTipo,
          denuncia.relato,
          denuncia.lugarHecho,
          denuncia.latitud,
          denuncia.longitud,
          denuncia.montoDano,
          denuncia.moneda,
          numeroOrden,
          hash,
          borradorId
        ]
      )

      // Eliminar supuestos autores anteriores
      await client.query('DELETE FROM supuestos_autores WHERE denuncia_id = $1', [borradorId])

      // Crear supuesto autor si hay datos
      if (autor.conocido === 'Conocido' && autor.nombre) {
        await client.query(
          `INSERT INTO supuestos_autores (
            denuncia_id, autor_conocido, nombre_autor, cedula_autor, domicilio_autor,
            nacionalidad_autor, estado_civil_autor, edad_autor, fecha_nacimiento_autor,
            lugar_nacimiento_autor, telefono_autor, profesion_autor,
            telefonos_involucrados, numero_cuenta_beneficiaria,
            nombre_cuenta_beneficiaria, entidad_bancaria
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            borradorId,
            autor.conocido,
            autor.nombre,
            autor.cedula || null,
            autor.domicilio || null,
            autor.nacionalidad || null,
            autor.estadoCivil || null,
            autor.edad ? parseInt(autor.edad) : null,
            autor.fechaNacimiento || null,
            autor.lugarNacimiento || null,
            autor.telefono || null,
            autor.profesion || null,
            null,
            null,
            null,
            null
          ]
        )
      }

      // Insertar información adicional
      if (infoAdicional && Array.isArray(infoAdicional) && infoAdicional.length > 0) {
        for (const info of infoAdicional) {
          await client.query(
            `INSERT INTO supuestos_autores (
              denuncia_id, autor_conocido,
              telefonos_involucrados, numero_cuenta_beneficiaria,
              nombre_cuenta_beneficiaria, entidad_bancaria
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              borradorId,
              'Desconocido',
              info.telefonosInvolucrados || null,
              info.numeroCuenta || null,
              info.nombreCuenta || null,
              info.entidadBancaria || null
            ]
          )
        }
      }

      // Insertar en historial
      await client.query(
        `INSERT INTO historial_denuncias (
          nombre_denunciante, cedula_denunciante, operador,
          fecha_denuncia, hora_denuncia, numero_orden, tipo_hecho, hash_denuncia
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          denunciante.nombres,
          numeroDoc,
          `${usuario.grado} ${usuario.nombre} ${usuario.apellido}`,
          fechaActual,
          horaActual,
          numeroOrden,
          denuncia.tipoDenuncia,
          hash
        ]
      )

      await client.query('COMMIT')

      return NextResponse.json({
        success: true,
        id: borradorId,
        hash: hash,
        orden: numeroOrden
      })
    }

    // Generar fecha y hora en el servidor (no confiar en el cliente)
    const now = new Date()
    const fechaActual = now.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Asuncion'
    }).split('/').reverse().join('-')
    const horaActual = now.toLocaleTimeString('es-PY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Asuncion'
    })

    // 1. Buscar o crear denunciante (usar numeroDocumento si existe, sino cedula)
    const numeroDoc = denunciante.numeroDocumento || denunciante.cedula
    let denuncianteResult = await client.query(
      'SELECT id FROM denunciantes WHERE cedula = $1',
      [numeroDoc]
    )

    let denuncianteId: number
    if (denuncianteResult.rows.length > 0) {
      denuncianteId = denuncianteResult.rows[0].id
    } else {
      const insertDenunciante = await client.query(
        `INSERT INTO denunciantes (
          nombres, cedula, tipo_documento, nacionalidad, estado_civil, edad,
          fecha_nacimiento, lugar_nacimiento, telefono, profesion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`,
        [
          denunciante.nombres,
          numeroDoc,
          denunciante.tipoDocumento,
          denunciante.nacionalidad,
          denunciante.estadoCivil,
          parseInt(denunciante.edad),
          denunciante.fechaNacimiento,
          denunciante.lugarNacimiento,
          denunciante.telefono,
          denunciante.profesion || null
        ]
      )
      denuncianteId = insertDenunciante.rows[0].id
    }

    // 2. Obtener número de orden usando fecha del servidor
    const año = fechaActual.split('-')[0]
    const ordenResult = await client.query(
      `SELECT COALESCE(MAX(orden), 0) + 1 as orden
       FROM denuncias
       WHERE EXTRACT(YEAR FROM fecha_denuncia) = $1`,
      [año]
    )
    const numeroOrden = ordenResult.rows[0].orden

    // 3. Obtener datos del usuario
    const usuarioResult = await client.query(
      'SELECT nombre, apellido, grado, oficina FROM usuarios WHERE id = $1',
      [usuarioId]
    )

    if (usuarioResult.rows.length === 0) {
      throw new Error('Usuario no encontrado')
    }

    const usuario = usuarioResult.rows[0]
    const hash = generarHash(usuario.oficina)

    // 4. Crear denuncia (sin PDF - se generará bajo demanda)
    const insertDenuncia = await client.query(
      `INSERT INTO denuncias (
        denunciante_id, fecha_denuncia, hora_denuncia, fecha_hecho, hora_hecho,
        tipo_denuncia, otro_tipo, relato, lugar_hecho, latitud, longitud,
        orden, usuario_id, oficina, operador_grado, operador_nombre,
        operador_apellido, monto_dano, moneda, hash, pdf, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NULL, 'completada')
      RETURNING id`,
      [
        denuncianteId,
        fechaActual, // Fecha del servidor
        horaActual, // Hora del servidor
        denuncia.fechaHecho,
        denuncia.horaHecho,
        denuncia.tipoDenuncia,
        denuncia.otroTipo,
        denuncia.relato,
        denuncia.lugarHecho,
        denuncia.latitud,
        denuncia.longitud,
        numeroOrden,
        usuarioId,
        usuario.oficina,
        usuario.grado,
        usuario.nombre,
        usuario.apellido,
        denuncia.montoDano,
        denuncia.moneda,
        hash
      ]
    )

    const denunciaId = insertDenuncia.rows[0].id

    // 5. Crear supuesto autor si hay datos del autor conocido
    if (autor.conocido === 'Conocido' && autor.nombre) {
      await client.query(
        `INSERT INTO supuestos_autores (
          denuncia_id, autor_conocido, nombre_autor, cedula_autor, domicilio_autor,
          nacionalidad_autor, estado_civil_autor, edad_autor, fecha_nacimiento_autor,
          lugar_nacimiento_autor, telefono_autor, profesion_autor,
          telefonos_involucrados, numero_cuenta_beneficiaria,
          nombre_cuenta_beneficiaria, entidad_bancaria
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          denunciaId,
          autor.conocido,
          autor.nombre,
          autor.cedula || null,
          autor.domicilio || null,
          autor.nacionalidad || null,
          autor.estadoCivil || null,
          autor.edad ? parseInt(autor.edad) : null,
          autor.fechaNacimiento || null,
          autor.lugarNacimiento || null,
          autor.telefono || null,
          autor.profesion || null,
          null,
          null,
          null,
          null
        ]
      )
    }

    // 6. Insertar información adicional si existe
    if (infoAdicional && Array.isArray(infoAdicional) && infoAdicional.length > 0) {
      for (const info of infoAdicional) {
        await client.query(
          `INSERT INTO supuestos_autores (
            denuncia_id, autor_conocido,
            telefonos_involucrados, numero_cuenta_beneficiaria,
            nombre_cuenta_beneficiaria, entidad_bancaria
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            denunciaId,
            'Desconocido',
            info.telefonosInvolucrados || null,
            info.numeroCuenta || null,
            info.nombreCuenta || null,
            info.entidadBancaria || null
          ]
        )
      }
    }

    // 7. Insertar en historial
    await client.query(
      `INSERT INTO historial_denuncias (
        nombre_denunciante, cedula_denunciante, operador,
        fecha_denuncia, hora_denuncia, numero_orden, tipo_hecho, hash_denuncia
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        denunciante.nombres,
        numeroDoc,
        `${usuario.grado} ${usuario.nombre} ${usuario.apellido}`,
        fechaActual,
        horaActual,
        numeroOrden,
        denuncia.tipoDenuncia,
        hash
      ]
    )

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      id: denunciaId,
      hash: hash,
      orden: numeroOrden
    })

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error creando denuncia:', error)
    return NextResponse.json(
      { error: 'Error al crear la denuncia', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
