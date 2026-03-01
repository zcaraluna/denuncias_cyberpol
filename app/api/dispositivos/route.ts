import { NextRequest, NextResponse } from 'next/server';
import { obtenerDispositivosAutorizados, obtenerCodigosActivacion, desactivarDispositivo, desactivarCodigoActivacion, generarCodigoActivacion } from '@/lib/auth';

// GET: Obtener todos los dispositivos y códigos
export async function GET(request: NextRequest) {
  try {
    // Obtener usuario desde query params (el cliente lo envía)
    const usuarioId = request.nextUrl.searchParams.get('usuario_id');
    const usuarioRol = request.nextUrl.searchParams.get('usuario_rol');

    // Verificar que sea superadmin
    if (!usuarioRol || usuarioRol !== 'superadmin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo superadmin puede acceder.' },
        { status: 403 }
      );
    }

    const [dispositivos, codigos] = await Promise.all([
      obtenerDispositivosAutorizados(),
      obtenerCodigosActivacion(),
    ]);

    // Calcular días restantes para códigos no usados
    const codigosConDiasRestantes = codigos.map((codigo: any) => {
      let diasRestantes = null;
      if (!codigo.usado && codigo.expira_en) {
        const fechaExpiracion = new Date(codigo.expira_en);
        const ahora = new Date();
        const diferencia = fechaExpiracion.getTime() - ahora.getTime();
        diasRestantes = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
      }
      return {
        ...codigo,
        dias_restantes: diasRestantes,
        esta_expirado: codigo.expira_en ? new Date(codigo.expira_en) < new Date() : false,
      };
    });

    return NextResponse.json({
      dispositivos,
      codigos: codigosConDiasRestantes,
    });
  } catch (error) {
    console.error('Error obteniendo dispositivos y códigos:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

// POST: Desactivar dispositivo o código
export async function POST(request: NextRequest) {
  try {
    const { tipo, id, usuario_rol } = await request.json();

    // Verificar que sea superadmin
    if (!usuario_rol || usuario_rol !== 'superadmin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo superadmin puede acceder.' },
        { status: 403 }
      );
    }

    if (!tipo || !id) {
      return NextResponse.json(
        { error: 'Tipo e ID son requeridos' },
        { status: 400 }
      );
    }

    let resultado = false;
    let data_adicional = {};

    if (tipo === 'dispositivo') {
      resultado = await desactivarDispositivo(id);
    } else if (tipo === 'codigo') {
      resultado = await desactivarCodigoActivacion(id);
    } else if (tipo === 'generar_codigo') {
      // id actúa como el nombre opcional
      const nuevoCodigo = await generarCodigoActivacion(30, id || 'ADMIN_GEN');
      resultado = !!nuevoCodigo;
      data_adicional = { codigo: nuevoCodigo };
    } else {
      return NextResponse.json(
        { error: 'Tipo inválido' },
        { status: 400 }
      );
    }

    if (resultado) {
      return NextResponse.json({ success: true, ...data_adicional });
    } else {
      return NextResponse.json(
        { error: 'Error al procesar solicitud' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error desactivando:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

