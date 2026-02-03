import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    header: {
        marginBottom: 20,
        textAlign: 'center',
    },
    title: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    contactInfo: {
        fontSize: 8,
        marginBottom: 1,
    },
    actaNumber: {
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 10,
    },
});

interface ParaguayHeaderProps {
    numeroActa: string;
    año: number;
}

const ParaguayHeader: React.FC<ParaguayHeaderProps> = ({ numeroActa, año }) => {
    return (
        <View style={styles.header}>
            <Text style={styles.title}>DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS</Text>
            <Text style={styles.subtitle}>SALA DE DENUNCIAS</Text>
            <Text style={styles.contactInfo}>Dirección: E. V. Haedo 725 casi O'Leary</Text>
            <Text style={styles.contactInfo}>Teléfono: (021) 443-159 Fax: (021) 443-126 (021) 441-111</Text>
            <Text style={styles.contactInfo}>E-mail: ayudantia@delitoseconomicos.gov.py</Text>
            <Text style={styles.actaNumber}>ACTA DE DENUNCIA N° {numeroActa}/{año}</Text>
        </View>
    );
};

export default ParaguayHeader;
