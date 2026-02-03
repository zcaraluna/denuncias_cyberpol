import React from 'react';
import { Document, Page, StyleSheet } from '@react-pdf/renderer';
import ParaguayHeader from './ParaguayHeader';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
});

interface DenunciaData {
    orden: number;
    fecha_denuncia: any;
    [key: string]: any;
}

interface DenunciaPDFProps {
    denuncia: DenunciaData;
    pageSize?: 'LETTER' | 'A4';
}

// Componente que retorna Document completo - SOLO ENCABEZADO
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
            // Si es string, extraer año
            const parts = fecha.split('-');
            return parseInt(parts[0], 10);
        }
        return new Date().getFullYear();
    };

    const año = getYear(denuncia.fecha_denuncia);

    return (
        <Document>
            <Page size={pageSize} style={styles.page}>
                <ParaguayHeader numeroActa={denuncia.orden.toString()} año={año} />
                {/* SOLO EL ENCABEZADO - Sin datos de la denuncia */}
            </Page>
        </Document>
    );
};

export default DenunciaPDFDocument;
