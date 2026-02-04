import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { randomBytes } from 'crypto'

type RolDenunciante = 'principal' | 'co-denunciante' | 'abogado'

interface DenuncianteDatos {
  nombres: string | null
  tipoDocumento: string | null
  numeroDocumento: string | null
  nacionalidad: string | null
  estadoCivil: string | null
  edad: string | null
  fechaNacimiento: string | null
  lugarNacimiento: string | null
  domicilio: string | null
  telefono: string | null
  correo: string | null
  profesion: string | null
  matricula: string | null
}

interface DenuncianteEntrada {
  id: string
  rol: RolDenunciante
  representaA: string | null
  representaDocumento?: string | null
  conCartaPoder?: boolean
  cartaPoderFecha?: string | null
  cartaPoderNumero?: string | null
  cartaPoderNotario?: string | null
  datos: DenuncianteDatos
}

const ROLES_VALIDOS: RolDenunciante[] = ['principal', 'co-denunciante', 'abogado']

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

const normalizarTexto = (valor: any, opciones: { upper?: boolean; fallback?: string | null } = {}) => {
  if (valor === undefined || valor === null) return opciones.fallback ?? null
  const texto = String(valor).trim()
  if (!texto) return opciones.fallback ?? null
  return opciones.upper ? texto.toUpperCase() : texto
}

const normalizarDocumento = (valor: any) => (normalizarTexto(valor, { fallback: null }) ?? null)

async function upsertDenunciante(client: any, datos: DenuncianteDatos) {
  const numeroDocumento = normalizarDocumento(datos.numeroDocumento)
  const nombres = normalizarTexto(datos.nombres, { upper: true, fallback: '' })
  const tipoDocumento = normalizarTexto(datos.tipoDocumento)
  const nacionalidad = normalizarTexto(datos.nacionalidad, { upper: true })
  const estadoCivil = normalizarTexto(datos.estadoCivil, { upper: true })
  const fechaNacimiento = normalizarTexto(datos.fechaNacimiento)
  const lugarNacimiento = normalizarTexto(datos.lugarNacimiento, { upper: true })
  const domicilio = normalizarTexto(datos.domicilio)
  const telefono = normalizarTexto(datos.telefono)
  const correo = normalizarTexto(datos.correo, { fallback: null })
  const profesion = normalizarTexto(datos.profesion, { upper: true })
  const matricula = normalizarTexto(datos.matricula, { upper: true })
  const edad = datos.edad ? parseInt(datos.edad, 10) : null

  const aplicarUpdate = async (denuncianteId: number) => {
    await client.query(
      `UPDATE denunciantes SET
          nombres = $1,
          tipo_documento = $2,
          nacionalidad = $3,
          estado_civil = $4,
          edad = $5,
          fecha_nacimiento = $6,
          lugar_nacimiento = $7,
          domicilio = $8,
          telefono = $9,
          correo = $10,
          profesion = $11,
          matricula = $12
        WHERE id = $13`,
      [
        nombres,
        tipoDocumento,
        nacionalidad,
        estadoCivil,
        edad,
        fechaNacimiento,
        lugarNacimiento,
        domicilio,
        telefono,
        correo,
        profesion,
        matricula,
        denuncianteId
      ]
    )
    return denuncianteId
  }

  if (numeroDocumento) {
    const existente = await client.query('SELECT id FROM denunciantes WHERE cedula = $1', [numeroDocumento])
    if (existente.rows.length > 0) {
      return aplicarUpdate(existente.rows[0].id)
    }
  }

  if (matricula) {
    const existenteMatricula = await client.query('SELECT id FROM denunciantes WHERE matricula = $1', [matricula])
    if (existenteMatricula.rows.length > 0) {
      return aplicarUpdate(existenteMatricula.rows[0].id)
    }
  }

  const resultado = await client.query(
    `INSERT INTO denunciantes (
      nombres, cedula, tipo_documento, nacionalidad, estado_civil, edad,
      fecha_nacimiento, lugar_nacimiento, domicilio, telefono, correo, profesion, matricula
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id`,
    [
      nombres,
      numeroDocumento,
      tipoDocumento,
      nacionalidad,
      estadoCivil,
      datos.edad ? parseInt(datos.edad, 10) : null,
      fechaNacimiento,
      lugarNacimiento,
      domicilio,
      telefono,
      correo,
      profesion,
      matricula
    ]
  )
  return resultado.rows[0].id
}

function construirColeccionDenunciantes(body: any): DenuncianteEntrada[] {
  if (Array.isArray(body?.denunciantes) && body.denunciantes.length > 0) {
    return body.denunciantes
      .map((item: any) => ({
        id: item.id ?? normalizarTexto(item.datos?.numeroDocumento) ?? `tmp-${Math.random().toString(36).slice(2, 10)}`,
        rol: ROLES_VALIDOS.includes(item.rol) ? item.rol : 'co-denunciante',
        representaA: item.representaA ?? null,
        representaDocumento: item.representaDocumento ?? null,
        conCartaPoder: item.conCartaPoder ?? false,
        cartaPoderFecha: item.cartaPoderFecha ?? null,
        cartaPoderNotario: item.cartaPoderNotario ?? null,
        datos: {
          ...(item.datos ?? {}),
          matricula: item.datos?.matricula ?? item.matricula ?? null,
        }
      }))
  }

  if (body?.denunciante) {
    return [
      {
        id: normalizarTexto(body.denunciante.numeroDocumento) ?? 'principal',
        rol: 'principal',
        representaA: null,
        datos: {
          ...body.denunciante,
          matricula: body.denunciante.matricula ?? null,
        }
      }
    ]
  }

  throw new Error('Debe proporcionar al menos un denunciante.')
}

async function registrarInvolucrados(
  client: any,
  denunciaId: number,
  coleccion: DenuncianteEntrada[],
  mapaIds: Map<string, number>
) {
  await client.query('DELETE FROM denuncias_involucrados WHERE denuncia_id = $1', [denunciaId])

  for (const entrada of coleccion) {
    const denuncianteId = mapaIds.get(entrada.id)
    if (!denuncianteId) continue

    let representaId: number | null = null
    if (entrada.rol === 'abogado') {
      if (entrada.representaA && mapaIds.has(entrada.representaA)) {
        representaId = mapaIds.get(entrada.representaA) ?? null
      } else if (entrada.representaDocumento) {
        const representado = await client.query('SELECT id FROM denunciantes WHERE cedula = $1', [
          normalizarDocumento(entrada.representaDocumento)
        ])
        if (representado.rows.length > 0) {
          representaId = representado.rows[0].id
        }
      }
    }

    await client.query(
      `INSERT INTO denuncias_involucrados (
        denuncia_id,
        denunciante_id,
        rol,
        representa_denunciante_id,
        con_carta_poder,
        carta_poder_fecha,
        carta_poder_numero,
        carta_poder_notario
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        denunciaId,
        denuncianteId,
        entrada.rol,
        representaId,
        Boolean(entrada.conCartaPoder),
        entrada.cartaPoderFecha || null,
        null, // carta_poder_numero ya no se usa
        entrada.cartaPoderNotario || null,
      ]
    )
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const body = await request.json()
    const { denuncia, autor, descripcionFisica, usuarioId } = body
    let { borradorId: borradorIdParam } = body

    if (!usuarioId) {
      throw new Error('Usuario requerido.')
    }

    const coleccionDenunciantes = construirColeccionDenunciantes(body)
    const principalEntrada = coleccionDenunciantes.find((item) => item.rol === 'principal')
    if (!principalEntrada) {
      throw new Error('Debe incluir un denunciante principal.')
    }

    const usuarioResult = await client.query(
      'SELECT nombre, apellido, grado, oficina FROM usuarios WHERE id = $1',
      [usuarioId]
    )

    if (usuarioResult.rows.length === 0) {
      throw new Error('Usuario no encontrado')
    }

    const usuario = usuarioResult.rows[0]
    const mapaDenunciantes = new Map<string, number>()

    for (const entrada of coleccionDenunciantes) {
      const id = await upsertDenunciante(client, entrada.datos)
      mapaDenunciantes.set(entrada.id, id)
    }

    const principalId = mapaDenunciantes.get(principalEntrada.id)
    if (!principalId) {
      throw new Error('No se pudo determinar el denunciante principal.')
    }

    const lugarHechoNoAplica = denuncia?.lugarHechoNoAplica ?? false
    const esDenunciaEscrita = denuncia?.esDenunciaEscrita ?? false
    const archivoDenunciaUrl = denuncia?.archivoDenunciaUrl ?? null
    const adjuntosUrls = denuncia?.adjuntosUrls || []
    const montoDano = denuncia?.montoDano ?? null
    const moneda = denuncia?.moneda ?? null
    const usarRango = Boolean(denuncia?.usarRango)

    if (borradorIdParam) {
      await client.query(
        `UPDATE denuncias SET
          denunciante_id = $1,
          fecha_denuncia = $2,
          hora_denuncia = $3,
          fecha_hecho = $4,
          hora_hecho = $5,
          fecha_hecho_fin = $6,
          hora_hecho_fin = $7,
          tipo_denuncia = $8,
          otro_tipo = $9,
          relato = $10,
          lugar_hecho = $11,
          latitud = $12,
          longitud = $13,
          monto_dano = $14,
          moneda = $15,
          estado = 'borrador',
          operador_grado = $16,
          operador_nombre = $17,
          operador_apellido = $18,
          lugar_hecho_no_aplica = $19,
          es_denuncia_escrita = $20,
          archivo_denuncia_url = $21,
          adjuntos_urls = $22,
          usar_rango = $23
        WHERE id = $24`,
        [
          principalId,
          denuncia?.fechaDenuncia ?? null,
          denuncia?.horaDenuncia ?? null,
          denuncia?.fechaHecho ?? null,
          denuncia?.horaHecho ?? null,
          denuncia?.fechaHechoFin ?? null,
          denuncia?.horaHechoFin ?? null,
          denuncia?.tipoDenuncia ?? null,
          denuncia?.otroTipo ?? null,
          denuncia?.relato ?? null,
          denuncia?.lugarHecho ?? null,
          denuncia?.latitud ?? null,
          denuncia?.longitud ?? null,
          montoDano,
          moneda,
          usuario.grado,
          usuario.nombre,
          usuario.apellido,
          lugarHechoNoAplica,
          esDenunciaEscrita,
          archivoDenunciaUrl,
          adjuntosUrls,
          usarRango,
          borradorIdParam
        ]
      )
    } else {
      const hash = generarHash(usuario.oficina)
      const ordenBorradorResult = await client.query(
        `SELECT COALESCE(MIN(orden), 0) - 1 as orden
         FROM denuncias
         WHERE estado = 'borrador'`
      )
      const numeroOrdenBorrador = ordenBorradorResult.rows[0].orden

      const insertDenuncia = await client.query(
        `INSERT INTO denuncias (
          denunciante_id, fecha_denuncia, hora_denuncia, fecha_hecho, hora_hecho, fecha_hecho_fin, hora_hecho_fin,
          tipo_denuncia, otro_tipo, relato, lugar_hecho, latitud, longitud,
          orden, usuario_id, oficina, operador_grado, operador_nombre,
          operador_apellido, monto_dano, moneda, hash, pdf, estado,
          lugar_hecho_no_aplica, es_denuncia_escrita, archivo_denuncia_url, adjuntos_urls, usar_rango
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NULL, 'borrador', $23, $24, $25, $26, $27)
        RETURNING id`,
        [
          principalId,
          denuncia?.fechaDenuncia ?? null,
          denuncia?.horaDenuncia ?? null,
          denuncia?.fechaHecho ?? null,
          denuncia?.horaHecho ?? null,
          denuncia?.fechaHechoFin ?? null,
          denuncia?.horaHechoFin ?? null,
          denuncia?.tipoDenuncia ?? null,
          denuncia?.otroTipo ?? null,
          denuncia?.relato ?? null,
          denuncia?.lugarHecho ?? null,
          denuncia?.latitud ?? null,
          denuncia?.longitud ?? null,
          numeroOrdenBorrador,
          usuarioId,
          usuario.oficina,
          usuario.grado,
          usuario.nombre,
          usuario.apellido,
          montoDano,
          moneda,
          hash,
          lugarHechoNoAplica,
          esDenunciaEscrita,
          archivoDenunciaUrl,
          adjuntosUrls,
          usarRango
        ]
      )

      borradorIdParam = insertDenuncia.rows[0].id
    }

    await registrarInvolucrados(client, borradorIdParam, coleccionDenunciantes, mapaDenunciantes)

    await client.query('DELETE FROM supuestos_autores WHERE denuncia_id = $1', [borradorIdParam])

    if (autor?.conocido === 'Conocido' && autor?.nombre) {
      await client.query(
        `INSERT INTO supuestos_autores (
          denuncia_id, autor_conocido, nombre_autor, cedula_autor, domicilio_autor,
          nacionalidad_autor, estado_civil_autor, edad_autor, fecha_nacimiento_autor,
          lugar_nacimiento_autor, telefono_autor, profesion_autor,
          telefonos_involucrados, numero_cuenta_beneficiaria,
          nombre_cuenta_beneficiaria, entidad_bancaria
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          borradorIdParam,
          'Conocido',
          normalizarTexto(autor.nombre, { upper: true }),
          normalizarDocumento(autor.cedula),
          normalizarTexto(autor.domicilio, { upper: true }),
          normalizarTexto(autor.nacionalidad, { upper: true }),
          normalizarTexto(autor.estadoCivil, { upper: true }),
          autor.edad ? parseInt(autor.edad, 10) : null,
          autor.fechaNacimiento ?? null,
          normalizarTexto(autor.lugarNacimiento, { upper: true }),
          normalizarTexto(autor.telefono),
          normalizarTexto(autor.profesion, { upper: true }),
          null,
          null,
          null,
          null
        ]
      )
    }

    // Guardar siempre si es Desconocido, con descripcionFisica opcional
    if (autor.conocido === 'Desconocido') {
      await client.query(
        `INSERT INTO supuestos_autores (
          denuncia_id, autor_conocido, descripcion_fisica
        ) VALUES ($1, $2, $3)`,
        [
          borradorIdParam,
          'Desconocido',
          (descripcionFisica && descripcionFisica.trim() !== '') ? normalizarTexto(descripcionFisica) : null
        ]
      )
    }

    await client.query('COMMIT')
    return NextResponse.json({ borradorId: borradorIdParam })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error al crear borrador:', error)
    return NextResponse.json({ error: 'Error al crear borrador' }, { status: 500 })
  } finally {
    client.release()
  }
}