import { NextRequest, NextResponse } from 'next/server'
import { obtenerCapitulo } from '@/lib/data/hechos-punibles'

interface DenuncianteData {
    nombres: string;
    cedula: string;
    tipo_documento?: string;
    nacionalidad: string;
    estado_civil: string;
    edad: number | string;
    fecha_nacimiento: string;
    lugar_nacimiento: string;
    domicilio?: string;
    profesion?: string;
    telefono: string;
    matricula?: string;
}

interface InvolucradoData extends DenuncianteData {
    rol: 'principal' | 'co-denunciante' | 'abogado';
    con_carta_poder?: boolean;
    carta_poder_fecha?: string;
    carta_poder_numero?: string;
    carta_poder_notario?: string;
}

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

const renderDatosPersonales = (persona: DenuncianteData): string => {
    return `${toSafeString(persona.tipo_documento || 'Cédula de Identidad Paraguaya')} número <strong>${toSafeString(persona.cedula)}</strong>, de nacionalidad <strong>${toSafeString(persona.nacionalidad).toUpperCase()}</strong>, estado civil <strong>${toSafeString(persona.estado_civil).toUpperCase()}</strong>, <strong>${persona.edad || '---'}</strong> años de edad, fecha de nacimiento <strong>${formatFecha(persona.fecha_nacimiento)}</strong>, en <strong>${toSafeString(persona.lugar_nacimiento).toUpperCase()}</strong>, domiciliado en <strong>${toSafeString(persona.domicilio || 'SIN DATOS').toUpperCase()}</strong>, de profesión <strong>${toSafeString(persona.profesion || 'SIN PROFESIÓN').toUpperCase()}</strong>, teléfono <strong>${toSafeString(persona.telefono)}</strong>`;
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { denunciante, denunciantes, denuncia, operador } = body;

        const fechaDenuncia = denuncia.fechaDenuncia;
        const horaDenuncia = denuncia.horaDenuncia;
        const operadorNombre = operador.nombre ? `${operador.grado || ''} ${operador.nombre} ${operador.apellido}`.trim() : 'PERSONAL POLICIAL INTERVINIENTE';

        // Preparar participantes
        const denunciantePrincipal = denunciante;
        // Mapear denunciantes de la lista para tener consistencia
        const todosInvolucrados = (denunciantes || []).map((d: any) => ({
            nombres: d.datos.nombres,
            cedula: d.datos.numeroDocumento,
            tipo_documento: d.datos.tipoDocumento,
            nacionalidad: d.datos.nacionalidad,
            estado_civil: d.datos.estadoCivil,
            edad: d.datos.edad,
            fecha_nacimiento: d.datos.fechaNacimiento,
            lugar_nacimiento: d.datos.lugarNacimiento,
            domicilio: d.datos.domicilio,
            profesion: d.datos.profesion,
            telefono: d.datos.telefono,
            matricula: d.datos.matricula,
            rol: d.rol,
            con_carta_poder: d.conCartaPoder,
            carta_poder_fecha: d.cartaPoderFecha,
            carta_poder_numero: d.cartaPoderNumero,
            carta_poder_notario: d.cartaPoderNotario,
        }));

        const coDenunciantes = todosInvolucrados.filter((i: any) => i.rol === 'co-denunciante');
        const abogados = todosInvolucrados.filter((i: any) => i.rol === 'abogado');
        const abogadoConCartaPoder = abogados.find((a: any) => a.con_carta_poder);
        const abogado = abogados.find((a: any) => !a.con_carta_poder);
        const totalComparecientes = 1 + coDenunciantes.length + (abogado ? 1 : 0) + (abogadoConCartaPoder ? 1 : 0);

        let html = `<p class="text-justify mb-4">En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ASUNCIÓN, en fecha <strong>${formatFecha(fechaDenuncia)}</strong> siendo las <strong>${toSafeString(horaDenuncia)}</strong>, ante mí <strong>${operadorNombre.toUpperCase()}</strong>, `;

        // Lógica principal de narrativa (similar a PrimerParrafo.tsx)
        if (abogadoConCartaPoder && coDenunciantes.length === 0 && !abogado) {
            // CASO 1: Abogado con carta poder comparece solo
            html += `concurre <strong>${toSafeString(abogadoConCartaPoder.nombres).toUpperCase()}</strong>, con ${renderDatosPersonales(abogadoConCartaPoder)}, actuando en su carácter de <strong>REPRESENTANTE LEGAL</strong> de <strong>${toSafeString(denunciantePrincipal.nombres).toUpperCase()}</strong>, con ${toSafeString(denunciantePrincipal.tipoDocumento || 'Cédula de Identidad Paraguaya')} número <strong>${toSafeString(denunciantePrincipal.numeroDocumento)}</strong>`;

            if (abogadoConCartaPoder.con_carta_poder) {
                html += `, conforme a <strong>CARTA PODER</strong>`;
                if (abogadoConCartaPoder.carta_poder_numero) html += ` N° ${abogadoConCartaPoder.carta_poder_numero}`;
                if (abogadoConCartaPoder.carta_poder_fecha) html += ` de fecha ${formatFecha(abogadoConCartaPoder.carta_poder_fecha)}`;
                if (abogadoConCartaPoder.carta_poder_notario) html += ` ante el Escribano ${abogadoConCartaPoder.carta_poder_notario.toUpperCase()}`;
            }
            html += `, y expone cuanto sigue:`;

        } else if (!abogadoConCartaPoder && coDenunciantes.length === 0 && abogado) {
            // CASO ESPECIAL: 1 Denunciante + 1 Abogado Asistente (Singular)
            html += `concurre <strong>${toSafeString(denunciantePrincipal.nombres).toUpperCase()}</strong>, con ${renderDatosPersonales({
                nombres: denunciantePrincipal.nombres,
                cedula: denunciantePrincipal.numeroDocumento,
                tipo_documento: denunciantePrincipal.tipoDocumento,
                nacionalidad: denunciantePrincipal.nacionalidad,
                estado_civil: denunciantePrincipal.estadoCivil,
                edad: denunciantePrincipal.edad,
                fecha_nacimiento: denunciantePrincipal.fechaNacimiento,
                lugar_nacimiento: denunciantePrincipal.lugarNacimiento,
                domicilio: denunciantePrincipal.domicilio,
                profesion: denunciantePrincipal.profesion,
                telefono: denunciantePrincipal.telefono
            })}`;

            html += `; con la asistencia técnica de <strong>${toSafeString(abogado.nombres).toUpperCase()}</strong>, en su carácter de <strong>ABOGADO ASISTENTE </strong>`;
            if (abogado.matricula) html += `, matrícula N° <strong>${toSafeString(abogado.matricula)}</strong>`;
            html += `, con ${renderDatosPersonales(abogado)}`;

            html += `, y expone cuanto sigue:`;

        } else if (totalComparecientes > 1) {
            // CASO 2: Múltiples comparecientes
            html += `concurren los ciudadanos: <strong>${toSafeString(denunciantePrincipal.nombres).toUpperCase()}</strong>, con ${renderDatosPersonales({
                nombres: denunciantePrincipal.nombres,
                cedula: denunciantePrincipal.numeroDocumento,
                tipo_documento: denunciantePrincipal.tipoDocumento,
                nacionalidad: denunciantePrincipal.nacionalidad,
                estado_civil: denunciantePrincipal.estadoCivil,
                edad: denunciantePrincipal.edad,
                fecha_nacimiento: denunciantePrincipal.fechaNacimiento,
                lugar_nacimiento: denunciantePrincipal.lugarNacimiento,
                domicilio: denunciantePrincipal.domicilio,
                profesion: denunciantePrincipal.profesion,
                telefono: denunciantePrincipal.telefono
            })}`;

            coDenunciantes.forEach((cd: any) => {
                html += `; asimismo <strong>${toSafeString(cd.nombres).toUpperCase()}</strong>, con ${renderDatosPersonales(cd)}`;
            });

            if (abogado) {
                html += `; con la asistencia técnica de <strong>${toSafeString(abogado.nombres).toUpperCase()}</strong>, en su carácter de <strong>ABOGADO ASISTENTE </strong>`;
                if (abogado.matricula) html += `, matrícula N° <strong>${toSafeString(abogado.matricula)}</strong>`;
                html += `, con ${renderDatosPersonales(abogado)}`;
            }

            if (abogadoConCartaPoder) {
                html += `; y <strong>${toSafeString(abogadoConCartaPoder.nombres).toUpperCase()}</strong>, en su carácter de <strong>REPRESENTANTE LEGAL</strong> de <strong>${toSafeString(denunciantePrincipal.nombres).toUpperCase()}</strong>`;
                if (abogadoConCartaPoder.matricula) html += `, matrícula N° <strong>${toSafeString(abogadoConCartaPoder.matricula)}</strong>`;
                html += `, con ${renderDatosPersonales(abogadoConCartaPoder)}`;

                if (abogadoConCartaPoder.con_carta_poder) {
                    html += `, conforme a <strong>CARTA PODER</strong>`;
                    if (abogadoConCartaPoder.carta_poder_numero) html += ` N° ${abogadoConCartaPoder.carta_poder_numero}`;
                    if (abogadoConCartaPoder.carta_poder_fecha) html += ` de fecha ${formatFecha(abogadoConCartaPoder.carta_poder_fecha)}`;
                    if (abogadoConCartaPoder.carta_poder_notario) html += ` ante el Escribano ${abogadoConCartaPoder.carta_poder_notario.toUpperCase()}`;
                }
            }

            html += `, quienes de común acuerdo exponen cuanto sigue:`;
        } else {
            // CASO 3: Simple
            html += `concurre <strong>${toSafeString(denunciantePrincipal.nombres).toUpperCase()}</strong>, con ${renderDatosPersonales({
                nombres: denunciantePrincipal.nombres,
                cedula: denunciantePrincipal.numeroDocumento,
                tipo_documento: denunciantePrincipal.tipoDocumento,
                nacionalidad: denunciantePrincipal.nacionalidad,
                estado_civil: denunciantePrincipal.estadoCivil,
                edad: denunciantePrincipal.edad,
                fecha_nacimiento: denunciantePrincipal.fechaNacimiento,
                lugar_nacimiento: denunciantePrincipal.lugarNacimiento,
                domicilio: denunciantePrincipal.domicilio,
                profesion: denunciantePrincipal.profesion,
                telefono: denunciantePrincipal.telefono
            })}, y expone cuanto sigue:`;
        }

        html += `</p>`;

        // CASO: Segundo Párrafo (Hecho, Fecha y Lugar)
        const tipoBase = toSafeString(denuncia.tipoDenuncia);
        const capitulo = obtenerCapitulo(tipoBase);

        let crimeType = '';
        if (capitulo) {
            crimeType = capitulo.toUpperCase();
        } else {
            crimeType = tipoBase.toUpperCase();
        }

        const dateText = denuncia.usarRango && denuncia.fechaHechoFin
            ? `entre la fecha <strong>${formatFecha(denuncia.fechaHecho)}</strong> siendo las <strong>${toSafeString(denuncia.horaHecho)}</strong> aproximadamente y la fecha <strong>${formatFecha(denuncia.fechaHechoFin)}</strong> siendo las <strong>${toSafeString(denuncia.horaHechoFin)}</strong> aproximadamente`
            : `en fecha <strong>${formatFecha(denuncia.fechaHecho)}</strong> siendo las <strong>${toSafeString(denuncia.horaHecho)}</strong> aproximadamente`;

        const locationText = denuncia.lugarHechoNoAplica
            ? 'en dirección <strong>NO APLICA</strong>'
            : `en la dirección <strong>${toSafeString(denuncia.lugarHecho).toUpperCase()}</strong>`;

        html += `<p class="text-justify mb-4">Que por la presente viene a realizar una denuncia sobre un supuesto <strong>HECHO PUNIBLE CONTRA ${crimeType}</strong>, ocurrido ${dateText}, ${locationText}.</p>`;

        // Agregar relato
        if (denuncia.relato) {
            html += `<p class="mb-4 text-justify whitespace-pre-wrap">${denuncia.relato}</p>`;
        }

        // Agregar datos del autor si existe
        if (body.autor && body.autor.conocido === 'Conocido') {
            html += `<p class="mb-4"><strong>DATOS DEL SUPUESTO AUTOR:</strong> ${body.autor.nombre}, con C.I. N° ${body.autor.cedula || 'No especifica'}.</p>`;
        } else if (body.autor && body.autor.conocido === 'Desconocido' && body.descripcionFisica) {
            // Intentar parsear si es JSON
            let desc = body.descripcionFisica;
            try {
                const jsonDesc = JSON.parse(desc);
                // Convertir objeto descripción a texto legible (simplificado)
                const partes = [];
                if (jsonDesc.altura) partes.push(`Altura: ${jsonDesc.altura}`);
                if (jsonDesc.complexion) partes.push(`Complexión: ${jsonDesc.complexion}`);
                if (partes.length > 0) desc = partes.join(', ');
            } catch (e) {
                // Es texto plano o ya formateado
            }
            html += `<p class="mb-4"><strong>DESCRIPCIÓN FÍSICA DEL SUPUESTO AUTOR:</strong> ${desc}</p>`;
        }

        return NextResponse.json({ texto: html });

    } catch (error) {
        console.error('Error generando vista previa de texto:', error);
        return NextResponse.json(
            { error: 'Error generando vista previa' },
            { status: 500 }
        );
    }
}
