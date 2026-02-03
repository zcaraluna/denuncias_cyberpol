import * as React from 'react'
import { Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
    signaturesContainer: {
        marginTop: 20,
        paddingHorizontal: 30,
        width: '100%',
    },
    firmasWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
    },
    col: {
        width: '35%',
        alignItems: 'center',
    },
    colCentro: {
        width: '30%',
        alignItems: 'center',
    },
    linea: {
        borderTopWidth: 0.5,
        borderTopColor: '#000',
        width: '100%',
        marginBottom: 5,
    },
    nombreText: {
        fontSize: 10,
        fontFamily: 'Helvetica',
        textAlign: 'center',
    },
    etiquetaBold: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginTop: 2,
    },
    qrImage: {
        width: 60,
        height: 60,
        marginBottom: 5,
    },
    hashText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
    },
})

interface FirmasPdfProps {
    operador: {
        nombre: string
        grado: string
        etiqueta: string
    }
    denunciante: {
        nombre: string
        documento: string
        etiqueta: string
    }
    qrDataUrl: string
    hash: string
}

export const FirmasPdf = ({ operador, denunciante, qrDataUrl, hash }: FirmasPdfProps) => {
    return (
        <View style={styles.signaturesContainer} wrap={false}>
            <View style={styles.firmasWrapper}>
                {/* Columna Izquierda: Operador */}
                <View style={styles.col}>
                    <View style={styles.linea} />
                    <Text style={styles.nombreText}>{String(operador.nombre || '').toUpperCase()}</Text>
                    <Text style={styles.nombreText}>{String(operador.grado || '').toUpperCase()}</Text>
                    <Text style={styles.etiquetaBold}>{String(operador.etiqueta || '')}</Text>
                </View>

                {/* Columna Centro: QR y Hash */}
                <View style={styles.colCentro}>
                    {qrDataUrl && <Image src={qrDataUrl} style={styles.qrImage} />}
                    <Text style={styles.hashText}>{String(hash || '')}</Text>
                </View>

                {/* Columna Derecha: Denunciante */}
                <View style={styles.col}>
                    <View style={styles.linea} />
                    <Text style={styles.nombreText}>{String(denunciante.nombre || '').toUpperCase()}</Text>
                    <Text style={styles.nombreText}>{String(denunciante.documento || '').toUpperCase()}</Text>
                    <Text style={styles.etiquetaBold}>{String(denunciante.etiqueta || '')}</Text>
                </View>
            </View>
        </View>
    )
}
