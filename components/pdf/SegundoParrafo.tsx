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

    const autoresValidos = (denuncia.supuestos_autores || []).filter(a => a.autor_conocido !== 'No aplica');

    const renderTextoInicial = () => {
        if (denuncia.es_ampliacion) {
            return (
                <>
                    viene a realizar una <Text style={{ fontWeight: 'bold' }}>AMPLIACIÓN</Text> de la denuncia sobre un supuesto <Text style={{ fontWeight: 'bold' }}>{crimeType}</Text>
                </>
            );
        }
        return (
            <>
                viene a realizar una denuncia sobre un supuesto <Text style={{ fontWeight: 'bold' }}>{crimeType}</Text>
            </>
        );
    };

    const renderReferenciaOriginal = () => {
        if (denuncia.es_ampliacion && denuncia.fecha_original) {
            return (
                <Text>
                    , denunciada en <Text style={{ fontWeight: 'bold' }}>{formatFecha(denuncia.fecha_original)}</Text> {denuncia.hora_original ? `siendo las ${toSafeString(denuncia.hora_original)}` : ''}
                </Text>
            );
        }
        return null;
    };

    return (
        <Text style={styles.paragraph}>
            Que por la presente {renderTextoInicial()}, ocurrido {' '}
            {denuncia.usar_rango && denuncia.fecha_hecho_fin ? (
                <>
                    entre la fecha <Text style={{ fontWeight: 'bold' }}>{formatFecha(denuncia.fecha_hecho)}</Text> siendo las <Text style={{ fontWeight: 'bold' }}>{toSafeString(denuncia.hora_hecho)}</Text> aproximadamente y la fecha <Text style={{ fontWeight: 'bold' }}>{formatFecha(denuncia.fecha_hecho_fin)}</Text> siendo las <Text style={{ fontWeight: 'bold' }}>{toSafeString(denuncia.hora_hecho_fin)}</Text> aproximadamente
                </>
            ) : (
                <>
                    en fecha <Text style={{ fontWeight: 'bold' }}>{formatFecha(denuncia.fecha_hecho)}</Text> siendo las <Text style={{ fontWeight: 'bold' }}>{toSafeString(denuncia.hora_hecho)}</Text> aproximadamente
                </>
            )},
            {!denuncia.lugar_hecho_no_aplica && (
                <>
                    , en la dirección <Text style={{ fontWeight: 'bold' }}>{toSafeString(denuncia.lugar_hecho).toUpperCase()}</Text>
                </>
            )}
            {autoresValidos.length > 0 && (
                <>
                    {', siendo sindicado como supuesto autor '}
                    {autoresValidos.map((autor, index) => {
                        const isLast = index === autoresValidos.length - 1;
                        const separator = isLast ? '' : '; asimismo ';

                        if (autor.autor_conocido === 'Conocido') {
                            const nombre = toSafeString(autor.nombre_autor).toUpperCase();
                            return (
                                <React.Fragment key={index}>
                                    <Text style={{ fontWeight: 'bold' }}>{nombre}</Text>
                                    {autor.cedula_autor && (
                                        <>
                                            , con C.I. N° <Text style={{ fontWeight: 'bold' }}>{autor.cedula_autor}</Text>
                                        </>
                                    )}
                                    {autor.domicilio_autor && (
                                        <>
                                            , domiciliado en <Text style={{ fontWeight: 'bold' }}>{autor.domicilio_autor.toUpperCase()}</Text>
                                        </>
                                    )}
                                    {separator}
                                </React.Fragment>
                            );
                        } else {
                            const descFisica = formatDescripcionFisica(autor.descripcion_fisica);
                            const prefijo = autoresValidos.length > 1 ? `Persona ${index + 1}` : 'una persona desconocida';
                            return (
                                <React.Fragment key={index}>
                                    {descFisica ? (
                                        <>
                                            {prefijo} quien es descripta con los siguientes rasgos físicos: <Text style={{ fontWeight: 'bold' }}>{descFisica}</Text>
                                        </>
                                    ) : (
                                        prefijo
                                    )}
                                    {separator}
                                </React.Fragment>
                            );
                        }
                    })}
                </>
            )}
            {renderReferenciaOriginal()}
            .
        </Text>
    );
}
