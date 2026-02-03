import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 20,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        marginBottom: 15,
    },
    logoIzquierda: {
        width: 80,
        height: 60,
    },
    logoDerecha: {
        width: 180,
        height: 60,
    },
    logoCentral: {
        width: 50,
        height: 50,
    },
    titleSection: {
        textAlign: 'center',
        marginTop: 5,
    },
    mainTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 2,
        textAlign: 'center',
    },
    subTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    infoText: {
        fontSize: 8,
        marginBottom: 1,
        textAlign: 'center',
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

const ParaguayHeader: React.FC<ParaguayHeaderProps> = ({ numeroActa, año }) => {
    // Usar URLs absolutas para que funcionen en Vercel
    const baseUrl = 'https://denuncias-cyberpol.vercel.app';

    return (
        <View style={styles.headerContainer}>
            {/* Fila de Logos: Izquierda (Policía), Centro (DCHEF), Derecha (Gobierno) */}
            <View style={styles.topRow}>
                <Image style={styles.logoIzquierda} src={`${baseUrl}/policianacional.png`} />
                <Image style={styles.logoCentral} src={`${baseUrl}/dchef.png`} />
                <Image style={styles.logoDerecha} src={`${baseUrl}/gobiernonacional.jpg`} />
            </View>

            {/* Bloque de Texto Informativo */}
            <View style={styles.titleSection}>
                <Text style={styles.mainTitle}>DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS</Text>
                <Text style={styles.subTitle}>SALA DE DENUNCIAS</Text>
                <Text style={styles.infoText}>
                    <Text style={{ fontWeight: 'bold' }}>Dirección:</Text> E. V. Haedo 725 casi O'Leary
                </Text>
                <Text style={styles.infoText}>
                    <Text style={{ fontWeight: 'bold' }}>Teléfono:</Text> (021) 443-159 Fax: (021) 443-126 (021) 441-111
                </Text>
                <Text style={styles.infoText}>
                    <Text style={{ fontWeight: 'bold' }}>E-mail:</Text> ayudantia@delitoseconomicos.gov.py
                </Text>
            </View>

            {/* Línea Divisoria y Número de Acta */}
            <View style={styles.divider} />
            <Text style={styles.documentId}>ACTA DE DENUNCIA N° {numeroActa}/{año}</Text>
        </View>
    );
};

export default ParaguayHeader;
