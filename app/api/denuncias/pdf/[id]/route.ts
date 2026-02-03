import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateDenunciaPDF } from '@/components/pdf/DenunciaPDF';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log('[PDF] ===== INICIANDO GENERACIÓN DE PDF =====');

        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const { searchParams } = new URL(request.url);
        const tipo = searchParams.get('tipo') || 'oficio';

        console.log(`[PDF] ID de denuncia: ${id}, Tipo de papel: ${tipo}`);

        // Obtener datos completos de la denuncia
        console.log('[PDF] Consultando datos de denuncia en la base de datos...');
        const denunciaResult = await pool.query(
            `SELECT 
        d.*,
        den.nombres as nombres_denunciante,
        den.cedula,
        den.tipo_documento,
        den.nacionalidad,
        den.estado_civil,
        den.edad,
        den.fecha_nacimiento,
        den.lugar_nacimiento,
        den.domicilio,
        den.telefono,
        den.correo,
        den.profesion,
        den.matricula
      FROM denuncias d
      INNER JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.id = $1 AND d.estado = 'completada'`,
            [id]
        );

        if (denunciaResult.rows.length === 0) {
            console.log('[PDF] ❌ Denuncia no encontrada o no completada');
            return NextResponse.json(
                { error: 'Denuncia no encontrada o no completada' },
                { status: 404 }
            );
        }

        const denuncia = denunciaResult.rows[0];
        console.log(`[PDF] ✅ Denuncia encontrada: Orden ${denuncia.orden}, Hash: ${denuncia.hash}`);

        // Obtener supuestos autores
        console.log('[PDF] Consultando supuestos autores...');
        const autoresResult = await pool.query(
            `SELECT * FROM supuestos_autores WHERE denuncia_id = $1`,
            [id]
        );
        console.log(`[PDF] ✅ Encontrados ${autoresResult.rows.length} supuestos autores`);

        // Preparar datos para el PDF
        console.log('[PDF] Preparando estructura de datos para el PDF...');
        const denunciaData = {
            orden: denuncia.orden,
            hash: denuncia.hash,
            fecha_denuncia: denuncia.fecha_denuncia,
            hora_denuncia: denuncia.hora_denuncia,
            fecha_hecho: denuncia.fecha_hecho,
            hora_hecho: denuncia.hora_hecho,
            tipo_denuncia: denuncia.tipo_denuncia,
            otro_tipo: denuncia.otro_tipo,
            relato: denuncia.relato,
            lugar_hecho: denuncia.lugar_hecho,
            latitud: denuncia.latitud,
            longitud: denuncia.longitud,
            monto_dano: denuncia.monto_dano,
            moneda: denuncia.moneda,
            nombres_denunciante: denuncia.nombres_denunciante,
            cedula: denuncia.cedula,
            tipo_documento: denuncia.tipo_documento,
            nacionalidad: denuncia.nacionalidad,
            estado_civil: denuncia.estado_civil,
            edad: denuncia.edad,
            fecha_nacimiento: denuncia.fecha_nacimiento,
            lugar_nacimiento: denuncia.lugar_nacimiento,
            domicilio: denuncia.domicilio,
            telefono: denuncia.telefono,
            correo: denuncia.correo,
            profesion: denuncia.profesion,
            supuestos_autores: autoresResult.rows,
        };
        console.log('[PDF] ✅ Datos preparados correctamente');

        // Determinar el tamaño de página
        const pageSize = tipo === 'a4' ? 'A4' : 'LETTER';
        console.log(`[PDF] Tamaño de página seleccionado: ${pageSize}`);

        // Generar el PDF usando la función helper
        console.log('[PDF] 🔄 Llamando a generateDenunciaPDF()...');
        const pdfBuffer = await generateDenunciaPDF(denunciaData, pageSize as 'A4' | 'LETTER');
        console.log(`[PDF] ✅ PDF generado exitosamente! Tamaño: ${pdfBuffer.length} bytes`);

        // Convertir Buffer a Uint8Array para NextResponse
        const uint8Array = new Uint8Array(pdfBuffer);
        console.log('[PDF] ✅ Buffer convertido a Uint8Array');

        // Retornar el PDF
        const filename = `denuncia_${denuncia.orden}_${new Date().toISOString().split('T')[0]}.pdf`;
        console.log(`[PDF] 📤 Enviando PDF al cliente: ${filename}`);
        console.log('[PDF] ===== PDF GENERADO EXITOSAMENTE =====');

        return new NextResponse(uint8Array, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        // Log detallado del error
        console.error('[PDF] ===== ❌ ERROR GENERANDO PDF =====');
        console.error('[PDF] Tipo de error:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('[PDF] Mensaje de error:', error instanceof Error ? error.message : String(error));

        if (error instanceof Error) {
            console.error('[PDF] Stack trace completo:');
            console.error(error.stack);

            // Log adicional del error en formato JSON
            console.error('[PDF] Detalles del error (JSON):');
            console.error(JSON.stringify({
                name: error.name,
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 5), // Primeras 5 líneas del stack
            }, null, 2));
        } else {
            console.error('[PDF] Error no es una instancia de Error:', error);
        }

        console.error('[PDF] ===== FIN DEL LOG DE ERROR =====');

        // Retornar error con detalles
        return NextResponse.json(
            {
                error: 'Error al generar PDF',
                details: error instanceof Error ? error.message : String(error),
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
