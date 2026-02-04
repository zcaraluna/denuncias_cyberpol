import React from 'react';
import { Text, View } from '@react-pdf/renderer';

interface TercerParrafoProps {
    relato: string;
    esDenunciaEscrita?: boolean;
    styles: any;
}

export const TercerParrafo: React.FC<TercerParrafoProps> = ({ relato, esDenunciaEscrita, styles }) => {
    if (esDenunciaEscrita) {
        return (
            <View>
                <Text style={styles.paragraph}>
                    Que por la presente se recepciona denuncia escrita para su remisión al Ministerio Público y/o Autoridades Competentes, cuyo documento original digitalizado se adjunta incorporado a la presente acta.
                </Text>
            </View>
        );
    }

    if (!relato) return null;

    return (
        <View>
            <Text style={styles.paragraph}>
                Según los acontecimientos que se mencionan a continuación:
            </Text>
            <Text style={[styles.paragraph, { fontStyle: 'italic' }]}>
                {relato}
            </Text>
        </View>
    );
};
