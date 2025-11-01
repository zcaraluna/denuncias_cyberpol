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
    const { denunciante, denuncia, autor, infoAdicional, usuarioId, borradorId: borradorIdParam } = body
    let borradorId = borradorIdParam

    // Si existe borradorId, actualizar el borrador existente
    if (borradorId) {
      // Actualizar denunciante
      const numeroDoc = denunciante.numeroDocumento || denunciante.cedula
      const denunciaActual = await client.query(
        'SELECT denunciante_id FROM denuncias WHERE id = $1',
        [borradorId]
      )
      
      if (denunciaActual.rows.length > 0) {
        const denuncianteIdActual = denunciaActual.rows[0].denunciante_id
        
        await client.query(
          `UPDATE denunciantes SET
            nombres = $1, cedula = $2, tipo_documento = $3, nacionalidad = $4, 
            estado_civil = $5, edad = $6, fecha_nacimiento = $7, lugar_nacimiento = $8,
            telefono = $9, profesion = $10
          WHERE id = $11`,
          [
            denunciante.nombres || null,
            numeroDoc || null,
            denunciante.tipoDocumento || null,
            denunciante.nacionalidad || null,
            denunciante.estadoCivil || null,
            denunciante.edad ? parseInt(denunciante.edad) : null,
            denunciante.fechaNacimiento || null,
            denunciante.lugarNacimiento || null,
            denunciante.telefono || null,
            denunciante.profesion || null,
            denuncianteIdActual
          ]
        )

        // Actualizar denuncia
        await client.query(
          `UPDATE denuncias SET
            fecha_denuncia = $1, hora_denuncia = $2, fecha_hecho = $3, hora_hecho = $4,
            tipo_denuncia = $5, otro_tipo = $6, relato = $7, lugar_hecho = $8,
            latitud = $9, longitud = $10, monto_dano = $11, moneda = $12,
            estado = 'borrador'
          WHERE id = $13`,
          [
            denuncia.fechaDenuncia || null,
            denuncia.horaDenuncia || null,
            denuncia.fechaHecho || null,
            denuncia.horaHecho || null,
            denuncia.tipoDenuncia || null,
            denuncia.otroTipo || null,
            denuncia.relato || null,
            denuncia.lugarHecho || null,
            denuncia.latitud || null,
            denuncia.longitud || null,
            denuncia.montoDano || null,
            denuncia.moneda || null,
            borradorId
          ]
        )

        // Eliminar supuestos autores anteriores
        await client.query('DELETE FROM supuestos_autores WHERE denuncia_id = $1', [borradorId])
      }
    } else {
      // 1. Buscar o crear denunciante
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
            denunciante.nombres || null,
            numeroDoc || null,
            denunciante.tipoDocumento || null,
            denunciante.nacionalidad || null,
            denunciante.estadoCivil || null,
            denunciante.edad ? parseInt(denunciante.edad) : null,
            denunciante.fechaNacimiento || null,
            denunciante.lugarNacimiento || null,
            denunciante.telefono || null,
            denunciante.profesion || null
          ]
        )
        denuncianteId = insertDenunciante.rows[0].id
      }

      // 2. Obtener datos del usuario
      const usuarioResult = await client.query(
        'SELECT nombre, apellido, grado, oficina FROM usuarios WHERE id = $1',
        [usuarioId]
      )

      if (usuarioResult.rows.length === 0) {
        throw new Error('Usuario no encontrado')
      }

      const usuario = usuarioResult.rows[0]
      const hash = generarHash(usuario.oficina)

      // 3. Obtener el siguiente número de orden para borradores
      const ordenBorradorResult = await client.query(
        `SELECT COALESCE(MIN(orden), 0) - 1 as orden
         FROM denuncias
         WHERE estado = 'borrador'`
      )
      const numeroOrdenBorrador = ordenBorradorResult.rows[0].orden

      // 4. Crear borrador
      const insertDenuncia = await client.query(
        `INSERT INTO denuncias (
          denunciante_id, fecha_denuncia, hora_denuncia, fecha_hecho, hora_hecho,
          tipo_denuncia, otro_tipo, relato, lugar_hecho, latitud, longitud,
          orden, usuario_id, oficina, operador_grado, operador_nombre,
          operador_apellido, monto_dano, moneda, hash, pdf, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NULL, 'borrador')
        RETURNING id`,
        [
          denuncianteId,
          denuncia.fechaDenuncia || null,
          denuncia.horaDenuncia || null,
          denuncia.fechaHecho || null,
          denuncia.horaHecho || null,
          denuncia.tipoDenuncia || null,
          denuncia.otroTipo || null,
          denuncia.relato || null,
          denuncia.lugarHecho || null,
          denuncia.latitud || null,
          denuncia.longitud || null,
          numeroOrdenBorrador,
          usuarioId,
          usuario.oficina,
          usuario.grado,
          usuario.nombre,
          usuario.apellido,
          denuncia.montoDano || null,
          denuncia.moneda || null,
          hash
        ]
      )

      borradorId = insertDenuncia.rows[0].id
    }

    // 4. Agregar supuestos autores si existen
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

    // 5. Insertar información adicional si existe
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

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      id: borradorId,
      estado: 'borrador'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error guardando borrador:', error)
    return NextResponse.json(
      { error: 'Error al guardar borrador' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

