import { DatosDenuncia, Denunciante } from './pdf'

// Importar el renderizador aislado que usa require() para evitar conflictos de React
// @ts-ignore
const { renderDenunciaPdfIsolated } = require('./pdf-renderer-isolated')

export async function renderDenunciaPdf(
    numeroOrden: number,
    denunciante: Denunciante,
    datosDenuncia: DatosDenuncia
): Promise<Buffer> {
    const año = String(datosDenuncia?.fecha_denuncia || '2026').split('-')[0]
    const titulo = `ACTA DE DENUNCIA Nº ${numeroOrden || '#'}/${año}`

    try {
        console.log("Calling isolated renderer for:", titulo)
        return await renderDenunciaPdfIsolated(titulo)
    } catch (error: any) {
        console.error("Critical error in renderDenunciaPdf wrapper:", error)
        throw error
    }
}
