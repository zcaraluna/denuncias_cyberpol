import React from 'react';
import { Text, View } from '@react-pdf/renderer';

interface CierreDenunciaProps {
    totalPersonas: number;
    styles: any;
}

export const CierreDenuncia: React.FC<CierreDenunciaProps> = ({ totalPersonas, styles }) => {
    const isPlural = totalPersonas > 1;
    const firmaText = isPlural ? ' LOS DENUNCIANTES ' : ' EL DENUNCIANTE ';
    const informeText = isPlural ? ' LAS PERSONAS RECURRENTES SON INFORMADAS ' : ' LA PERSONA RECURRENTE ES INFORMADA ';

    return (
        <View style={{ marginTop: 0 }}>
            <Text style={styles.paragraph}>
                NO HABIENDO NADA MÁS QUE AGREGAR SE DA POR TERMINADA EL ACTA,
                PREVIA LECTURA Y RATIFICACIÓN DE SU CONTENIDO, FIRMANDO AL PIE
                {firmaText}
                Y EL INTERVINIENTE, EN 3 (TRES) COPIAS DEL MISMO
                TENOR Y EFECTO. {informeText}
                SOBRE: ARTÍCULO 289.- "DENUNCIA FALSA"; ARTÍCULO 242.- "TESTIMONIO FALSO";
                ARTÍCULO 243.- "DECLARACIÓN FALSA".
            </Text>
        </View>
    );
};
