import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import ParaguayHeader from './ParaguayHeader';

const styles = StyleSheet.create({
    page: {
        paddingTop: 15,
        paddingBottom: 20,
        paddingHorizontal: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    legalNotice: {
        fontSize: 8,
        fontStyle: 'italic',
        marginBottom: 15,
        textAlign: 'justify',
        lineHeight: 1.4,
    },
    paragraph: {
        fontSize: 10,
        textAlign: 'justify',
        lineHeight: 1.6,
        marginBottom: 10,
    },
});

interface DenunciaData {
    orden: number;
    fecha_denuncia: any;
    hora_denuncia: string;
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
    [key: string]: any;
}

interface DenunciaPDFProps {
    denuncia: DenunciaData;
    pageSize?: 'LETTER' | 'A4';
}

// Componente que retorna Document completo
const DenunciaPDFDocument: React.FC<DenunciaPDFProps> = ({ denuncia, pageSize = 'LETTER' }) => {
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
            return parseInt(parts[0], 10);
        }
        return new Date().getFullYear();
    };

    const año = getYear(denuncia.fecha_denuncia);

    // Formatear fecha para el párrafo (DD/MM/YYYY)
    const formatFecha = (fecha: any): string => {
        const fechaStr = toSafeString(fecha);
        if (!fechaStr) return '';
        const parts = fechaStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return fechaStr;
    };

    const primerParrafo = `En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ASUNCIÓN, en fecha ${formatFecha(denuncia.fecha_denuncia)} siendo las ${toSafeString(denuncia.hora_denuncia)}, ante mí SUBOFICIAL AYUDANTE ANGEL GABRIEL CARVALLO FLORENTIN, concurre ${toSafeString(denuncia.nombres_denunciante).toUpperCase()}, con ${toSafeString(denuncia.tipo_documento || 'Cédula de Identidad Paraguaya')} número ${toSafeString(denuncia.cedula)}, de nacionalidad ${toSafeString(denuncia.nacionalidad).toUpperCase()}, estado civil ${toSafeString(denuncia.estado_civil).toUpperCase()}, ${denuncia.edad} años de edad, fecha de nacimiento ${formatFecha(denuncia.fecha_nacimiento)}, en ${toSafeString(denuncia.lugar_nacimiento).toUpperCase()}, domiciliado en ${toSafeString(denuncia.domicilio).toUpperCase()}, de profesión ${toSafeString(denuncia.profesion).toUpperCase()}, teléfono ${toSafeString(denuncia.telefono)}, y expone cuanto sigue:`;

    return (
        <Document>
            <Page size={pageSize} style={styles.page}>
                <ParaguayHeader numeroActa={denuncia.orden.toString()} año={año} />

                {/* Aviso Legal */}
                <Text style={styles.legalNotice}>
                    LA PRESENTE ACTA SE REALIZA CONFORME A LOS SIGUIENTES: ARTÍCULO 284. "DENUNCIA", ARTÍCULO 285. "FORMA Y CONTENIDO", ARTÍCULO 289. "DENUNCIA ANTE LA POLICÍA" DE LA LEY 1286/98 "CODIGO PROCESAL PENAL".
                </Text>

                {/* Primer Párrafo */}
                <Text style={styles.paragraph}>
                    {primerParrafo}
                </Text>
            </Page>
        </Document>
    );
};

export default DenunciaPDFDocument;
