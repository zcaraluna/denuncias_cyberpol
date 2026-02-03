import React from 'react';
import { Text } from '@react-pdf/renderer';

/**
 * TIPOS DE DATOSAAAAAAAAAAAAAAaaA
 */
interface DenuncianteData {
    nombres: string;
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
    matricula?: string;
}

interface InvolucradoData extends DenuncianteData {
    rol: 'principal' | 'co-denunciante' | 'abogado';
    con_carta_poder: boolean;
    carta_poder_fecha?: string;
    carta_poder_numero?: string;
    carta_poder_notario?: string;
}

interface DenunciaData {
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
    denunciantes_involucrados?: InvolucradoData[];
}

/**
 * FUNCIONES HELPER
 */
const toSafeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString().split('T')[0];
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

/**
 * ANÁLISIS DE PARTICIPANTES
 */
interface AnalisisParticipantes {
    denunciantePrincipal: DenuncianteData;
    coDenunciantes: InvolucradoData[];
    abogado?: InvolucradoData;
    abogadoConCartaPoder?: InvolucradoData;
    totalComparecientes: number;
}

function analizarParticipantes(denuncia: DenunciaData): AnalisisParticipantes {
    const involucrados = denuncia.denunciantes_involucrados || [];

    // Denunciante principal (siempre existe en la tabla principal)
    const denunciantePrincipal: DenuncianteData = {
        nombres: denuncia.nombres_denunciante,
        cedula: denuncia.cedula,
        tipo_documento: denuncia.tipo_documento,
        nacionalidad: denuncia.nacionalidad,
        estado_civil: denuncia.estado_civil,
        edad: denuncia.edad,
        fecha_nacimiento: denuncia.fecha_nacimiento,
        lugar_nacimiento: denuncia.lugar_nacimiento,
        domicilio: denuncia.domicilio,
        profesion: denuncia.profesion,
        telefono: denuncia.telefono,
    };

    // Clasificar involucrados
    const coDenunciantes = involucrados.filter(i => i.rol === 'co-denunciante');
    const abogados = involucrados.filter(i => i.rol === 'abogado');

    // Abogado con carta poder (actúa como representante)
    const abogadoConCartaPoder = abogados.find(a => a.con_carta_poder);

    // Abogado que solo asiste (sin carta poder)
    const abogado = abogados.find(a => !a.con_carta_poder);

    const totalComparecientes = 1 + coDenunciantes.length + (abogado ? 1 : 0) + (abogadoConCartaPoder ? 1 : 0);

    return {
        denunciantePrincipal,
        coDenunciantes,
        abogado,
        abogadoConCartaPoder,
        totalComparecientes,
    };
}

/**
 * GENERACIÓN DEL PRIMER PÁRRAFO
 */
export function generarPrimerParrafo(
    denuncia: DenunciaData,
    styles: any
): React.ReactElement {
    const analisis = analizarParticipantes(denuncia);

    // Construir nombre del operador
    const operadorNombreCompleto = [
        toSafeString(denuncia.operador_grado),
        toSafeString(denuncia.operador_nombre),
        toSafeString(denuncia.operador_apellido)
    ].filter(Boolean).join(' ').toUpperCase();

    // CASO 1: Abogado con carta poder (comparece solo en representación)
    if (analisis.abogadoConCartaPoder && analisis.coDenunciantes.length === 0 && !analisis.abogado) {
        return generarParrafoAbogadoRepresentante(
            denuncia,
            analisis.abogadoConCartaPoder,
            analisis.denunciantePrincipal,
            operadorNombreCompleto,
            styles
        );
    }

    // CASO 2: Múltiples comparecientes
    if (analisis.totalComparecientes > 1) {
        return generarParrafoMultiple(
            denuncia,
            analisis,
            operadorNombreCompleto,
            styles
        );
    }

    // CASO 3: Denunciante solo (caso simple)
    return generarParrafoSimple(
        denuncia,
        analisis.denunciantePrincipal,
        operadorNombreCompleto,
        styles
    );
}

/**
 * CASO 1: Abogado con carta poder comparece solo
 */
function generarParrafoAbogadoRepresentante(
    denuncia: DenunciaData,
    abogado: InvolucradoData,
    representado: DenuncianteData,
    operador: string,
    styles: any
): React.ReactElement {
    return (
        <Text style={styles.paragraph}>
            En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ASUNCIÓN, en fecha{' '}
            <Text style={{ fontWeight: 'bold' }}>{formatFecha(denuncia.fecha_denuncia)}</Text> siendo las{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denuncia.hora_denuncia)}</Text>, ante mí{' '}
            <Text style={{ fontWeight: 'bold' }}>{operador || 'PERSONAL POLICIAL INTERVINIENTE'}</Text>, concurre{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogado.nombres).toUpperCase()}</Text>, con{' '}
            {toSafeString(abogado.tipo_documento || 'Cédula de Identidad Paraguaya')} número{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogado.cedula)}</Text>, de nacionalidad{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogado.nacionalidad).toUpperCase()}</Text>, estado civil{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogado.estado_civil).toUpperCase()}</Text>,{' '}
            <Text style={{ fontWeight: 'bold' }}>{abogado.edad || '---'}</Text> años de edad, fecha de nacimiento{' '}
            <Text style={{ fontWeight: 'bold' }}>{formatFecha(abogado.fecha_nacimiento)}</Text>, en{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogado.lugar_nacimiento).toUpperCase()}</Text>, domiciliado en{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogado.domicilio || 'SIN DATOS').toUpperCase()}</Text>, de profesión{' '}
            <Text style={{ fontWeight: 'bold' }}>ABOGADO</Text>
            {abogado.matricula && (
                <>, matrícula N° <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogado.matricula)}</Text></>
            )}, teléfono{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogado.telefono)}</Text>, actuando en su carácter de{' '}
            <Text style={{ fontWeight: 'bold' }}>REPRESENTANTE LEGAL</Text> de{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(representado.nombres).toUpperCase()}</Text>, con{' '}
            {toSafeString(representado.tipo_documento || 'Cédula de Identidad Paraguaya')} número{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(representado.cedula)}</Text>
            {abogado.con_carta_poder && (
                <>
                    , conforme a <Text style={{ fontWeight: 'bold' }}>CARTA PODER</Text>
                    {abogado.carta_poder_numero && ` N° ${abogado.carta_poder_numero}`}
                    {abogado.carta_poder_fecha && ` de fecha ${formatFecha(abogado.carta_poder_fecha)}`}
                    {abogado.carta_poder_notario && ` ante el Escribano ${abogado.carta_poder_notario.toUpperCase()}`}
                </>
            )}
            , y expone cuanto sigue:
        </Text>
    );
}

/**
 * CASO 2: Múltiples comparecientes
 */
function generarParrafoMultiple(
    denuncia: DenunciaData,
    analisis: AnalisisParticipantes,
    operador: string,
    styles: any
): React.ReactElement {
    const { denunciantePrincipal, coDenunciantes, abogado, abogadoConCartaPoder } = analisis;

    // Lista de nombres de todos los comparecientes
    const nombres: string[] = [toSafeString(denunciantePrincipal.nombres).toUpperCase()];

    coDenunciantes.forEach(cd => {
        nombres.push(toSafeString(cd.nombres).toUpperCase());
    });

    if (abogado) {
        nombres.push(toSafeString(abogado.nombres).toUpperCase());
    }

    if (abogadoConCartaPoder) {
        nombres.push(toSafeString(abogadoConCartaPoder.nombres).toUpperCase());
    }

    // Formatear lista de nombres: "A, B y C" o "A y B"
    let listaNombres = '';
    if (nombres.length === 2) {
        listaNombres = `${nombres[0]} y ${nombres[1]}`;
    } else {
        const ultimoNombre = nombres[nombres.length - 1];
        const restantes = nombres.slice(0, -1);
        listaNombres = `${restantes.join(', ')} y ${ultimoNombre}`;
    }

    return (
        <Text style={styles.paragraph}>
            En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ASUNCIÓN, en fecha{' '}
            <Text style={{ fontWeight: 'bold' }}>{formatFecha(denuncia.fecha_denuncia)}</Text> siendo las{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denuncia.hora_denuncia)}</Text>, ante mí{' '}
            <Text style={{ fontWeight: 'bold' }}>{operador || 'PERSONAL POLICIAL INTERVINIENTE'}</Text>, concurren{' '}
            <Text style={{ fontWeight: 'bold' }}>{listaNombres}</Text>

            {/* Datos completos solo del denunciante principal */}
            , siendo los datos del primero: {toSafeString(denunciantePrincipal.tipo_documento || 'Cédula de Identidad Paraguaya')} número{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciantePrincipal.cedula)}</Text>, de nacionalidad{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciantePrincipal.nacionalidad).toUpperCase()}</Text>, estado civil{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciantePrincipal.estado_civil).toUpperCase()}</Text>,{' '}
            <Text style={{ fontWeight: 'bold' }}>{denunciantePrincipal.edad || '---'}</Text> años de edad, fecha de nacimiento{' '}
            <Text style={{ fontWeight: 'bold' }}>{formatFecha(denunciantePrincipal.fecha_nacimiento)}</Text>, en{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciantePrincipal.lugar_nacimiento).toUpperCase()}</Text>, domiciliado en{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciantePrincipal.domicilio || 'SIN DATOS').toUpperCase()}</Text>, de profesión{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciantePrincipal.profesion || 'SIN PROFESIÓN').toUpperCase()}</Text>, teléfono{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciantePrincipal.telefono)}</Text>

            {/* Mencionar roles especiales */}
            {abogado && (
                <>
                    , actuando <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogado.nombres).toUpperCase()}</Text> en su carácter de{' '}
                    <Text style={{ fontWeight: 'bold' }}>ABOGADO</Text>
                    {abogado.matricula && <>, matrícula N° <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogado.matricula)}</Text></>}
                </>
            )}

            {abogadoConCartaPoder && (
                <>
                    , actuando <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogadoConCartaPoder.nombres).toUpperCase()}</Text> en su carácter de{' '}
                    <Text style={{ fontWeight: 'bold' }}>REPRESENTANTE LEGAL</Text>
                    {abogadoConCartaPoder.matricula && <>, matrícula N° <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogadoConCartaPoder.matricula)}</Text></>}
                    {abogadoConCartaPoder.con_carta_poder && (
                        <>
                            , conforme a <Text style={{ fontWeight: 'bold' }}>CARTA PODER</Text>
                            {abogadoConCartaPoder.carta_poder_numero && ` N° ${abogadoConCartaPoder.carta_poder_numero}`}
                            {abogadoConCartaPoder.carta_poder_fecha && ` de fecha ${formatFecha(abogadoConCartaPoder.carta_poder_fecha)}`}
                            {abogadoConCartaPoder.carta_poder_notario && ` ante el Escribano ${abogadoConCartaPoder.carta_poder_notario.toUpperCase()}`}
                        </>
                    )}
                </>
            )}

            , y exponen cuanto sigue:
        </Text>
    );
}

/**
 * CASO 3: Denunciante solo (caso simple)
 */
function generarParrafoSimple(
    denuncia: DenunciaData,
    denunciante: DenuncianteData,
    operador: string,
    styles: any
): React.ReactElement {
    return (
        <Text style={styles.paragraph}>
            En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ASUNCIÓN, en fecha{' '}
            <Text style={{ fontWeight: 'bold' }}>{formatFecha(denuncia.fecha_denuncia)}</Text> siendo las{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denuncia.hora_denuncia)}</Text>, ante mí{' '}
            <Text style={{ fontWeight: 'bold' }}>{operador || 'PERSONAL POLICIAL INTERVINIENTE'}</Text>, concurre{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciante.nombres).toUpperCase()}</Text>, con{' '}
            {toSafeString(denunciante.tipo_documento || 'Cédula de Identidad Paraguaya')} número{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciante.cedula)}</Text>, de nacionalidad{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciante.nacionalidad).toUpperCase()}</Text>, estado civil{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciante.estado_civil).toUpperCase()}</Text>,{' '}
            <Text style={{ fontWeight: 'bold' }}>{denunciante.edad || '---'}</Text> años de edad, fecha de nacimiento{' '}
            <Text style={{ fontWeight: 'bold' }}>{formatFecha(denunciante.fecha_nacimiento)}</Text>, en{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciante.lugar_nacimiento).toUpperCase()}</Text>, domiciliado en{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciante.domicilio || 'SIN DATOS').toUpperCase()}</Text>, de profesión{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciante.profesion || 'SIN PROFESIÓN').toUpperCase()}</Text>, teléfono{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciante.telefono)}</Text>, y expone cuanto sigue:
        </Text>
    );
}
