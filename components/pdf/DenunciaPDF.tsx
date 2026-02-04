import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import ParaguayHeader from './ParaguayHeader';
import { generarPrimerParrafo, analizarParticipantes } from './PrimerParrafo';
import { generarSegundoParrafo } from './SegundoParrafo';
import { TercerParrafo } from './TercerParrafo';
import { CierreDenuncia } from './CierreDenuncia';
import { SeccionFirmas } from './SeccionFirmas';

const styles = StyleSheet.create({
    page: {
        paddingTop: 15,  // Margen superior mínimo
        paddingBottom: 72,  // 2.54cm
        paddingHorizontal: 72,  // 2.54cm laterales
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    headerFixed: {
        position: 'relative',
        left: 0,
        right: 0,
        top: 0,
    },
    legalNotice: {
        fontSize: 8,
        fontStyle: 'italic',
        marginTop: 5,
        marginBottom: 10,
        textAlign: 'justify',
        lineHeight: 1.3,
    },
    paragraph: {
        fontSize: 10,
        textAlign: 'justify',
        lineHeight: 1.4,
        marginBottom: 8,
    },
});

interface InvolucradoData {
    rol: 'principal' | 'co-denunciante' | 'abogado';
    con_carta_poder: boolean;
    nombres: string;
    cedula: string;
    matricula?: string;
    [key: string]: any;
}

interface DenunciaData {
    orden: number;
    hash: string;
    qr_code_url?: string;
    fecha_denuncia: any;
    hora_denuncia: string;
    fecha_hecho: any;
    hora_hecho: string;
    usar_rango?: boolean;
    fecha_hecho_fin?: any;
    hora_hecho_fin?: string;
    tipo_denuncia: string;
    lugar_hecho: string;
    lugar_hecho_no_aplica?: boolean;
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
    relato?: string;
    denunciantes_involucrados?: InvolucradoData[];
    is_duplicate?: boolean;
    operador_actual?: {
        nombre: string;
        apellido: string;
        grado: string;
    };
    archivo_denuncia_url?: string;
    es_denuncia_escrita?: boolean;
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
    const analisis = analizarParticipantes(denuncia as any);

    return (
        <Document>
            <Page size={[612, 936]} style={styles.page}>
                {/* Header que se repite en cada página */}
                <View fixed style={styles.headerFixed}>
                    <ParaguayHeader numeroActa={denuncia.orden.toString()} año={año} />
                </View>

                {/* Aviso Legal: Solo en la primera página (sin 'fixed') */}
                <Text style={styles.legalNotice}>
                    LA PRESENTE ACTA SE REALIZA CONFORME A LOS SIGUIENTES: ARTÍCULO 284. "DENUNCIA", ARTÍCULO 285. "FORMA Y CONTENIDO", ARTÍCULO 289. "DENUNCIA ANTE LA POLICÍA" DE LA LEY 1286/98 "CODIGO PROCESAL PENAL".
                </Text>

                {/* Aviso de Duplicado (Opcional) */}
                {denuncia.is_duplicate && (
                    <Text style={[styles.legalNotice, { marginTop: -5 }]}>
                        LA PRESENTE ES UNA IMPRESIÓN DUPLICADA SOLICITADA EXCLUSIVAMENTE POR LA PERSONA DENUNCIANTE PARA LOS FINES QUE HUBIERE LUGAR.
                    </Text>
                )}

                {/* Primer Párrafo - NUEVO SISTEMA MULTI-PARTE */}
                {generarPrimerParrafo(denuncia as any, styles)}

                {/* Segundo Párrafo - Hecho, Fecha y Lugar */}
                {generarSegundoParrafo(denuncia as any, styles)}

                {/* Tercer Párrafo - Relato */}
                <TercerParrafo
                    relato={denuncia.relato || ''}
                    esDenunciaEscrita={denuncia.es_denuncia_escrita}
                    styles={styles}
                />

                {/* Cierre de Acta */}
                <CierreDenuncia totalPersonas={analisis.totalComparecientes} styles={styles} />

                {/* Sección de Firmas */}
                <SeccionFirmas
                    operador={{
                        nombre: denuncia.operador_nombre || '',
                        apellido: denuncia.operador_apellido || '',
                        grado: denuncia.operador_grado || '',
                    }}
                    denunciante={{
                        nombres: denuncia.nombres_denunciante,
                        cedula: denuncia.cedula,
                    }}
                    abogadoRep={analisis.abogadoConCartaPoder ? {
                        nombres: analisis.abogadoConCartaPoder.nombres,
                        matricula: analisis.abogadoConCartaPoder.matricula
                    } : undefined}
                    hash={denuncia.hash}
                    qrCodeUrl={denuncia.qr_code_url || ''}
                    isDuplicate={denuncia.is_duplicate}
                    operadorActual={denuncia.operador_actual}
                    operadorOriginalId={denuncia.usuario_id}
                />
            </Page >
        </Document >
    );
};

export default DenunciaPDFDocument;
