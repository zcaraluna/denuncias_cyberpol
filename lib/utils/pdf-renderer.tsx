import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { DocumentoDenunciaPdf } from '../components/pdf/DocumentoDenunciaPdf'
import { DatosDenuncia, Denunciante } from './pdf'
import QRCode from 'qrcode'

// Esta oficina de datos es la misma que está en pdf.ts
const datosOficinas: any = {
    "Asunción": {
        direccion: "E. V. Haedo 725 casi O'Leary",
        telefono: '(021) 443-159',
        fax: '(021) 443-126 (021) 441-111',
        email: 'ayudantia@delitoseconomicos.gov.py',
    },
    // ... se pueden agregar más
}

const formatDate = (dateStr: string | Date | null): string => {
    if (!dateStr) return ''
    let dateString: string
    if (dateStr instanceof Date) {
        const año = dateStr.getUTCFullYear()
        const mes = String(dateStr.getUTCMonth() + 1).padStart(2, '0')
        const dia = String(dateStr.getUTCDate()).padStart(2, '0')
        dateString = `${año}-${mes}-${dia}`
    } else {
        dateString = String(dateStr)
    }
    try {
        const [año, mes, dia] = dateString.split('-')
        return `${dia}/${mes}/${año}`
    } catch {
        return dateString
    }
}

export async function renderDenunciaPdf(
    numeroOrden: number,
    denunciante: Denunciante,
    datosDenuncia: DatosDenuncia
): Promise<Buffer> {
    const año = datosDenuncia.fecha_denuncia.split('-')[0]
    const oficina = datosDenuncia.oficina || 'Asunción'
    const oficinaDatos = datosOficinas[oficina] || datosOficinas["Asunción"]

    // --- Lógica de fragmentos para Introducción ---
    const fragmentsIntro: any[] = []
    const fechaDenuncia = formatDate(datosDenuncia.fecha_denuncia)
    const fechaNacimiento = formatDate(denunciante['Fecha de Nacimiento'])
    const involucrados = (datosDenuncia.involucrados || []).filter(inv => inv.rol !== 'principal')
    const coDenunciantes = involucrados.filter(inv => inv.rol === 'co-denunciante')
    const abogados = involucrados.filter(inv => inv.rol === 'abogado')
    const abogadoConCartaPoder = abogados.find(abogado => Boolean(abogado.conCartaPoder) === true)

    fragmentsIntro.push({ texto: 'En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ' })
    fragmentsIntro.push({ texto: (datosDenuncia.oficina || '').toUpperCase(), bold: true })
    fragmentsIntro.push({ texto: `, en fecha ` })
    fragmentsIntro.push({ texto: fechaDenuncia, bold: true })
    fragmentsIntro.push({ texto: ` siendo las ` })
    fragmentsIntro.push({ texto: (datosDenuncia.hora_denuncia || '').toUpperCase(), bold: true })
    fragmentsIntro.push({ texto: `, ante mí ` })
    fragmentsIntro.push({ texto: `${(datosDenuncia.grado_operador || '').toUpperCase()} ${(datosDenuncia.nombre_operador || '').toUpperCase()}`, bold: true })
    fragmentsIntro.push({ texto: `, concurre ` })

    if (abogadoConCartaPoder) {
        // Caso Abogado con Carta Poder
        fragmentsIntro.push({ texto: abogadoConCartaPoder.nombres.toUpperCase(), bold: true })
        if (abogadoConCartaPoder.numeroDocumento) {
            fragmentsIntro.push({ texto: `, con ` })
            fragmentsIntro.push({ texto: abogadoConCartaPoder.numeroDocumento, bold: true })
        }
        fragmentsIntro.push({ texto: `, Matrícula Profesional Nº ` })
        fragmentsIntro.push({ texto: abogadoConCartaPoder.matricula || 'N/A', bold: true })
        fragmentsIntro.push({ texto: `, en representación de ` })
        fragmentsIntro.push({ texto: (denunciante['Nombres y Apellidos'] || '').toUpperCase(), bold: true })
    } else {
        // Caso Denunciante Principal
        fragmentsIntro.push({ texto: (denunciante['Nombres y Apellidos'] || '').toUpperCase(), bold: true })
    }

    fragmentsIntro.push({ texto: `, con número de documento ` })
    fragmentsIntro.push({ texto: (denunciante['Número de Documento'] || denunciante['Cédula de Identidad'] || '').toUpperCase(), bold: true })
    fragmentsIntro.push({ texto: `, de nacionalidad ` })
    fragmentsIntro.push({ texto: (denunciante['Nacionalidad'] || '').toUpperCase(), bold: true })
    fragmentsIntro.push({ texto: `, estado civil ` })
    fragmentsIntro.push({ texto: (denunciante['Estado Civil'] || '').toUpperCase(), bold: true })
    fragmentsIntro.push({ texto: `, ` })
    fragmentsIntro.push({ texto: (denunciante['Edad'] || '').toUpperCase(), bold: true })
    fragmentsIntro.push({ texto: ` años de edad, fecha de nacimiento ` })
    fragmentsIntro.push({ texto: fechaNacimiento, bold: true })
    fragmentsIntro.push({ texto: `, en ` })
    fragmentsIntro.push({ texto: (denunciante['Lugar de Nacimiento'] || '').toUpperCase(), bold: true })
    fragmentsIntro.push({ texto: `, domiciliado en ` })
    fragmentsIntro.push({ texto: (denunciante['Domicilio'] || '').toUpperCase(), bold: true })

    if (denunciante['Número de Teléfono']) {
        fragmentsIntro.push({ texto: `, número de teléfono ` })
        fragmentsIntro.push({ texto: denunciante['Número de Teléfono'].toUpperCase(), bold: true })
    }

    if (denunciante['Profesión']) {
        fragmentsIntro.push({ texto: `, de profesión ` })
        fragmentsIntro.push({ texto: denunciante['Profesión'].toUpperCase(), bold: true })
    }

    if (coDenunciantes.length > 0) {
        fragmentsIntro.push({ texto: coDenunciantes.length > 1 ? ', acompañados por ' : ', acompañado por ' })
        coDenunciantes.forEach((co, idx) => {
            fragmentsIntro.push({ texto: co.nombres.toUpperCase(), bold: true })
            if (idx < coDenunciantes.length - 1) fragmentsIntro.push({ texto: ', ' })
        })
    }

    fragmentsIntro.push({ texto: ', y expone cuanto sigue:' })

    // --- Lógica de fragmentos para Hecho ---
    const fragmentsHecho: any[] = []
    const tipoDenunciaUpper = (datosDenuncia.tipo_denuncia || '').toUpperCase()
    const fechaHecho = formatDate(datosDenuncia.fecha_hecho)

    fragmentsHecho.push({ texto: 'Que por la presente viene a realizar una denuncia sobre un supuesto hecho de ' })
    fragmentsHecho.push({ texto: tipoDenunciaUpper, bold: true })

    if (tipoDenunciaUpper === 'OTRO' && datosDenuncia.otro_tipo) {
        fragmentsHecho.push({ texto: ` (${(datosDenuncia.otro_tipo || '').toUpperCase()})`, bold: true })
    }

    fragmentsHecho.push({ texto: `, ocurrido en fecha ` })
    fragmentsHecho.push({ texto: fechaHecho, bold: true })
    fragmentsHecho.push({ texto: ` siendo las ` })
    fragmentsHecho.push({ texto: (datosDenuncia.hora_hecho || '').toUpperCase(), bold: true })
    fragmentsHecho.push({ texto: ` aproximadamente, en la dirección ` })
    fragmentsHecho.push({ texto: (datosDenuncia.lugar_hecho || '').toUpperCase(), bold: true })

    if (datosDenuncia.nombre_autor) {
        fragmentsHecho.push({ texto: `, sindicando como supuesto autor a ` })
        fragmentsHecho.push({ texto: datosDenuncia.nombre_autor.toUpperCase(), bold: true })
        // Otros detalles del autor simplificados para el ejemplo
    } else {
        fragmentsHecho.push({ texto: `, siendo el supuesto autor una persona ` })
        fragmentsHecho.push({ texto: 'DESCONOCIDA', bold: true })
        fragmentsHecho.push({ texto: ' por la persona denunciante.' })
    }

    // --- Relato con cierre ---
    const relatoCompleto = `${datosDenuncia.relato}\n\nNO HABIENDO NADA MÁS QUE AGREGAR SE DA POR TERMINADA EL ACTA, PREVIA LECTURA Y RATIFICACIÓN DE SU CONTENIDO, FIRMANDO AL PIE EL DENUNCIANTE Y EL INTERVINIENTE, EN 3 (TRES) COPIAS DEL MISMO TENOR Y EFECTO. LA PERSONA RECURRENTE ES INFORMADA SOBRE: ARTÍCULO 289.- "DENUNCIA FALSA"; ARTÍCULO 242.- "TESTIMONIO FALSO"; ARTÍCULO 243.- "DECLARACIÓN FALSA".`

    // --- QR ---
    const URL_BASE_VERIFICACION = process.env.NEXT_PUBLIC_URL_BASE || 'https://denuncias.cyberpol.com.py'
    const urlVerificacion = `${URL_BASE_VERIFICACION}/verificar/${datosDenuncia.hash}`
    const qrDataUrl = await QRCode.toDataURL(urlVerificacion, {
        width: 100,
        margin: 1,
    })

    // --- Firmas Data ---
    let nombreOperador = datosDenuncia.nombre_operador
    let gradoOperador = datosDenuncia.grado_operador
    let etiquetaOperador = 'INTERVINIENTE'

    if (datosDenuncia.es_operador_autorizado && datosDenuncia.operador_autorizado) {
        nombreOperador = datosDenuncia.operador_autorizado.nombre
        gradoOperador = datosDenuncia.operador_autorizado.grado
        etiquetaOperador = 'OPERADOR AUTORIZADO'
    }

    const operadorFirma = {
        nombre: nombreOperador,
        grado: gradoOperador,
        etiqueta: etiquetaOperador
    }

    const denuncianteFirma = {
        nombre: denunciante['Nombres y Apellidos'],
        documento: `DOC.: ${denunciante['Número de Documento'] || denunciante['Cédula de Identidad']}`,
        etiqueta: 'DENUNCIANTE'
    }

    return await renderToBuffer(
        <DocumentoDenunciaPdf
            numeroOrden={numeroOrden}
            año={año}
            denunciante={denunciante}
            datosDenuncia={datosDenuncia}
            oficinaDatos={oficinaDatos}
            parrafoIntroduccion={fragmentsIntro}
            parrafoHecho={fragmentsHecho}
            relatoCompleto={relatoCompleto}
            qrDataUrl={qrDataUrl}
            operadorFirma={operadorFirma}
            denuncianteFirma={denuncianteFirma}
        />
    )
}
