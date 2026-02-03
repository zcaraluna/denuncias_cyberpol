import * as React from 'react'
import { Document, Page, StyleSheet, Font } from '@react-pdf/renderer'
import { EncabezadoPdf } from './EncabezadoPdf'
import { AvisoLegalPdf } from './AvisoLegalPdf'
import { CuerpoDenunciaPdf } from './CuerpoDenunciaPdf'
import { FirmasPdf } from './FirmasPdf'
import { DatosDenuncia, Denunciante } from '../../utils/pdf'

const styles = StyleSheet.create({
    page: {
        paddingTop: 20,
        paddingBottom: 40,
        backgroundColor: '#ffffff',
    },
})

operadorFirma: any
denuncianteFirma: any
logos: {
    policia: string
    dchef: string
    gobierno: string
}
}

qrDataUrl,
    operadorFirma,
    denuncianteFirma,
    logos,
}: DocumentoDenunciaPdfProps) => {
    const pageSize = datosDenuncia.tipo_papel === 'a4' ? 'A4' : ([612.28, 935.43] as [number, number]) // Oficio aproximado en pt (216x330mm)

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

                <AvisoLegalPdf />

                <CuerpoDenunciaPdf
                    denunciante={denunciante}
                    datosDenuncia={datosDenuncia}
                    parrafoIntroduccion={parrafoIntroduccion}
                    parrafoHecho={parrafoHecho}
                    relato={relatoCompleto}
                />

                <FirmasPdf
                    operador={operadorFirma}
                    denunciante={denuncianteFirma}
                    qrDataUrl={qrDataUrl}
                    hash={datosDenuncia.hash}
                />
            </Page>
        </Document>
    )
}
