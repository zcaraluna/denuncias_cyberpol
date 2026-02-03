import { Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import path from 'path'
import fs from 'fs'

const styles = StyleSheet.create({
    headerContainer: {
        paddingTop: 10,
        paddingBottom: 5,
        marginBottom: 7,
        alignItems: 'center',
    },
    logosContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 12,
        marginBottom: 5,
    },
    logoIzq: {
        width: 35,
        height: 15,
    },
    logoCentro: {
        width: 25,
        height: 25,
    },
    logoDer: {
        width: 40,
        height: 20,
    },
    titleContainer: {
        alignItems: 'center',
        marginTop: 5,
    },
    mainTitle: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
    },
    subTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginTop: 2,
    },
    infoText: {
        fontSize: 10,
        fontFamily: 'Helvetica',
        textAlign: 'center',
        marginTop: 2,
    },
    separator: {
        borderBottomWidth: 0.5,
        borderBottomColor: '#000',
        width: '80%',
        marginVertical: 10,
    },
    actaTitle: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginTop: 10,
    }
})

interface EncabezadoPdfProps {
    titulo: string
    oficina: string
    oficinaDatos: {
        direccion: string
        telefono: string
        fax: string
        email: string
    }
}

// Para entorno de servidor, necesitamos los paths absolutos de las imágenes
const getImagePath = (name: string) => path.join(process.cwd(), name)

export const EncabezadoPdf = ({ titulo, oficina, oficinaDatos }: EncabezadoPdfProps) => {
    return (
        <View style={styles.headerContainer} fixed>
            <View style={styles.logosContainer}>
                <Image src={getImagePath('policianacional.png')} style={styles.logoIzq} />
                <Image src={getImagePath('dchef.png')} style={styles.logoCentro} />
                <Image src={getImagePath('gobiernonacional.jpg')} style={styles.logoDer} />
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.mainTitle}>
                    DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS
                </Text>
                <Text style={styles.subTitle}>SALA DE DENUNCIAS</Text>
                <Text style={styles.infoText}>Dirección: {oficinaDatos.direccion}</Text>
                <Text style={styles.infoText}>
                    Teléfono: {oficinaDatos.telefono}   Fax: {oficinaDatos.fax}
                </Text>
                <Text style={styles.infoText}>E-mail: {oficinaDatos.email}</Text>
            </View>

            <View style={styles.separator} />
            <Text style={styles.actaTitle}>{titulo}</Text>
        </View>
    )
}
