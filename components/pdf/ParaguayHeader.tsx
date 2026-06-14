import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { getOfficeHeaderConfig } from '@/lib/data/oficinas';

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 5,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        marginBottom: 5,
    },
    leftSection: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    centerSection: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightSection: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    logoIzquierda: {
        width: 100,
        height: 40,
    },
    logoDerecha: {
        width: 120,
        height: 60,
    },
    logoCentral: {
        width: 65,
        height: 65,
    },
    titleSection: {
        textAlign: 'center',
        marginTop: 5,
        width: '100%',
        alignItems: 'center',
    },
    mainTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 2,
        textAlign: 'center',
        width: '100%',
    },
    infoWrapper: {
        position: 'relative',
        width: '100%',
        alignItems: 'center',
        marginTop: 4,
        paddingBottom: 8,
    },
    infoBlock: {
        alignItems: 'center',
        width: '100%',
        paddingLeft: 65,
        paddingRight: 65,
    },
    subTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        width: '100%',
    },
    infoText: {
        fontSize: 10,
        marginBottom: 1,
        textAlign: 'center',
        width: '100%',
    },
    qrHeaderContainer: {
        position: 'absolute',
        right: 0,
        top: -4,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 55,
    },
    qrHeaderImage: {
        width: 55,
        height: 55,
    },
    qrHeaderText: {
        fontSize: 5,
        color: '#666',
        marginTop: 2,
        fontFamily: 'Helvetica',
        textAlign: 'center',
        width: '100%',
    },
    divider: {
        borderBottomWidth: 1.5,
        borderBottomColor: '#000',
        width: '100%',
        marginTop: 6,
        marginBottom: 6,
    },
    documentId: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'Helvetica',
    }
});

interface ParaguayHeaderProps {
    numeroActa: string;
    año: number;
    oficina?: string;
    esAmpliacion?: boolean;
    numeroAmpliacion?: number;
    logos?: {
        policia?: string;
        dchef?: string;
        gobierno?: string;
    };
    qrCodeUrl?: string;
    hash?: string;
}

const ParaguayHeader: React.FC<ParaguayHeaderProps> = ({
    numeroActa,
    año,
    oficina,
    esAmpliacion,
    numeroAmpliacion,
    logos,
    qrCodeUrl,
    hash
}) => {
    const header = getOfficeHeaderConfig(oficina || 'Asunción');

    return (
        <View style={styles.headerContainer}>
            {/* Fila de Logos: Izquierda (Policía), Centro (DCHEF), Derecha (Gobierno) */}
            <View style={styles.topRow}>
                <View style={styles.leftSection}>
                    {logos?.policia && <Image style={styles.logoIzquierda} src={logos.policia} />}
                </View>
                <View style={styles.centerSection}>
                    {logos?.dchef && <Image style={styles.logoCentral} src={logos.dchef} />}
                </View>
                <View style={styles.rightSection}>
                    {logos?.gobierno && <Image style={styles.logoDerecha} src={logos.gobierno} />}
                </View>
            </View>

            {/* Bloque de Texto Informativo */}
            <View style={styles.titleSection}>
                <Text style={styles.mainTitle}>DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS</Text>
                
                <View style={styles.infoWrapper}>
                    <View style={styles.infoBlock}>
                        <Text style={styles.subTitle}>{header.sala}</Text>
                        <Text style={styles.infoText}>
                            <Text style={{ fontWeight: 'bold' }}>Dirección:</Text> {header.direccion}
                        </Text>
                        {header.telefono ? (
                            <Text style={styles.infoText}>
                                <Text style={{ fontWeight: 'bold' }}>Teléfono:</Text> {header.telefono}
                            </Text>
                        ) : null}
                        {header.email ? (
                            <Text style={styles.infoText}>
                                <Text style={{ fontWeight: 'bold' }}>E-mail:</Text> {header.email}
                            </Text>
                        ) : null}
                    </View>
                    {qrCodeUrl && (
                        <View style={styles.qrHeaderContainer}>
                            <Image style={styles.qrHeaderImage} src={qrCodeUrl} />
                            <Text style={styles.qrHeaderText}>{hash}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Línea Divisoria y Número de Acta */}
            <View style={styles.divider} />
            <Text style={styles.documentId}>
                {esAmpliacion
                    ? `AMPLIACIÓN ${numeroAmpliacion} DEL ACTA DE DENUNCIA N° ${numeroActa}/${año}`
                    : `ACTA DE DENUNCIA N° ${numeroActa}/${año}`}
            </Text>
        </View>
    );
};

export default ParaguayHeader;
