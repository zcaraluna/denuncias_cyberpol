import * as React from 'react'
import { Document, Page, StyleSheet } from '@react-pdf/renderer'
import { EncabezadoPdf } from './EncabezadoPdf'
import { DatosDenuncia, Denunciante } from '../../utils/pdf'

const styles = StyleSheet.create({
    page: {
        paddingTop: 20,
        paddingBottom: 40,
        backgroundColor: '#ffffff',
    },
})

export interface DocumentoDenunciaPdfProps {
    numeroOrden: number
    año: string
    datosDenuncia: DatosDenuncia
    oficinaDatos: any
    logos: {
        policia: string
        dchef: string
        gobierno: string
    }
}

export const DocumentoDenunciaPdf = ({
    numeroOrden,
    año,
    datosDenuncia,
    oficinaDatos,
    logos,
}: DocumentoDenunciaPdfProps) => {
    const pageSize = datosDenuncia.tipo_papel === 'a4' ? 'A4' : ([612.28, 935.43] as [number, number])

    const titulo = `ACTA DE DENUNCIA Nº ${numeroOrden === 0 ? '#' : numeroOrden}/${año}`

    return (
        <Document title={titulo}>
            <Page size={pageSize} style={styles.page}>
                <EncabezadoPdf
                    titulo={titulo}
                    oficina={datosDenuncia.oficina}
                    oficinaDatos={oficinaDatos}
                    logos={logos}
                />
            </Page>
        </Document>
    )
}
