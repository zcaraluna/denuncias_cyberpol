import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import ParaguayHeader from './ParaguayHeader';

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

    // Construir el nombre completo del operador
    const operadorNombreCompleto = [
        toSafeString(denuncia.operador_grado),
        toSafeString(denuncia.operador_nombre),
        toSafeString(denuncia.operador_apellido)
    ].filter(Boolean).join(' ').toUpperCase();

    // Determinar quién concurre y si hay representación
    const involucrados = denuncia.denunciantes_involucrados || [];
    const representante = involucrados.find((i: any) => i.rol === 'representante');
    const principal = involucrados.find((i: any) => i.rol === 'principal');

    // Datos del compareciente (el que está físicamente ahí)
    const compareciente = representante || {
        nombres: denuncia.nombres_denunciante,
        tipo_documento: denuncia.tipo_documento,
        cedula: denuncia.cedula,
        nacionalidad: denuncia.nacionalidad,
        estado_civil: denuncia.estado_civil,
        edad: denuncia.edad,
        fecha_nacimiento: denuncia.fecha_nacimiento,
        lugar_nacimiento: denuncia.lugar_nacimiento,
        domicilio: denuncia.domicilio,
        profesion: denuncia.profesion,
        telefono: denuncia.telefono
    };

    return (
        <Document>
            <Page size={[612, 936]} style={styles.page}>
                <ParaguayHeader numeroActa={denuncia.orden.toString()} año={año} />

                {/* Aviso Legal */}
                <Text style={styles.legalNotice}>
                    LA PRESENTE ACTA SE REALIZA CONFORME A LOS SIGUIENTES: ARTÍCULO 284. "DENUNCIA", ARTÍCULO 285. "FORMA Y CONTENIDO", ARTÍCULO 289. "DENUNCIA ANTE LA POLICÍA" DE LA LEY 1286/98 "CODIGO PROCESAL PENAL".
                </Text>

                {/* Primer Párrafo con datos en negrita */}
                <Text style={styles.paragraph}>
                    En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ASUNCIÓN, en fecha{' '}
                    <Text style={{ fontWeight: 'bold' }}>{formatFecha(denuncia.fecha_denuncia)}</Text> siendo las{' '}
                    <Text style={{ fontWeight: 'bold' }}>{toSafeString(denuncia.hora_denuncia)}</Text>, ante mí{' '}
                    <Text style={{ fontWeight: 'bold' }}>{operadorNombreCompleto || 'PERSONAL POLICIAL INTERVINIENTE'}</Text>, concurre{' '}
                    <Text style={{ fontWeight: 'bold' }}>{toSafeString(compareciente.nombres).toUpperCase()}</Text>, con{' '}
                    {toSafeString(compareciente.tipo_documento || 'Cédula de Identidad Paraguaya')} número{' '}
                    <Text style={{ fontWeight: 'bold' }}>{toSafeString(compareciente.cedula)}</Text>, de nacionalidad{' '}
                    <Text style={{ fontWeight: 'bold' }}>{toSafeString(compareciente.nacionalidad).toUpperCase()}</Text>, estado civil{' '}
                    <Text style={{ fontWeight: 'bold' }}>{toSafeString(compareciente.estado_civil).toUpperCase()}</Text>,{' '}
                    <Text style={{ fontWeight: 'bold' }}>{compareciente.edad || '---'}</Text> años de edad, fecha de nacimiento{' '}
                    <Text style={{ fontWeight: 'bold' }}>{formatFecha(compareciente.fecha_nacimiento)}</Text>, en{' '}
                    <Text style={{ fontWeight: 'bold' }}>{toSafeString(compareciente.lugar_nacimiento).toUpperCase()}</Text>, domiciliado en{' '}
                    <Text style={{ fontWeight: 'bold' }}>{toSafeString(compareciente.domicilio || 'SIN DATOS').toUpperCase()}</Text>, de profesión{' '}
                    <Text style={{ fontWeight: 'bold' }}>{toSafeString(compareciente.profesion || 'SIN PROFESIÓN').toUpperCase()}</Text>, teléfono{' '}
                    <Text style={{ fontWeight: 'bold' }}>{toSafeString(compareciente.telefono)}</Text>

                    {representante && principal && (
                        <>
                            , actuando en su carácter de <Text style={{ fontWeight: 'bold' }}>REPRESENTANTE</Text> de{' '}
                            <Text style={{ fontWeight: 'bold' }}>{toSafeString(principal.nombres).toUpperCase()}</Text>, con{' '}
                            {toSafeString(principal.tipo_documento || 'Cédula de Identidad Paraguaya')} número{' '}
                            <Text style={{ fontWeight: 'bold' }}>{toSafeString(principal.cedula)}</Text>
                            {representante.con_carta_poder && (
                                <>
                                    , conforme a <Text style={{ fontWeight: 'bold' }}>CARTA PODER</Text>
                                    {representante.carta_poder_numero && ` N° ${representante.carta_poder_numero}`}
                                    {representante.carta_poder_fecha && ` de fecha ${formatFecha(representante.carta_poder_fecha)}`}
                                    {representante.carta_poder_notario && ` ante el Escribano ${representante.carta_poder_notario.toUpperCase()}`}
                                </>
                            )}
                        </>
                    )}
                    , y expone cuanto sigue:
                </Text>
            </Page>
        </Document>
    );
};

export default DenunciaPDFDocument;
