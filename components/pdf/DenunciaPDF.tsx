import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import ParaguayHeader from './ParaguayHeader';
import { generarPrimerParrafo } from './PrimerParrafo';

const styles = StyleSheet.create({
    page: {
        paddingTop: 15,  // Margen superior mínimo
        paddingBottom: 72,  // 2.54cm
        paddingHorizontal: 72,  // 2.54cm laterales
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    legalNotice: {
        fontSize: 8,
        fontStyle: 'italic',
        marginBottom: 8,
        textAlign: 'justify',
        lineHeight: 1.4,
    },
    paragraph: {
        fontSize: 10,
        textAlign: 'justify',
        lineHeight: 1.5,
        marginBottom: 6,
    },
});

interface DenunciaData {
    orden: number;
    fecha_denuncia: any;
    hora_denuncia: string;
    operador_grado?: string;
    operador_nombre?: string;
    operador_apellido?: string;
    nombres_denunciante: string;
    cedula: string;
    tipo_documento?: string;
    nacionalidad: string;
    estado_civil: string;
    edad: number;
    fecha_nacimiento: string;
    lugar_nacimiento: string;
    domicilio?: string;
    profesion?: string;
    telefono: string;
    denunciantes_involucrados?: any[];
    [key: string]: any;
}

interface DenunciaPDFProps {
    denuncia: DenunciaData;
    pageSize?: any;
}

// Componente que retorna Document completo - Tamaño Oficio (8.5 x 13 inches = 612 x 936 points)
const DenunciaPDFDocument: React.FC<DenunciaPDFProps> = ({ denuncia, pageSize = [612, 936] }) => {
    // CRÍTICO: Función helper para convertir CUALQUIER valor a string seguro
    const toSafeString = (value: any): string => {
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toISOString().split('T')[0];
        return String(value);
    };

    // CRÍTICO: Manejar fecha_denuncia como Date o string
    const getYear = (fecha: any): number => {
        if (!fecha) return new Date().getFullYear();
        if (fecha instanceof Date) return fecha.getFullYear();
        if (typeof fecha === 'string') {
            const parts = fecha.split('-');
            if (parts.length === 3) return parseInt(parts[0], 10);
        }
        return new Date().getFullYear();
    };

    const año = getYear(denuncia.fecha_denuncia);

    return (
        <Document>
            <Page size={[612, 936]} style={styles.page}>
                <ParaguayHeader numeroActa={denuncia.orden.toString()} año={año} />

                {/* Aviso Legal */}
                <Text style={styles.legalNotice}>
                    LA PRESENTE ACTA SE REALIZA CONFORME A LOS SIGUIENTES: ARTÍCULO 284. "DENUNCIA", ARTÍCULO 285. "FORMA Y CONTENIDO", ARTÍCULO 289. "DENUNCIA ANTE LA POLICÍA" DE LA LEY 1286/98 "CODIGO PROCESAL PENAL".
                </Text>

                {/* Primer Párrafo - NUEVO SISTEMA MULTI-PARTE */}
                {generarPrimerParrafo(denuncia, styles)}
            </Page>
        </Document>
    );
};

export default DenunciaPDFDocument;
