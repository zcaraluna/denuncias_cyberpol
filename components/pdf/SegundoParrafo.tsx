import React from 'react';
import { Text } from '@react-pdf/renderer';

interface DenunciaData {
    tipo_denuncia: string;
    otro_tipo?: string;
    fecha_hecho: string;
    hora_hecho: string;
    usar_rango?: boolean;
    fecha_hecho_fin?: string;
    hora_hecho_fin?: string;
    lugar_hecho: string;
    lugar_hecho_no_aplica?: boolean;
    [key: string]: any;
}

const toSafeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value);
};

const formatFecha = (fecha: any): string => {
    const fechaStr = toSafeString(fecha);
    if (!fechaStr) return '';
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return fechaStr;
};

export function generarSegundoParrafo(
    denuncia: DenunciaData,
    styles: any
): React.ReactElement {
    let crimeType = toSafeString(denuncia.tipo_denuncia).toUpperCase();
    if (crimeType === 'OTRO' || crimeType === 'OTRO (ESPECIFICAR)') {
        crimeType = toSafeString(denuncia.otro_tipo).toUpperCase();
    }

    const dateText = denuncia.usar_rango && denuncia.fecha_hecho_fin
        ? `entre la fecha ${formatFecha(denuncia.fecha_hecho)} siendo las ${toSafeString(denuncia.hora_hecho)} aproximadamente y la fecha ${formatFecha(denuncia.fecha_hecho_fin)} siendo las ${toSafeString(denuncia.hora_hecho_fin)} aproximadamente`
        : `en fecha ${formatFecha(denuncia.fecha_hecho)} siendo las ${toSafeString(denuncia.hora_hecho)} aproximadamente`;

    const locationText = denuncia.lugar_hecho_no_aplica
        ? 'en dirección NO APLICA'
        : `en la dirección ${toSafeString(denuncia.lugar_hecho).toUpperCase()}`;

    return (
        <Text style={styles.paragraph}>
            Que por la presente viene a realizar una denuncia sobre un supuesto <Text style={{ fontWeight: 'bold' }}>HECHO PUNIBLE CONTRA {crimeType}</Text>, ocurrido {dateText}, {locationText}.
        </Text>
    );
}
