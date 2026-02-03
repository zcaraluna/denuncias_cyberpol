import React from 'react';
import { Text, View } from '@react-pdf/renderer';

interface TercerParrafoProps {
    relato: string;
    styles: any;
}

export const TercerParrafo: React.FC<TercerParrafoProps> = ({ relato, styles }) => {
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
