import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { leerSesion } from '@/lib/sesion'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    const result = await pool.query(
      `SELECT d.*, den.nombres as denunciante_nombres
       FROM denuncias d
       JOIN denunciantes den ON d.denunciante_id = den.id
       WHERE d.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Denuncia no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error obteniendo denuncia:', error)
    return NextResponse.json(
      { error: 'Error al obtener la denuncia' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usr = leerSesion(request)
    if (usr && usr.rol === 'visor') {
      return NextResponse.json(
        { error: 'Acción no autorizada para el rol de visor' },
        { status: 403 }
      )
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)
    const body = await request.json()
    const { dependencia_remitida, remitido_por } = body

    // 1. Verificar si es editable (dentro de las 24 horas)
    const result = await pool.query(
      `SELECT creado_en, oficina, (creado_en >= NOW() - INTERVAL '24 hours') as es_editable
       FROM denuncias
       WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Denuncia no encontrada' },
        { status: 404 }
      )
    }

    const { es_editable, oficina } = result.rows[0]

    if (!es_editable) {
      return NextResponse.json(
        { error: 'No se puede editar la remisión después de transcurridas 24 horas desde el registro de la denuncia.' },
        { status: 400 }
      )
    }

    // La remisión a dependencias especializadas solo aplica a la oficina de Asunción.
    // Las demás oficinas, por defecto, no remiten ninguna denuncia a ningún departamento.
    const esAsuncion = oficina && oficina.toLowerCase().trim() === 'asunción'
    if (dependencia_remitida && !esAsuncion) {
      return NextResponse.json(
        { error: 'La remisión a dependencias especializadas solo está habilitada para denuncias de la oficina de Asunción.' },
        { status: 400 }
      )
    }

    // 2. Identificar al operador actual
    let operadorNombre = remitido_por
    if (!operadorNombre) {
      const usr = leerSesion(request)
      if (usr) {
        operadorNombre = `${usr.grado || ''} ${usr.nombre || ''} ${usr.apellido || ''}`.trim()
      }
    }

    if (!operadorNombre) {
      return NextResponse.json(
        { error: 'No se pudo identificar al operador que realiza la selección.' },
        { status: 401 }
      )
    }

    // 3. Actualizar la sugerencia de remisión
    const updateResult = await pool.query(
      `UPDATE denuncias 
       SET dependencia_remitida = $1, 
           remitido_por = $2, 
           remitido_en = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [dependencia_remitida || null, operadorNombre, id]
    )

    return NextResponse.json({
      success: true,
      denuncia: updateResult.rows[0]
    })
  } catch (error) {
    console.error('Error actualizando remisión:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la sugerencia de remisión' },
      { status: 500 }
    )
  }
}

// PUT handler to allow full editing during the 10-minute grace period
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect()
  try {
    const usr = leerSesion(request)
    if (!usr) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    if (usr.rol === 'visor') {
      return NextResponse.json({ error: 'Acción no autorizada para el rol de visor' }, { status: 403 })
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)

    // 1. Obtener la denuncia actual y comprobar condiciones de gracia
    const checkRes = await client.query(
      `SELECT creado_en, estado, orden, hash, usuario_id, oficina 
       FROM denuncias 
       WHERE id = $1`,
      [id]
    )

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Denuncia no encontrada' }, { status: 404 })
    }

    const dbDenuncia = checkRes.rows[0]

    if (dbDenuncia.estado !== 'completada') {
      return NextResponse.json({ error: 'Esta ruta solo permite editar denuncias completadas.' }, { status: 400 })
    }

    // Comprobar si el usuario tiene permiso (creador o admin/superadmin/developer)
    const esCreador = dbDenuncia.usuario_id === usr.id
    const esAdmin = ['admin', 'superadmin', 'developer'].includes(usr.rol)
    if (!esCreador && !esAdmin) {
      return NextResponse.json({ error: 'No tiene permisos para editar esta denuncia.' }, { status: 403 })
    }

    // Comprobar período de gracia de 10 minutos
    const creadoEnMs = new Date(dbDenuncia.creado_en).getTime()
    const transcurrido = Date.now() - creadoEnMs
    if (transcurrido > 10 * 60 * 1000) {
      return NextResponse.json({ error: 'El período de gracia de 10 minutos para editar esta denuncia ha expirado.' }, { status: 400 })
    }

    const body = await request.json()
    const { denuncia, autor, descripcionFisica } = body

    const coleccionDenunciantes = construirColeccionDenunciantes(body)
    const principalEntrada = coleccionDenunciantes.find((item) => item.rol === 'principal')
    if (!principalEntrada) {
      return NextResponse.json({ error: 'Debe incluir un denunciante principal.' }, { status: 400 })
    }

    await client.query('BEGIN')

    // 2. Upsert denunciantes e involucrados
    const mapaDenunciantes = new Map<string, number>()
    for (const entrada of coleccionDenunciantes) {
      const dbId = await upsertDenunciante(client, entrada.datos)
      mapaDenunciantes.set(entrada.id, dbId)
    }

    const principalId = mapaDenunciantes.get(principalEntrada.id)
    if (!principalId) {
      throw new Error('No se pudo determinar el ID del denunciante principal.')
    }

    // 3. Extraer y formatear datos de la denuncia
    const relato = denuncia?.relato ?? null
    const tipoDenuncia = denuncia?.tipoDenuncia === 'Otro (Especificar)' ? 'OTRO' : (denuncia?.tipoDenuncia ?? null)
    const otroTipo = denuncia?.otroTipo ?? null
    const fechaHecho = denuncia?.fechaHecho ?? null
    const horaHecho = denuncia?.horaHecho ?? null
    const usarRango = Boolean(denuncia?.usarRango)
    const fechaHechoFin = usarRango ? (denuncia?.fechaHechoFin ?? null) : null
    const horaHechoFin = usarRango ? (denuncia?.horaHechoFin ?? null) : null
    const lugarHechoNoAplica = Boolean(denuncia?.lugarHechoNoAplica)
    // IMPORTANTE: cuando "lugar del hecho no aplica" está marcado, lugar_hecho debe
    // guardarse como '' (string vacío) y NO como null. El constraint check_completada
    // vigente en la base de datos exige lugar_hecho IS NOT NULL sin excepción (la
    // variante con "OR lugar_hecho_no_aplica = TRUE" solo existe en lib/db/schema.sql,
    // nunca se migró a producción), y normalizarTexto() convierte cualquier string
    // vacío a null, lo que hacía fallar el UPDATE con "violates check constraint
    // check_completada" en toda edición de una denuncia con este campo marcado.
    const lugarHecho = lugarHechoNoAplica ? '' : normalizarTexto(denuncia?.lugarHecho)
    const latitud = denuncia?.latitud ?? null
    const longitud = denuncia?.longitud ?? null
    const adjuntosUrls = denuncia?.adjuntosUrls ?? []
    const montoDano = denuncia?.montoDano ?? null
    const moneda = denuncia?.moneda ?? null
    const entidadBancariaVulnerada = denuncia?.entidadBancariaVulnerada ?? null
    const objetosExtraviados = denuncia?.objetosExtraviados ?? null
    const gradoEjecucion = denuncia?.gradoEjecucion ?? null

    // 4. Actualizar denuncia
    await client.query(
      `UPDATE denuncias SET
        denunciante_id = $1,
        fecha_hecho = $2::DATE,
        hora_hecho = $3,
        fecha_hecho_fin = $4::DATE,
        hora_hecho_fin = $5,
        tipo_denuncia = $6,
        otro_tipo = $7,
        relato = $8,
        lugar_hecho = $9,
        latitud = $10,
        longitud = $11,
        monto_dano = $12,
        moneda = $13,
        lugar_hecho_no_aplica = $14,
        adjuntos_urls = $15,
        usar_rango = $16,
        bancos_relacionados = $17,
        entidad_bancaria_vulnerada = $18,
        objetos_extraviados = $19,
        grado_ejecucion = $20
      WHERE id = $21`,
      [
        principalId,
        fechaHecho,
        horaHecho,
        fechaHechoFin,
        horaHechoFin,
        tipoDenuncia,
        otroTipo,
        relato,
        lugarHecho,
        latitud,
        longitud,
        montoDano,
        moneda,
        lugarHechoNoAplica,
        adjuntosUrls,
        usarRango,
        denuncia?.bancosRelacionados ? JSON.stringify(denuncia.bancosRelacionados) : null,
        entidadBancariaVulnerada,
        objetosExtraviados ? JSON.stringify(objetosExtraviados) : null,
        gradoEjecucion,
        id
      ]
    )

    // 5. Involucrados
    await registrarInvolucrados(client, id, coleccionDenunciantes, mapaDenunciantes)

    // 6. Supuestos Autores
    await client.query('DELETE FROM supuestos_autores WHERE denuncia_id = $1', [id])

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
          id,
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
    } else if (autor?.conocido === 'Desconocido') {
      await client.query(
        `INSERT INTO supuestos_autores (
          denuncia_id, autor_conocido, descripcion_fisica
        ) VALUES ($1, $2, $3)`,
        [
          id,
          'Desconocido',
          descripcionFisica ? normalizarTexto(descripcionFisica) : null
        ]
      )
    }

    // 7. Historial de Denuncias
    await client.query(
      `UPDATE historial_denuncias SET
        nombre_denunciante = $1,
        cedula_denunciante = $2,
        tipo_hecho = $3
      WHERE hash_denuncia = $4`,
      [
        principalEntrada.datos.nombres,
        normalizarDocumento(principalEntrada.datos.numeroDocumento),
        tipoDenuncia,
        dbDenuncia.hash
      ]
    )

    // 8. Log de Auditoría de Denuncias
    const detalleAudit = `Denuncia N° ${dbDenuncia.orden}/${new Date(dbDenuncia.creado_en).getFullYear()} editada por ${usr.grado || ''} ${usr.nombre || ''} ${usr.apellido || ''} (ID: ${usr.id}) durante periodo de gracia de 10 min.`
    await client.query(
      `INSERT INTO registro_auditoria_denuncias (denuncia_id, usuario_id, accion, detalle)
       VALUES ($1, $2, 'EDICION', $3)`,
      [id, usr.id, detalleAudit]
    )

    await client.query('COMMIT')
    return NextResponse.json({ success: true, id })

  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('Error editando denuncia en periodo de gracia:', error)
    return NextResponse.json({ error: 'Error al actualizar la denuncia.', details: error.message }, { status: 500 })
  } finally {
    client.release()
  }
}

// Helpers
const ROLES_VALIDOS = ['principal', 'co-denunciante', 'abogado']

const normalizarTexto = (valor: any, opciones: { upper?: boolean; fallback?: string | null } = {}) => {
  if (valor === undefined || valor === null) return opciones.fallback ?? null
  const texto = String(valor).trim()
  if (!texto) return opciones.fallback ?? null
  return opciones.upper ? texto.toUpperCase() : texto
}

const normalizarDocumento = (valor: any) => (normalizarTexto(valor, { fallback: null }) ?? null)

async function upsertDenunciante(client: any, datos: any) {
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
      edad,
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

function construirColeccionDenunciantes(body: any): any[] {
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
  coleccion: any[],
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
        null,
        entrada.cartaPoderNotario || null,
      ]
    )
  }
}


