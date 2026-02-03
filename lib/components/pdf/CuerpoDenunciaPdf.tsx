import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { DatosDenuncia, Denunciante } from '../../utils/pdf'

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 30,
        fontSize: 12,
        fontFamily: 'Helvetica',
        lineHeight: 1.5,
    },
    paragraph: {
        marginBottom: 10,
        textAlign: 'justify',
    },
    bold: {
        fontFamily: 'Helvetica-Bold',
    },
    italic: {
        fontFamily: 'Helvetica-Oblique',
    },
})

interface CuerpoDenunciaPdfProps {
    denunciante: Denunciante
    datosDenuncia: DatosDenuncia
    parrafoIntroduccion: any[] // Array de fragmentos { texto: string, bold?: boolean }
    parrafoHecho: any[]
    relato: string
}

export const CuerpoDenunciaPdf = ({
    denunciante,
    datosDenuncia,
    parrafoIntroduccion,
    parrafoHecho,
    relato
}: CuerpoDenunciaPdfProps) => {
    return (
        <View style={styles.container}>
            {/* Párrafo Introductorio */}
            <Text style={styles.paragraph}>
                {parrafoIntroduccion.map((f, i) => (
                    <Text key={i} style={f.bold ? styles.bold : {}}>{f.texto}</Text>
                ))}
            </Text>

            {/* Párrafo del Hecho */}
            <Text style={styles.paragraph}>
                {parrafoHecho.map((f, i) => (
                    <Text key={i} style={f.bold ? styles.bold : {}}>{f.texto}</Text>
                ))}
            </Text>

            {/* Título de Relato */}
            <Text style={[styles.paragraph, { marginTop: 5 }]}>
                De acuerdo a los hechos que se describen a continuación:
            </Text>

            {/* Relato */}
            <Text style={[styles.paragraph, styles.italic]}>
                {relato}
            </Text>
        </View>
    )
}
