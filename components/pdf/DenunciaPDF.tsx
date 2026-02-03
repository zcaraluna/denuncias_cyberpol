import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import ParaguayHeader from './ParaguayHeader';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 3,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        fontWeight: 'bold',
        width: '40%',
    },
    value: {
        width: '60%',
    },
    fullWidth: {
        marginBottom: 5,
    },
    relato: {
        marginTop: 5,
        lineHeight: 1.5,
        textAlign: 'justify',
    },
    autorContainer: {
        marginBottom: 10,
        padding: 10,
        border: '1px solid #ccc',
        borderRadius: 4,
    },
    autorBadge: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 5,
        padding: 3,
        backgroundColor: '#e0e0e0',
    },
});

export interface DenunciaData {
    orden: number;
    hash: string;
    fecha_denuncia: string;
    hora_denuncia: string;
    fecha_hecho: string;
    hora_hecho: string;
    tipo_denuncia: string;
    otro_tipo?: string;
    relato: string;
    lugar_hecho: string;
    latitud?: number;
    longitud?: number;
    monto_dano?: number;
    moneda?: string;
    nombres_denunciante: string;
    cedula: string;
    tipo_documento?: string;
    nacionalidad: string;
    estado_civil: string;
    edad: number;
    fecha_nacimiento: string;
    lugar_nacimiento: string;
    domicilio?: string;
    telefono: string;
    correo?: string;
    profesion?: string;
    supuestos_autores?: Array<{
        autor_conocido: string;
        nombre_autor?: string;
        cedula_autor?: string;
        domicilio_autor?: string;
        nacionalidad_autor?: string;
        estado_civil_autor?: string;
        edad_autor?: number;
        telefono_autor?: string;
        profesion_autor?: string;
        descripcion_fisica?: string;
        telefonos_involucrados?: string;
        numero_cuenta_beneficiaria?: string;
        nombre_cuenta_beneficiaria?: string;
        entidad_bancaria?: string;
    }>;
}

interface DenunciaPDFProps {
    denuncia: DenunciaData;
    pageSize?: 'LETTER' | 'A4';
}

// Componente que retorna Document completo
const DenunciaPDFDocument: React.FC<DenunciaPDFProps> = ({ denuncia, pageSize = 'LETTER' }) => {
    const año = new Date(denuncia.fecha_denuncia).getFullYear();

    return (
        <Document>
            <Page size={pageSize} style={styles.page}>
                <ParaguayHeader numeroActa={denuncia.orden.toString()} año={año} />

                {/* Datos del Denunciante */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DATOS DEL DENUNCIANTE</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Nombres y Apellidos:</Text>
                        <Text style={styles.value}>{denuncia.nombres_denunciante}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Tipo de Documento:</Text>
                        <Text style={styles.value}>{denuncia.tipo_documento || 'Cédula de Identidad Paraguaya'}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Número de Documento:</Text>
                        <Text style={styles.value}>{denuncia.cedula}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Nacionalidad:</Text>
                        <Text style={styles.value}>{denuncia.nacionalidad}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Fecha de Nacimiento:</Text>
                        <Text style={styles.value}>{denuncia.fecha_nacimiento}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Edad:</Text>
                        <Text style={styles.value}>{denuncia.edad} años</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Lugar de Nacimiento:</Text>
                        <Text style={styles.value}>{denuncia.lugar_nacimiento}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Estado Civil:</Text>
                        <Text style={styles.value}>{denuncia.estado_civil}</Text>
                    </View>

                    {denuncia.domicilio && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Domicilio:</Text>
                            <Text style={styles.value}>{denuncia.domicilio}</Text>
                        </View>
                    )}

                    <View style={styles.row}>
                        <Text style={styles.label}>Teléfono:</Text>
                        <Text style={styles.value}>{denuncia.telefono}</Text>
                    </View>

                    {denuncia.correo && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Correo Electrónico:</Text>
                            <Text style={styles.value}>{denuncia.correo}</Text>
                        </View>
                    )}

                    {denuncia.profesion && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Profesión:</Text>
                            <Text style={styles.value}>{denuncia.profesion}</Text>
                        </View>
                    )}
                </View>

                {/* Detalles de la Denuncia */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DETALLES DE LA DENUNCIA</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Número de Orden:</Text>
                        <Text style={styles.value}>{denuncia.orden}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Hash:</Text>
                        <Text style={styles.value}>{denuncia.hash}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Tipo de Denuncia:</Text>
                        <Text style={styles.value}>
                            {denuncia.tipo_denuncia === 'OTRO' ? denuncia.otro_tipo : denuncia.tipo_denuncia}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Fecha del Hecho:</Text>
                        <Text style={styles.value}>{denuncia.fecha_hecho} {denuncia.hora_hecho}</Text>
                    </View>

                    <View style={styles.fullWidth}>
                        <Text style={styles.label}>Lugar del Hecho:</Text>
                        <Text>{denuncia.lugar_hecho}</Text>
                    </View>

                    {denuncia.latitud && denuncia.longitud && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Coordenadas GPS:</Text>
                            <Text style={styles.value}>
                                {denuncia.latitud.toFixed(6)}, {denuncia.longitud.toFixed(6)}
                            </Text>
                        </View>
                    )}

                    {denuncia.monto_dano && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Monto del Daño:</Text>
                            <Text style={styles.value}>
                                {denuncia.monto_dano.toLocaleString('es-PY')} {denuncia.moneda}
                            </Text>
                        </View>
                    )}

                    <View style={styles.fullWidth}>
                        <Text style={styles.label}>Relato del Hecho:</Text>
                        <Text style={styles.relato}>{denuncia.relato}</Text>
                    </View>
                </View>

                {/* Supuestos Autores */}
                {denuncia.supuestos_autores && denuncia.supuestos_autores.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>SUPUESTOS AUTORES</Text>

                        {denuncia.supuestos_autores.map((autor, index) => (
                            <View key={index} style={styles.autorContainer}>
                                <Text style={styles.autorBadge}>
                                    {autor.autor_conocido === 'Conocido' ? 'AUTOR CONOCIDO' : 'AUTOR DESCONOCIDO'}
                                </Text>

                                {autor.autor_conocido === 'Conocido' ? (
                                    <>
                                        {autor.nombre_autor && (
                                            <View style={styles.row}>
                                                <Text style={styles.label}>Nombre:</Text>
                                                <Text style={styles.value}>{autor.nombre_autor}</Text>
                                            </View>
                                        )}
                                        {autor.cedula_autor && (
                                            <View style={styles.row}>
                                                <Text style={styles.label}>Cédula:</Text>
                                                <Text style={styles.value}>{autor.cedula_autor}</Text>
                                            </View>
                                        )}
                                        {autor.domicilio_autor && (
                                            <View style={styles.fullWidth}>
                                                <Text style={styles.label}>Domicilio:</Text>
                                                <Text>{autor.domicilio_autor}</Text>
                                            </View>
                                        )}
                                        {autor.nacionalidad_autor && (
                                            <View style={styles.row}>
                                                <Text style={styles.label}>Nacionalidad:</Text>
                                                <Text style={styles.value}>{autor.nacionalidad_autor}</Text>
                                            </View>
                                        )}
                                        {autor.telefono_autor && (
                                            <View style={styles.row}>
                                                <Text style={styles.label}>Teléfono:</Text>
                                                <Text style={styles.value}>{autor.telefono_autor}</Text>
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {autor.descripcion_fisica && (
                                            <View style={styles.fullWidth}>
                                                <Text style={styles.label}>Descripción Física:</Text>
                                                <Text>{autor.descripcion_fisica}</Text>
                                            </View>
                                        )}
                                        {autor.telefonos_involucrados && (
                                            <View style={styles.row}>
                                                <Text style={styles.label}>Teléfonos Involucrados:</Text>
                                                <Text style={styles.value}>{autor.telefonos_involucrados}</Text>
                                            </View>
                                        )}
                                        {autor.numero_cuenta_beneficiaria && (
                                            <View style={styles.row}>
                                                <Text style={styles.label}>Número de Cuenta:</Text>
                                                <Text style={styles.value}>{autor.numero_cuenta_beneficiaria}</Text>
                                            </View>
                                        )}
                                        {autor.entidad_bancaria && (
                                            <View style={styles.row}>
                                                <Text style={styles.label}>Entidad Bancaria:</Text>
                                                <Text style={styles.value}>{autor.entidad_bancaria}</Text>
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </Page>
        </Document>
    );
};

// Función helper para generar el PDF
export const generateDenunciaPDF = async (denuncia: DenunciaData, pageSize: 'LETTER' | 'A4' = 'LETTER') => {
    const blob = await pdf(<DenunciaPDFDocument denuncia={denuncia} pageSize={pageSize} />).toBlob();
    return Buffer.from(await blob.arrayBuffer());
};

export default DenunciaPDFDocument;
