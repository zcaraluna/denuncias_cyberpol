import React from 'react'
import { Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
    avisoContainer: {
        paddingHorizontal: 30,
        marginTop: 5,
        marginBottom: 10,
    },
    avisoBox: {
        borderWidth: 1,
        borderColor: '#000',
        padding: 5,
    },
    avisoText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Oblique',
        textAlign: 'justify',
    },
})

export const AvisoLegalPdf = () => {
    return (
        <View style={styles.avisoContainer}>
            <View style={styles.avisoBox}>
                <Text style={styles.avisoText}>
                    LA PRESENTE ACTA SE REALIZA CONFORME A LOS SIGUIENTES: ARTÍCULO 284.{' '}
                    "DENUNCIA", ARTÍCULO 285. "FORMA Y CONTENIDO", ARTÍCULO 289.{' '}
                    "DENUNCIA ANTE LA POLICÍA" DE LA LEY 1286/98 "CODIGO PROCESAL PENAL".
                </Text>
            </View>
        </View>
    )
}
