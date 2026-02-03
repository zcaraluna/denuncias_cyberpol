import * as React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 12,
    },
    header: {
        marginBottom: 20,
        fontWeight: 'bold',
        fontSize: 16,
    }
})

export const DocumentoDenunciaPdf = ({ titulo }: { titulo: string }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View>
                <Text style={styles.header}>DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS</Text>
                <Text>SALA DE DENUNCIAS</Text>
                <Text>{titulo}</Text>
            </View>
        </Page>
    </Document>
)
