import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    signatureContainer: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    column: {
        flexDirection: 'column',
        alignItems: 'center',
        width: '30%',
    },
    qrColumn: {
        flexDirection: 'column',
        alignItems: 'center',
        width: '40%',
        marginTop: -15,
    },
    line: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        width: '100%',
        marginBottom: 5,
    },
    nameText: {
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    labelHistory: {
        fontSize: 8,
        textAlign: 'center',
        marginTop: 2,
    },
    qrImage: {
        width: 80,
        height: 80,
        marginBottom: 4,
    },
    hashText: {
        fontSize: 6,
        textAlign: 'center',
        color: '#666',
    }
});

interface SeccionFirmasProps {
    operador: {
        nombre: string;
        apellido: string;
        grado: string;
    };
    denunciante: {
        nombres: string;
        cedula: string;
    };
    abogadoRep?: {
        nombres: string;
        matricula?: string;
    };
    hash: string;
    qrCodeUrl: string;
    isDuplicate?: boolean;
    operadorActual?: {
        id?: number;
        nombre: string;
        apellido: string;
        grado: string;
    };
    operadorOriginalId?: number;
}

export const SeccionFirmas: React.FC<SeccionFirmasProps> = ({
    operador,
    denunciante,
    abogadoRep,
    hash,
    qrCodeUrl,
    isDuplicate,
    operadorActual,
    operadorOriginalId
}) => {
    // Es el mismo operador que hizo la denuncia original?
    const esMismoOperador = isDuplicate && operadorActual && operadorActual.id === operadorOriginalId;

    // Definir qué datos de personal mostrar en la firma
    // Si es duplicado y es OTRA persona, mostrar esa persona
    const personal = (isDuplicate && operadorActual && !esMismoOperador) ? operadorActual : operador;

    // Si es duplicado pero es el MISMO, sigue siendo interviniente. 
    // Si es duplicado y es OTRO, es personal autorizado.
    const etiquetaCargo = (isDuplicate && !esMismoOperador) ? 'PERSONAL AUTORIZADO' : 'PERSONAL INTERVINIENTE';

    return (
        <View style={styles.signatureContainer} wrap={false}>
            {/* Columna Izquierda (Observador): Personal Interviniente o Autorizado */}
            <View style={styles.column}>
                <View style={styles.line} />
                <Text style={styles.nameText}>
                    {personal.nombre.toUpperCase()} {personal.apellido.toUpperCase()}
                </Text>
                <Text style={styles.labelHistory}>{personal.grado.toUpperCase()}</Text>
                <Text style={styles.labelHistory}>{etiquetaCargo}</Text>
            </View>

            {/* Columna Central: QR y HASH */}
            <View style={styles.qrColumn}>
                {qrCodeUrl && <Image src={qrCodeUrl} style={styles.qrImage} />}
                <Text style={styles.hashText}>{hash}</Text>
            </View>

            {/* Columna Derecha (Observador): Denunciante o Representante Legal */}
            <View style={styles.column}>
                <View style={styles.line} />
                {abogadoRep ? (
                    <>
                        <Text style={styles.nameText}>{abogadoRep.nombres.toUpperCase()}</Text>
                        <Text style={styles.labelHistory}>REPRESENTANTE LEGAL</Text>
                        <Text style={styles.labelHistory}>Matrícula Num.: {abogadoRep.matricula || '---'}</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.nameText}>{denunciante.nombres.toUpperCase()}</Text>
                        <Text style={styles.labelHistory}>DENUNCIANTE</Text>
                        <Text style={styles.labelHistory}>C.I. Num.: {denunciante.cedula}</Text>
                    </>
                )}
            </View>
        </View>
    );
};
