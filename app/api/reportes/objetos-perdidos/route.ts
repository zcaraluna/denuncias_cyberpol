import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.toLowerCase().trim() || ''
    const tipo = searchParams.get('tipo') || ''
    const fechaInicio = searchParams.get('fechaInicio') || ''
    const fechaFin = searchParams.get('fechaFin') || ''

    const dbQuery = `
      SELECT 
        d.id,
        d.orden as numero_denuncia,
        EXTRACT(YEAR FROM d.fecha_denuncia)::integer as año,
        d.fecha_denuncia,
        d.hora_denuncia,
        den.nombres as denunciante,
        den.cedula as denunciante_cedula,
        TRIM(
          COALESCE(d.operador_grado, '') || ' ' || 
          COALESCE(SPLIT_PART(TRIM(d.operador_nombre), ' ', 1), '') || ' ' || 
          COALESCE(SPLIT_PART(TRIM(d.operador_apellido), ' ', 1), '')
        ) as interviniente,
        d.oficina,
        d.objetos_extraviados
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.tipo_denuncia = 'EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS'
        AND d.estado = 'completada'
        AND d.objetos_extraviados IS NOT NULL
      ORDER BY d.fecha_denuncia DESC, d.hora_denuncia DESC;
    `
    const result = await pool.query(dbQuery)
    
    const todosObjetos: any[] = []
    const rawDenuncias = result.rows

    for (const d of rawDenuncias) {
      let objetosList: any[] = []
      try {
        objetosList = typeof d.objetos_extraviados === 'string'
          ? JSON.parse(d.objetos_extraviados)
          : d.objetos_extraviados
      } catch (e) {
        console.error('Error parseando objetos_extraviados en API reportes:', e)
        continue
      }

      if (!Array.isArray(objetosList)) continue

      // Formato fecha: YYYY-MM-DD
      let fechaDenunciaStr = ''
      if (d.fecha_denuncia) {
        const dateObj = new Date(d.fecha_denuncia)
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const day = String(dateObj.getDate()).padStart(2, '0')
        fechaDenunciaStr = `${year}-${month}-${day}`
      }

      for (const obj of objetosList) {
        const flatObj = {
          denuncia_id: d.id,
          numero_denuncia: d.numero_denuncia,
          año: d.año,
          fecha_denuncia: d.fecha_denuncia,
          hora_denuncia: d.hora_denuncia,
          denunciante: d.denunciante,
          denunciante_cedula: d.denunciante_cedula,
          interviniente: d.interviniente,
          oficina: d.oficina,
          objeto: obj
        }

        // Filtro de Tipo
        if (tipo && obj.tipo !== tipo) continue

        // Filtro de Fechas
        if (fechaInicio && fechaDenunciaStr < fechaInicio) continue
        if (fechaFin && fechaDenunciaStr > fechaFin) continue

        // Filtro de Texto
        if (query) {
          const matchingFields = [
            obj.tipo_label || '',
            obj.numero || '',
            obj.nacionalidad || '',
            obj.banco || '',
            obj.otroBanco || '',
            obj.marca || '',
            obj.modelo || '',
            obj.ultimos4 || '',
            obj.descripcion || '',
            obj.partes || '',
            obj.cuenta || '',
            obj.beneficiario || '',
            obj.caracteristicas || '',
            obj.chasis || '',
            obj.nombreTercero || '',
            obj.documentoTercero || '',
            d.denunciante || '',
            d.denunciante_cedula || '',
            d.numero_denuncia?.toString() || ''
          ].map(f => String(f).toLowerCase())

          const matches = matchingFields.some(field => field.includes(query))
          if (!matches) continue
        }

        todosObjetos.push(flatObj)
      }
    }

    const porTipoMap: Record<string, { label: string; cantidad: number }> = {}
    const porDenuncianteMap: Record<string, { nombre: string; cedula: string; cantidad: number }> = {}
    const porBancoMap: Record<string, number> = {}
    const porOrigenChapaMap: Record<string, number> = { Nacional: 0, Mercosur: 0 }
    const porPaisChapaMap: Record<string, number> = {}

    for (const item of todosObjetos) {
      const obj = item.objeto
      
      const tipoKey = obj.tipo || 'otro'
      const labelVal = obj.tipo_label || 'Otros Objetos'
      if (!porTipoMap[tipoKey]) {
        porTipoMap[tipoKey] = { label: labelVal, cantidad: 0 }
      }
      porTipoMap[tipoKey].cantidad++

      const denKey = item.denunciante_cedula || item.denunciante
      if (denKey) {
        if (!porDenuncianteMap[denKey]) {
          porDenuncianteMap[denKey] = {
            nombre: item.denunciante,
            cedula: item.denunciante_cedula,
            cantidad: 0
          }
        }
        porDenuncianteMap[denKey].cantidad++
      }

      if (['cheque', 'tarjeta_debito', 'tarjeta_credito'].includes(obj.tipo)) {
        const banco = (obj.banco === 'OTRO' ? obj.otroBanco : obj.banco) || 'NO ESPECIFICADO'
        porBancoMap[banco] = (porBancoMap[banco] || 0) + 1
      }

      if (obj.tipo === 'chapa_vehiculo') {
        const origen = obj.origenChapa === 'mercosur' ? 'Mercosur' : 'Nacional'
        porOrigenChapaMap[origen] = (porOrigenChapaMap[origen] || 0) + 1
        if (obj.origenChapa === 'mercosur' && obj.paisMercosur) {
          const pais = obj.paisMercosur
          porPaisChapaMap[pais] = (porPaisChapaMap[pais] || 0) + 1
        }
      }
    }

    const statsPorTipo = Object.values(porTipoMap).sort((a, b) => b.cantidad - a.cantidad)
    const statsPorDenunciante = Object.values(porDenuncianteMap)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10)

    const statsPorBanco = Object.entries(porBancoMap)
      .map(([banco, cantidad]) => ({ banco, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10)

    const statsChapas = {
      por_origen: Object.entries(porOrigenChapaMap).map(([origen, cantidad]) => ({ origen, cantidad })),
      por_pais: Object.entries(porPaisChapaMap).map(([pais, cantidad]) => ({ pais, cantidad })).sort((a, b) => b.cantidad - a.cantidad)
    }

    return NextResponse.json({
      objetos: todosObjetos,
      stats: {
        por_tipo: statsPorTipo,
        por_denunciante: statsPorDenunciante,
        por_banco: statsPorBanco,
        chapas: statsChapas
      }
    })

  } catch (error) {
    console.error('Error en buscador de objetos perdidos:', error)
    return NextResponse.json(
      { error: 'Error al obtener buscador de objetos perdidos', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
