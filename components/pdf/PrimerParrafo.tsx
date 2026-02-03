import React from 'react';
import { Text } from '@react-pdf/renderer';

/**
 * TIPOS DE DATOS
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

    // Denunciante principal
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

    const coDenunciantes = involucrados.filter(i => i.rol === 'co-denunciante');
    const abogados = involucrados.filter(i => i.rol === 'abogado');
    const abogadoConCartaPoder = abogados.find(a => a.con_carta_poder);
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
 * FUNCIONES HELPER DE RENDERIZADO
 * IMPORTANTE: No usar Fragments dentro de <Text> para evitar Error fatal: TypeError: Cannot read properties of undefined (reading 'S')
 */
function renderDatosPersonales(persona: DenuncianteData): React.ReactNode {
    return (
        <Text>
            {toSafeString(persona.tipo_documento || 'Cédula de Identidad Paraguaya')} número{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(persona.cedula)}</Text>, de nacionalidad{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(persona.nacionalidad).toUpperCase()}</Text>, estado civil{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(persona.estado_civil).toUpperCase()}</Text>,{' '}
            <Text style={{ fontWeight: 'bold' }}>{persona.edad || '---'}</Text> años de edad, fecha de nacimiento{' '}
            <Text style={{ fontWeight: 'bold' }}>{formatFecha(persona.fecha_nacimiento)}</Text>, en{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(persona.lugar_nacimiento).toUpperCase()}</Text>, domiciliado en{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(persona.domicilio || 'SIN DATOS').toUpperCase()}</Text>, de profesión{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(persona.profesion || 'SIN PROFESIÓN').toUpperCase()}</Text>, teléfono{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(persona.telefono)}</Text>
        </Text>
    );
}

/**
 * GENERACIÓN DEL PRIMER PÁRRAFO
 */
export function generarPrimerParrafo(
    denuncia: DenunciaData,
    styles: any
): React.ReactElement {
    const analisis = analizarParticipantes(denuncia);

    const operadorNombreCompleto = [
        toSafeString(denuncia.operador_grado),
        toSafeString(denuncia.operador_nombre),
        toSafeString(denuncia.operador_apellido)
    ].filter(Boolean).join(' ').toUpperCase();

    if (analisis.abogadoConCartaPoder && analisis.coDenunciantes.length === 0 && !analisis.abogado) {
        return generarParrafoAbogadoRepresentante(
            denuncia,
            analisis.abogadoConCartaPoder,
            analisis.denunciantePrincipal,
            operadorNombreCompleto,
            styles
        );
    }

    if (analisis.totalComparecientes > 1) {
        return generarParrafoMultiple(
            denuncia,
            analisis,
            operadorNombreCompleto,
            styles
        );
    }

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
            {renderDatosPersonales(abogado as DenuncianteData)}, actuando en su carácter de{' '}
            <Text style={{ fontWeight: 'bold' }}>REPRESENTANTE LEGAL</Text> de{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(representado.nombres).toUpperCase()}</Text>, con{' '}
            {toSafeString(representado.tipo_documento || 'Cédula de Identidad Paraguaya')} número{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(representado.cedula)}</Text>
            {abogado.con_carta_poder ? (
                <Text>
                    , conforme a <Text style={{ fontWeight: 'bold' }}>CARTA PODER</Text>
                    {abogado.carta_poder_numero ? ` N° ${abogado.carta_poder_numero}` : ''}
                    {abogado.carta_poder_fecha ? ` de fecha ${formatFecha(abogado.carta_poder_fecha)}` : ''}
                    {abogado.carta_poder_notario ? ` ante el Escribano ${abogado.carta_poder_notario.toUpperCase()}` : ''}
                </Text>
            ) : null}
            , y expone cuanto sigue:
        </Text>
    );
}

/**
 * CASO 2: Múltiples comparecientes (Narrativa Secuencial)
 */
function generarParrafoMultiple(
    denuncia: DenunciaData,
    analisis: AnalisisParticipantes,
    operador: string,
    styles: any
): React.ReactElement {
    const { denunciantePrincipal, coDenunciantes, abogado, abogadoConCartaPoder } = analisis;

    return (
        <Text style={styles.paragraph}>
            En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ASUNCIÓN, en fecha{' '}
            <Text style={{ fontWeight: 'bold' }}>{formatFecha(denuncia.fecha_denuncia)}</Text> siendo las{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denuncia.hora_denuncia)}</Text>, ante mí{' '}
            <Text style={{ fontWeight: 'bold' }}>{operador || 'PERSONAL POLICIAL INTERVINIENTE'}</Text>, concurren los ciudadanos:{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciantePrincipal.nombres).toUpperCase()}</Text>, con{' '}
            {renderDatosPersonales(denunciantePrincipal)}

            {coDenunciantes.map((cd, index) => (
                <Text key={`coden-${index}`}>
                    ; asimismo{' '}
                    <Text style={{ fontWeight: 'bold' }}>{toSafeString(cd.nombres).toUpperCase()}</Text>, con{' '}
                    {renderDatosPersonales(cd)}
                </Text>
            ))}

            {/* Abogados */}
            {abogado ? (
                <Text>
                    ; asistido por{' '}
                    <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogado.nombres).toUpperCase()}</Text>, en su carácter de{' '}
                    <Text style={{ fontWeight: 'bold' }}>ABOGADO ASISTENTE</Text>
                    {abogado.matricula ? `, matrícula N° ` : ''}
                    {abogado.matricula ? <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogado.matricula)}</Text> : ''}
                    , con {renderDatosPersonales(abogado)}
                </Text>
            ) : null}

            {abogadoConCartaPoder ? (
                <Text>
                    ; y{' '}
                    <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogadoConCartaPoder.nombres).toUpperCase()}</Text>, en su carácter de{' '}
                    <Text style={{ fontWeight: 'bold' }}>REPRESENTANTE LEGAL</Text> de{' '}
                    <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciantePrincipal.nombres).toUpperCase()}</Text>
                    {abogadoConCartaPoder.matricula ? `, matrícula N° ` : ''}
                    {abogadoConCartaPoder.matricula ? <Text style={{ fontWeight: 'bold' }}>{toSafeString(abogadoConCartaPoder.matricula)}</Text> : ''}
                    , con {renderDatosPersonales(abogadoConCartaPoder)}
                    {abogadoConCartaPoder.con_carta_poder ? (
                        <Text>
                            , conforme a <Text style={{ fontWeight: 'bold' }}>CARTA PODER</Text>
                            {abogadoConCartaPoder.carta_poder_numero ? ` N° ${abogadoConCartaPoder.carta_poder_numero}` : ''}
                            {abogadoConCartaPoder.carta_poder_fecha ? ` de fecha ${formatFecha(abogadoConCartaPoder.carta_poder_fecha)}` : ''}
                            {abogadoConCartaPoder.carta_poder_notario ? ` ante el Escribano ${abogadoConCartaPoder.carta_poder_notario.toUpperCase()}` : ''}
                        </Text>
                    ) : null}
                </Text>
            ) : null}

            , quienes de común acuerdo exponen cuanto sigue:
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
            <Text style={{ fontWeight: 'bold' }}>{formatFecha(denuncia.fecha_denuncia)}</Text> being the{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denuncia.hora_denuncia)}</Text>, ante mí{' '}
            <Text style={{ fontWeight: 'bold' }}>{operador || 'PERSONAL POLICIAL INTERVINIENTE'}</Text>, concurre{' '}
            <Text style={{ fontWeight: 'bold' }}>{toSafeString(denunciante.nombres).toUpperCase()}</Text>, con{' '}
            {renderDatosPersonales(denunciante)}, y expone cuanto sigue:
        </Text>
    );
}
