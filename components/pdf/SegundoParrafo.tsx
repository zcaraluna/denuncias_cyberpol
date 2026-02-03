import React from 'react';
import { Text } from '@react-pdf/renderer';
import { obtenerCapitulo } from '@/lib/data/hechos-punibles';

interface DenunciaData {
    tipo_denuncia: string;
    fecha_hecho: string;
    hora_hecho: string;
    usar_rango?: boolean;
    fecha_hecho_fin?: string;
    hora_hecho_fin?: string;
    lugar_hecho: string;
    lugar_hecho_no_aplica?: boolean;
    supuestos_autores?: any[];
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

const formatDescripcionFisica = (descRaw: any): string => {
    if (!descRaw) return '';
    let desc: any;
    try {
        desc = typeof descRaw === 'string' ? JSON.parse(descRaw) : descRaw;
    } catch (e) {
        return String(descRaw);
    }

    if (typeof desc !== 'object') return String(desc);

    const partes: string[] = [];

    // Simplificado para el PDF
    if (desc.sexo) partes.push(`Sexo: ${desc.sexo}`);
    if (desc.altura) partes.push(`Altura: ${desc.altura}`);
    if (desc.complexion) partes.push(`Complexión: ${desc.complexion}`);
    if (desc.tonoPiel) partes.push(`Piel: ${desc.tonoPiel}`);
    if (desc.colorCabello) partes.push(`Cabello: ${desc.colorCabello}`);
    if (desc.colorOjos) partes.push(`Ojos: ${desc.colorOjos}`);
    if (desc.otrosRasgos && Array.isArray(desc.otrosRasgos) && desc.otrosRasgos.length > 0) {
        partes.push(`Otros rasgos: ${desc.otrosRasgos.join(', ')}`);
    } else if (desc.otrosRasgos && typeof desc.otrosRasgos === 'string') {
        partes.push(`Otros rasgos: ${desc.otrosRasgos}`);
    }

    return partes.join(', ');
};

export function generarSegundoParrafo(
    denuncia: DenunciaData,
    styles: any
): React.ReactElement {
    const tipoBase = toSafeString(denuncia.tipo_denuncia);
    const capitulo = obtenerCapitulo(tipoBase);

    let crimeType = '';
    if (capitulo) {
        crimeType = capitulo.toUpperCase();
    } else {
        crimeType = tipoBase.toUpperCase();
    }

    const dateText = denuncia.usar_rango && denuncia.fecha_hecho_fin
        ? `entre la fecha ${formatFecha(denuncia.fecha_hecho)} siendo las ${toSafeString(denuncia.hora_hecho)} aproximadamente y la fecha ${formatFecha(denuncia.fecha_hecho_fin)} siendo las ${toSafeString(denuncia.hora_hecho_fin)} aproximadamente`
        : `en fecha ${formatFecha(denuncia.fecha_hecho)} siendo las ${toSafeString(denuncia.hora_hecho)} aproximadamente`;

    const locationText = denuncia.lugar_hecho_no_aplica
        ? 'en dirección NO APLICA'
        : `en la dirección ${toSafeString(denuncia.lugar_hecho).toUpperCase()}`;

    // Lógica de Autores
    let authorText = '';
    const autores = denuncia.supuestos_autores || [];

    if (autores.length === 0 || autores.every(a => a.autor_conocido === 'No aplica')) {
        authorText = ', perpetrado presumiblemente por PERSONA/S DESCONOCIDA/S';
    } else {
        const descripciones = autores.map((autor, index) => {
            if (autor.autor_conocido === 'Conocido') {
                const nombre = toSafeString(autor.nombre_autor).toUpperCase();
                const ci = autor.cedula_autor ? `, con C.I. N° ${autor.cedula_autor}` : '';
                const dom = autor.domicilio_autor ? `, domiciliado en ${autor.domicilio_autor.toUpperCase()}` : '';
                return `el ciudadano ${nombre}${ci}${dom}`;
            } else {
                const descFisica = formatDescripcionFisica(autor.descripcion_fisica);
                const prefijo = autores.length > 1 ? `Persona ${index + 1}` : 'persona/s';
                return `${prefijo} de las siguientes características: ${descFisica || 'SIN DATOS'}`;
            }
        });

        authorText = `, perpetrado presumiblemente por ${descripciones.join('; asimismo ')}`;
    }

    return (
        <Text style={styles.paragraph}>
            Que por la presente viene a realizar una denuncia sobre un supuesto <Text style={{ fontWeight: 'bold' }}>{crimeType}</Text>, ocurrido {dateText}, {locationText}{authorText}.
        </Text>
    );
}
