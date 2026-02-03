import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 20,
        marginBottom: 10,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 10,
    },
    logoLateral: {
        width: 80,
        height: 80,
        objectFit: 'contain',
    },
    logoCentral: {
        width: 100,
        height: 100,
        objectFit: 'contain',
    },
    titleSection: {
        textAlign: 'center',
        marginTop: 5,
    },
    mainTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    subTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 8,
        marginBottom: 1,
    },
    divider: {
        borderBottomWidth: 1.5,
        borderBottomColor: '#000',
        width: '100%',
        marginTop: 10,
        marginBottom: 15,
    },
    documentId: {
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
    }
});

interface ParaguayHeaderProps {
    numeroActa: string;
    año: number;
}

const ParaguayHeader: React.FC<ParaguayHeaderProps> = ({ numeroActa, año }) => (
    <View style={styles.headerContainer}>
        {/* Fila de Logos: Izquierda (Gobierno), Centro (DCHEF), Derecha (Policía) */}
        <View style={styles.topRow}>
            <Image style={styles.logoLateral} src="/gobiernonacional.jpg" />
            <Image style={styles.logoCentral} src="/dchef.png" />
            <Image style={styles.logoLateral} src="/policianacional.png" />
        </View>

        {/* Bloque de Texto Informativo */}
        <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS</Text>
            <Text style={styles.subTitle}>SALA DE DENUNCIAS</Text>
            <Text style={styles.infoText}>Dirección: E. V. Haedo 725 casi O'Leary</Text>
            <Text style={styles.infoText}>Teléfono: (021) 443-159 Fax: (021) 443-126 (021) 441-111</Text>
            <Text style={styles.infoText}>E-mail: ayudantia@delitoseconomicos.gov.py</Text>
        </View>

        {/* Línea Divisoria y Número de Acta */}
        <View style={styles.divider} />
        <Text style={styles.documentId}>ACTA DE DENUNCIA N° {numeroActa}/{año}</Text>
    </View>
);

export default ParaguayHeader;
