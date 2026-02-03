import * as React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { DocumentoDenunciaPdf } from '../components/pdf/DocumentoDenunciaPdf'
import { DatosDenuncia, Denunciante } from './pdf'
import path from 'path'

// Esta oficina de datos es la misma que está en pdf.ts
const datosOficinas: any = {
    "Asunción": {
        direccion: "E. V. Haedo 725 casi O'Leary",
        telefono: '(021) 443-159',
        fax: '(021) 443-126 (021) 441-111',
        email: 'ayudantia@delitoseconomicos.gov.py',
    },
}

export async function renderDenunciaPdf(
    numeroOrden: number,
    denunciante: Denunciante, // Se mantiene por compatibilidad de firma aunque no se use ahora
    datosDenuncia: DatosDenuncia
): Promise<Buffer> {
    const año = datosDenuncia.fecha_denuncia.split('-')[0]
    const oficina = datosDenuncia.oficina || 'Asunción'
    const oficinaDatos = datosOficinas[oficina] || datosOficinas["Asunción"]

    // --- Logos Path ---
    const getImagePath = (name: string) => path.join(process.cwd(), 'public', name)
    const logos = {
        policia: getImagePath('policianacional.png'),
        dchef: getImagePath('dchef.png'),
        gobierno: getImagePath('gobiernonacional.jpg'),
    }

    // Usamos JSX directamente ya que estamos en .tsx
    return await renderToBuffer(
        <DocumentoDenunciaPdf
            numeroOrden={numeroOrden}
            año={año}
            datosDenuncia={datosDenuncia}
            oficinaDatos={oficinaDatos}
            logos={logos}
        />
    )
}
