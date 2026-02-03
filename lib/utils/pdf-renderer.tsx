import * as React from 'react'
import { Document, Page, Text, pdf, StyleSheet } from '@react-pdf/renderer'
import { DatosDenuncia, Denunciante } from './pdf'

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
    },
    mainTitle: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    subTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    actaTitle: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginTop: 20,
    }
})

export async function renderDenunciaPdf(
    numeroOrden: number,
    denunciante: Denunciante,
    datosDenuncia: DatosDenuncia
): Promise<Buffer> {
    const año = String(datosDenuncia?.fecha_denuncia || '2026').split('-')[0]
    const titulo = `ACTA DE DENUNCIA Nº ${numeroOrden || '#'}/${año}`

    try {
        console.log("Generating PDF buffer for:", titulo)

        // Usar pdf().toBuffer() en lugar de renderToBuffer()
        // Algunos entornos de Next.js App Router tienen problemas con la reconciliación
        // de renderToBuffer. pdf() crea una instancia independiente.
        const doc = React.createElement(Document, { title: titulo },
            React.createElement(Page, { size: "A4", style: styles.page },
                React.createElement(Text, { style: styles.mainTitle },
                    "DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS"
                ),
                React.createElement(Text, { style: styles.subTitle },
                    "SALA DE DENUNCIAS"
                ),
                React.createElement(Text, { style: styles.actaTitle },
                    titulo
                )
            )
        )

        const pdfStream = pdf(doc)
        const blob = await pdfStream.toBlob()
        const arrayBuffer = await blob.arrayBuffer()
        return Buffer.from(arrayBuffer)
    } catch (error: any) {
        console.error("Critical error in renderDenunciaPdf:", error)
        throw error
    }
}
