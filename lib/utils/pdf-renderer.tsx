import * as React from 'react'
import { Document, Page, Text, renderToBuffer, StyleSheet } from '@react-pdf/renderer'
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
        // Renderizado ATÓMICO: Sin componentes externos para evitar Error #31
        // relacionado con la reconciliación de tipos en Next.js App Router
        return await renderToBuffer(
            React.createElement(Document, { title: titulo },
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
        )
    } catch (error: any) {
        console.error("Critical error in atomic renderToBuffer:", error)
        throw error
    }
}
