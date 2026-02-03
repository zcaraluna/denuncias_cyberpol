import React from 'react';
import { Text, View } from '@react-pdf/renderer';

interface CierreDenunciaProps {
    styles: any;
}

export const CierreDenuncia: React.FC<CierreDenunciaProps> = ({ styles }) => {
    return (
        <View style={{ marginTop: 20 }}>
            <Text style={styles.paragraph}>
                NO HABIENDO NADA MÁS QUE AGREGAR SE DA POR TERMINADA EL ACTA,
                PREVIA LECTURA Y RATIFICACIÓN DE SU CONTENIDO, FIRMANDO AL PIE
                EL DENUNCIANTE Y EL INTERVINIENTE, EN 3 (TRES) COPIAS DEL MISMO
                TENOR Y EFECTO. LA PERSONA RECURRENTE ES INFORMADA SOBRE:
                ARTÍCULO 289.- "DENUNCIA FALSA"; ARTÍCULO 242.- "TESTIMONIO FALSO";
                ARTÍCULO 243.- "DECLARACIÓN FALSA".
            </Text>
        </View>
    );
};
