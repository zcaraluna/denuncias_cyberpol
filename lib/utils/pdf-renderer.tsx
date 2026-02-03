import * as React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { DocumentoDenunciaPdf } from '../components/pdf/DocumentoDenunciaPdf'
import { DatosDenuncia, Denunciante } from './pdf'

export async function renderDenunciaPdf(
    numeroOrden: number,
    denunciante: Denunciante,
    datosDenuncia: DatosDenuncia
): Promise<Buffer> {
    const año = datosDenuncia.fecha_denuncia.split('-')[0]
    const titulo = `ACTA DE DENUNCIA Nº ${numeroOrden || '#'}/${año}`

    try {
        return await renderToBuffer(
            <DocumentoDenunciaPdf titulo={String(titulo)} />
        )
    } catch (error: any) {
        console.error("Critical error in renderToBuffer:", error)
        throw error
    }
}
