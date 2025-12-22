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
      `SELECT id, usado, expira_en, codigo, nombre, activo 
       FROM codigos_activacion 
       WHERE REPLACE(UPPER(codigo), '-', '') = $1`,
      [codigoNormalizado]
    );

    if (result.rows.length === 0) {
      return { valido: false, mensaje: 'Código de activación inválido' };
    }

    const codigoActivacion = result.rows[0];

    // Verificar si el código está activo
    if (codigoActivacion.activo === false) {
      return { valido: false, mensaje: 'Este código ha sido desactivado' };
    }

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

    // Marcar código como usado y registrar/actualizar dispositivo
    await pool.query('BEGIN');

    try {
      // Marcar código como usado
      await pool.query(
        'UPDATE codigos_activacion SET usado = TRUE, usado_en = CURRENT_TIMESTAMP, dispositivo_fingerprint = $1 WHERE id = $2',
        [fingerprint, codigoActivacion.id]
      );

      if (dispositivoExistente.rows.length > 0) {
        // Dispositivo ya existe, actualizar su información (reautorización)
        await pool.query(
          `UPDATE dispositivos_autorizados 
           SET user_agent = $1, 
               ip_address = $2, 
               codigo_activacion_id = $3, 
               nombre = COALESCE($4, nombre),
               autorizado_en = CURRENT_TIMESTAMP,
               ultimo_acceso = CURRENT_TIMESTAMP,
               activo = TRUE
           WHERE fingerprint = $5`,
          [userAgent, ipAddress || null, codigoActivacion.id, codigoActivacion.nombre || null, fingerprint]
        );
      } else {
        // Nuevo dispositivo, insertarlo
        await pool.query(
          'INSERT INTO dispositivos_autorizados (fingerprint, user_agent, ip_address, codigo_activacion_id, nombre) VALUES ($1, $2, $3, $4, $5)',
          [fingerprint, userAgent, ipAddress || null, codigoActivacion.id, codigoActivacion.nombre || null]
        );
      }

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
  diasExpiracion: number = 30,
  nombre?: string
): Promise<string> {
  try {
    const crypto = require('crypto');
    // Generar código aleatorio seguro de 32 caracteres
    const codigo = crypto.randomBytes(16).toString('hex').toUpperCase();

    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + diasExpiracion);

    await pool.query(
      'INSERT INTO codigos_activacion (codigo, expira_en, nombre) VALUES ($1, $2, $3)',
      [codigo, fechaExpiracion, nombre || null]
    );

    return codigo;
  } catch (error) {
    console.error('Error generando código de activación:', error);
    throw error;
  }
}

/**
 * Desactiva un código de activación
 */
export async function desactivarCodigoActivacion(codigoId: number): Promise<boolean> {
  try {
    await pool.query(
      'UPDATE codigos_activacion SET activo = FALSE WHERE id = $1',
      [codigoId]
    );
    return true;
  } catch (error) {
    console.error('Error desactivando código de activación:', error);
    return false;
  }
}

/**
 * Desactiva un dispositivo autorizado
 */
export async function desactivarDispositivo(dispositivoId: number): Promise<boolean> {
  try {
    await pool.query(
      'UPDATE dispositivos_autorizados SET activo = FALSE WHERE id = $1',
      [dispositivoId]
    );
    return true;
  } catch (error) {
    console.error('Error desactivando dispositivo:', error);
    return false;
  }
}

/**
 * Obtiene todos los dispositivos autorizados
 */
export async function obtenerDispositivosAutorizados() {
  try {
    const result = await pool.query(`
      SELECT 
        d.id,
        d.fingerprint,
        d.nombre,
        d.user_agent,
        d.ip_address,
        d.autorizado_en,
        d.ultimo_acceso,
        d.activo,
        c.codigo as codigo_activacion,
        c.usado as codigo_usado,
        c.expira_en as codigo_expira_en,
        c.activo as codigo_activo
      FROM dispositivos_autorizados d
      LEFT JOIN codigos_activacion c ON d.codigo_activacion_id = c.id
      ORDER BY d.autorizado_en DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error obteniendo dispositivos autorizados:', error);
    throw error;
  }
}

/**
 * Obtiene todos los códigos de activación
 */
export async function obtenerCodigosActivacion() {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        codigo,
        nombre,
        usado,
        usado_en,
        dispositivo_fingerprint,
        creado_en,
        expira_en,
        activo
      FROM codigos_activacion
      ORDER BY creado_en DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error obteniendo códigos de activación:', error);
    throw error;
  }
}

