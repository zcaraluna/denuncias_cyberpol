import { Text, View, Image, StyleSheet } from '@react-pdf/renderer'

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
    logos: {
        policia: string
        dchef: string
        gobierno: string
    }
}

export const EncabezadoPdf = ({ titulo, oficina, oficinaDatos, logos }: EncabezadoPdfProps) => {
    return (
        <View style={styles.headerContainer} fixed>
            <View style={styles.logosContainer}>
                <Image src={logos.policia} style={styles.logoIzq} />
                <Image src={logos.dchef} style={styles.logoCentro} />
                <Image src={logos.gobierno} style={styles.logoDer} />
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.mainTitle}>
                    DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS
                </Text>
                <Text style={styles.subTitle}>SALA DE DENUNCIAS</Text>
                <Text style={styles.infoText}>Dirección: {String(oficinaDatos.direccion || '')}</Text>
                <Text style={styles.infoText}>
                    Teléfono: {String(oficinaDatos.telefono || '')}   Fax: {String(oficinaDatos.fax || '')}
                </Text>
                <Text style={styles.infoText}>E-mail: {String(oficinaDatos.email || '')}</Text>
            </View>

            <View style={styles.separator} />
            <Text style={styles.actaTitle}>{String(titulo || '')}</Text>
        </View>
    )
}
