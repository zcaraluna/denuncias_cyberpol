import bcrypt from 'bcryptjs';
import pool from './db';

export interface Usuario {
  id: number;
  usuario: string;
  nombre: string;
  apellido: string;
  grado: string;
  oficina: string;
  rol: string;
}

export async function verificarCredenciales(
  usuario: string,
  contraseña: string
): Promise<Usuario | null> {
  try {
    const result = await pool.query(
      'SELECT id, usuario, contraseña, nombre, apellido, grado, oficina, rol, activo FROM usuarios WHERE usuario = $1',
      [usuario]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    if (!user.activo) {
      return null;
    }

    const contraseñaValida = await bcrypt.compare(contraseña, user.contraseña);

    if (!contraseñaValida) {
      return null;
    }

    return {
      id: user.id,
      usuario: user.usuario,
      nombre: user.nombre,
      apellido: user.apellido,
      grado: user.grado,
      oficina: user.oficina,
      rol: user.rol,
    };
  } catch (error) {
    console.error('Error verificando credenciales:', error);
    return null;
  }
}

export async function crearUsuario(
  usuario: string,
  contraseña: string,
  nombre: string,
  apellido: string,
  grado: string,
  oficina: string,
  rol: string = 'operador'
): Promise<boolean> {
  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    
    await pool.query(
      'INSERT INTO usuarios (usuario, contraseña, nombre, apellido, grado, oficina, rol) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [usuario, hashedPassword, nombre, apellido, grado, oficina, rol]
    );

    return true;
  } catch (error) {
    console.error('Error creando usuario:', error);
    return false;
  }
}

/**
 * Genera un fingerprint único para un dispositivo basado en user agent y otras características
 */
export function generarFingerprint(userAgent: string): string {
  // Usar crypto para generar un hash del user agent
  // En producción, podrías agregar más características como screen resolution, timezone, etc.
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(userAgent).digest('hex');
}

/**
 * Valida un código de activación y lo marca como usado
 */
export async function validarCodigoActivacion(
  codigo: string,
  fingerprint: string,
  userAgent: string,
  ipAddress?: string
): Promise<{ valido: boolean; mensaje?: string }> {
  try {
    // Normalizar el código ingresado (eliminar guiones y convertir a mayúsculas)
    const codigoNormalizado = codigo.replace(/-/g, '').toUpperCase();
    
    // Buscar el código normalizando ambos lados (código en BD puede tener guiones)
    const result = await pool.query(
      `SELECT id, usado, expira_en, codigo 
       FROM codigos_activacion 
       WHERE REPLACE(UPPER(codigo), '-', '') = $1`,
      [codigoNormalizado]
    );

    if (result.rows.length === 0) {
      return { valido: false, mensaje: 'Código de activación inválido' };
    }

    const codigoActivacion = result.rows[0];

    // Verificar si ya fue usado
    if (codigoActivacion.usado) {
      return { valido: false, mensaje: 'Este código ya fue utilizado' };
    }

    // Verificar expiración
    if (codigoActivacion.expira_en && new Date(codigoActivacion.expira_en) < new Date()) {
      return { valido: false, mensaje: 'Este código ha expirado' };
    }

    // Verificar si el dispositivo ya está autorizado
    const dispositivoExistente = await pool.query(
      'SELECT id FROM dispositivos_autorizados WHERE fingerprint = $1 AND activo = TRUE',
      [fingerprint]
    );

    if (dispositivoExistente.rows.length > 0) {
      return { valido: false, mensaje: 'Este dispositivo ya está autorizado' };
    }

    // Marcar código como usado y registrar dispositivo
    await pool.query('BEGIN');

    try {
      // Marcar código como usado
      await pool.query(
        'UPDATE codigos_activacion SET usado = TRUE, usado_en = CURRENT_TIMESTAMP, dispositivo_fingerprint = $1 WHERE id = $2',
        [fingerprint, codigoActivacion.id]
      );

      // Registrar dispositivo autorizado
      await pool.query(
        'INSERT INTO dispositivos_autorizados (fingerprint, user_agent, ip_address, codigo_activacion_id) VALUES ($1, $2, $3, $4)',
        [fingerprint, userAgent, ipAddress || null, codigoActivacion.id]
      );

      await pool.query('COMMIT');
      return { valido: true };
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error validando código de activación:', error);
    return { valido: false, mensaje: 'Error del servidor al validar el código' };
  }
}

/**
 * Verifica si un dispositivo está autorizado
 */
export async function verificarDispositivoAutorizado(
  fingerprint: string
): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT id FROM dispositivos_autorizados WHERE fingerprint = $1 AND activo = TRUE',
      [fingerprint]
    );

    if (result.rows.length > 0) {
      // Actualizar último acceso
      await pool.query(
        'UPDATE dispositivos_autorizados SET ultimo_acceso = CURRENT_TIMESTAMP WHERE fingerprint = $1',
        [fingerprint]
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verificando dispositivo autorizado:', error);
    return false;
  }
}

/**
 * Genera un código de activación nuevo
 */
export async function generarCodigoActivacion(
  diasExpiracion: number = 30
): Promise<string> {
  try {
    const crypto = require('crypto');
    // Generar código aleatorio seguro de 32 caracteres
    const codigo = crypto.randomBytes(16).toString('hex').toUpperCase();

    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + diasExpiracion);

    await pool.query(
      'INSERT INTO codigos_activacion (codigo, expira_en) VALUES ($1, $2)',
      [codigo, fechaExpiracion]
    );

    return codigo;
  } catch (error) {
    console.error('Error generando código de activación:', error);
    throw error;
  }
}

