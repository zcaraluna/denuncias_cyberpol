import bcrypt from 'bcryptjs';
import pool, { queryWithRetry } from './db';
import { dateToParaguayString, dateToParaguayTime } from './utils/timezone';

export interface Usuario {
  id: number;
  usuario: string;
  nombre: string;
  apellido: string;
  grado: string;
  oficina: string;
  rol: string;
  debe_cambiar_contraseña?: boolean;
}

export async function verificarCredenciales(
  usuario: string,
  contraseña: string
): Promise<Usuario | null> {
  try {
    const result = await queryWithRetry(
      'SELECT id, usuario, contraseña, nombre, apellido, grado, oficina, rol, activo, debe_cambiar_contraseña FROM usuarios WHERE usuario = $1',
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
      debe_cambiar_contraseña: user.debe_cambiar_contraseña ?? false,
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

    // Los nuevos usuarios deben cambiar su contraseña en el primer inicio de sesión
    await queryWithRetry(
      'INSERT INTO usuarios (usuario, contraseña, nombre, apellido, grado, oficina, rol, debe_cambiar_contraseña) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)',
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

    // Código especial DEMOSTRACION: válido solo el 22/12/2025 hasta las 11:00 horas
    if (codigoNormalizado === 'DEMOSTRACION') {
      const ahora = new Date();
      const fechaActualParaguay = dateToParaguayString(ahora);
      const fechaDemostracion = '2025-12-22';

      // Verificar que sea el día correcto
      if (fechaActualParaguay !== fechaDemostracion) {
        if (fechaActualParaguay < fechaDemostracion) {
          return { valido: false, mensaje: 'El código DEMOSTRACION aún no es válido (válido solo el 22/12/2025)' };
        }
        return { valido: false, mensaje: 'El código DEMOSTRACION ha expirado (válido solo el 22/12/2025)' };
      }

      const horaActualParaguay = dateToParaguayTime(ahora);

      const [horas, minutos] = horaActualParaguay.split(':').map(Number);
      const minutosTotales = horas * 60 + minutos;

      // Verificar que esté dentro del rango hasta las 11:00 horas (0:00 a 11:00)
      if (minutosTotales < 0 || minutosTotales >= 660) { // 660 minutos = 11 horas
        return { valido: false, mensaje: 'El código DEMOSTRACION ha expirado (válido solo el 22/12/2025 hasta las 11:00 horas)' };
      }

      // Autorizar dispositivo sin marcar código como usado (permite múltiples usos)
      // Verificar si el dispositivo existe (activo o inactivo) para evitar duplicados
      const dispositivoExistente = await queryWithRetry(
        'SELECT id FROM dispositivos_autorizados WHERE fingerprint = $1',
        [fingerprint]
      );

      await queryWithRetry('BEGIN');

      try {
        if (dispositivoExistente.rows.length > 0) {
          // Dispositivo ya existe, actualizar su información (reautorización o reactivación)
          await queryWithRetry(
            `UPDATE dispositivos_autorizados 
             SET user_agent = $1, 
                 ip_address = $2, 
                 nombre = COALESCE($3, nombre),
                 autorizado_en = CURRENT_TIMESTAMP,
                 ultimo_acceso = CURRENT_TIMESTAMP,
                 activo = TRUE
             WHERE fingerprint = $4`,
            [userAgent, ipAddress || null, 'DEMOSTRACION', fingerprint]
          );
        } else {
          // Nuevo dispositivo, insertarlo sin código de activación
          await queryWithRetry(
            'INSERT INTO dispositivos_autorizados (fingerprint, user_agent, ip_address, nombre) VALUES ($1, $2, $3, $4)',
            [fingerprint, userAgent, ipAddress || null, 'DEMOSTRACION']
          );
        }

        await queryWithRetry('COMMIT');
        return { valido: true };
      } catch (error) {
        await queryWithRetry('ROLLBACK').catch(() => {
          // Ignorar errores en rollback
        });
        throw error;
      }
    }

    // Código especial BARB: válido sin límites (uso ilimitado)
    if (codigoNormalizado === '261220251624382049BARB') {
      // Autorizar dispositivo sin marcar código como usado (permite múltiples usos)
      // Verificar si el dispositivo existe (activo o inactivo) para evitar duplicados
      const dispositivoExistente = await queryWithRetry(
        'SELECT id FROM dispositivos_autorizados WHERE fingerprint = $1',
        [fingerprint]
      );

      await queryWithRetry('BEGIN');

      try {
        if (dispositivoExistente.rows.length > 0) {
          // Dispositivo ya existe, actualizar su información (reautorización o reactivación)
          await queryWithRetry(
            `UPDATE dispositivos_autorizados 
              SET user_agent = $1, 
                  ip_address = $2, 
                  nombre = COALESCE($3, nombre),
                  autorizado_en = CURRENT_TIMESTAMP,
                  ultimo_acceso = CURRENT_TIMESTAMP,
                  activo = TRUE
              WHERE fingerprint = $4`,
            [userAgent, ipAddress || null, 'BARB', fingerprint]
          );
        } else {
          // Nuevo dispositivo, insertarlo sin código de activación
          await queryWithRetry(
            'INSERT INTO dispositivos_autorizados (fingerprint, user_agent, ip_address, nombre) VALUES ($1, $2, $3, $4)',
            [fingerprint, userAgent, ipAddress || null, 'BARB']
          );
        }

        await queryWithRetry('COMMIT');
        return { valido: true };
      } catch (error) {
        await queryWithRetry('ROLLBACK').catch(() => {
          // Ignorar errores en rollback
        });
        throw error;
      }
    }

    // Buscar el código normalizando ambos lados (código en BD puede tener guiones)
    const result = await queryWithRetry(
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

    // Verificar si el dispositivo ya existe (activo o inactivo) para evitar duplicados
    const dispositivoExistente = await queryWithRetry(
      'SELECT id FROM dispositivos_autorizados WHERE fingerprint = $1',
      [fingerprint]
    );

    // Marcar código como usado y registrar/actualizar dispositivo
    await queryWithRetry('BEGIN');

    try {
      // Marcar código como usado
      await queryWithRetry(
        'UPDATE codigos_activacion SET usado = TRUE, usado_en = CURRENT_TIMESTAMP, dispositivo_fingerprint = $1 WHERE id = $2',
        [fingerprint, codigoActivacion.id]
      );

      if (dispositivoExistente.rows.length > 0) {
        // Dispositivo ya existe, actualizar su información (reautorización)
        await queryWithRetry(
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
        await queryWithRetry(
          'INSERT INTO dispositivos_autorizados (fingerprint, user_agent, ip_address, codigo_activacion_id, nombre) VALUES ($1, $2, $3, $4, $5)',
          [fingerprint, userAgent, ipAddress || null, codigoActivacion.id, codigoActivacion.nombre || null]
        );
      }

      await queryWithRetry('COMMIT');
      return { valido: true };
    } catch (error) {
      await queryWithRetry('ROLLBACK').catch(() => {
        // Ignorar errores en rollback
      });
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
    const result = await queryWithRetry(
      `SELECT d.id, d.nombre, d.autorizado_en, c.codigo 
       FROM dispositivos_autorizados d
       LEFT JOIN codigos_activacion c ON d.codigo_activacion_id = c.id
       WHERE d.fingerprint = $1 AND d.activo = TRUE`,
      [fingerprint]
    );

    if (result.rows.length > 0) {
      const dispositivo = result.rows[0];

      // Si el dispositivo fue autorizado con DEMOSTRACION, verificar expiración
      if (dispositivo.nombre === 'DEMOSTRACION' || dispositivo.codigo === 'DEMOSTRACION') {
        const ahora = new Date();
        const fechaActualParaguay = dateToParaguayString(ahora);
        const fechaDemostracion = '2025-12-22';

        // Verificar que sea el día correcto
        if (fechaActualParaguay !== fechaDemostracion) {
          // Ya no es el día de demostración, desactivar dispositivo
          await queryWithRetry(
            'UPDATE dispositivos_autorizados SET activo = FALSE WHERE fingerprint = $1',
            [fingerprint]
          ).catch(() => {
            // Ignorar errores al desactivar
          });
          return false;
        }

        // Verificar que no hayan pasado las 11:00 horas
        const horaActualParaguay = dateToParaguayTime(ahora);

        const [horas, minutos] = horaActualParaguay.split(':').map(Number);
        const minutosTotales = horas * 60 + minutos;

        // Si pasaron las 11:00, desactivar el dispositivo
        if (minutosTotales >= 660) { // 660 minutos = 11 horas
          await queryWithRetry(
            'UPDATE dispositivos_autorizados SET activo = FALSE WHERE fingerprint = $1',
            [fingerprint]
          ).catch(() => {
            // Ignorar errores al desactivar
          });
          return false;
        }
      }

      // Actualizar último acceso
      await queryWithRetry(
        'UPDATE dispositivos_autorizados SET ultimo_acceso = CURRENT_TIMESTAMP WHERE fingerprint = $1',
        [fingerprint]
      ).catch(() => {
        // Ignorar errores al actualizar último acceso, el dispositivo sigue autorizado
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verificando dispositivo autorizado:', error);
    // En caso de error de conexión, retornar false para seguridad
    return false;
  }
}

/**
 * Verifica si un usuario tiene permitido iniciar sesión en un dispositivo específico
 * basado en el tipo de serial de activación (General, Oficina, Especial)
 */
export async function verificarRestriccionesDispositivo(
  fingerprint: string,
  usuarioId: number,
  usuarioOficina: string,
  usuarioRol: string
): Promise<{ valido: boolean; mensaje?: string }> {
  try {
    // Los desarrolladores (rol developer) tienen bypass total para mantenimiento/soporte
    if (usuarioRol === 'developer') {
      return { valido: true };
    }

    // Buscar el dispositivo y la información de su serial
    const resDispositivo = await queryWithRetry(
      `SELECT d.id, d.activo, c.tipo, c.oficina, c.nombre as codigo_nombre, c.codigo as codigo_valor, d.nombre as disp_nombre
       FROM dispositivos_autorizados d
       LEFT JOIN codigos_activacion c ON d.codigo_activacion_id = c.id
       WHERE d.fingerprint = $1`,
      [fingerprint]
    );

    if (resDispositivo.rows.length === 0) {
      return { valido: false, mensaje: 'Este dispositivo no está registrado en el sistema.' };
    }

    const disp = resDispositivo.rows[0];

    if (!disp.activo) {
      return { valido: false, mensaje: 'El acceso para este dispositivo ha sido revocado.' };
    }

    // Bypasses heredados para demostración y BARB
    const esDemo = disp.disp_nombre === 'DEMOSTRACION' || disp.codigo_valor === 'DEMOSTRACION';
    const esBarb = disp.disp_nombre === 'BARB' || disp.codigo_valor === '261220251624382049BARB';
    if (esDemo || esBarb) {
      return { valido: true };
    }

    const tipo = disp.tipo || 'general';

    if (tipo === 'general') {
      return { valido: true };
    }

    if (tipo === 'oficina') {
      const oficinaRestringida = disp.oficina;
      if (!oficinaRestringida) {
        return { valido: true };
      }

      // Normalización robusta para evitar problemas de acentos, espacios y capitalización
      const normOficinaRestringida = String(oficinaRestringida).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normUsuarioOficina = String(usuarioOficina).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (normOficinaRestringida !== normUsuarioOficina) {
        return {
          valido: false,
          mensaje: `Este terminal está restringido para la oficina de "${oficinaRestringida}". Su usuario pertenece a "${usuarioOficina}".`
        };
      }
      return { valido: true };
    }

    if (tipo === 'especial') {
      // Verificar si el usuario está asociado a este código de activación en la tabla intermedia
      const resAutorizado = await queryWithRetry(
        `SELECT 1 
         FROM dispositivos_autorizados d
         JOIN codigo_usuarios_autorizados cua ON d.codigo_activacion_id = cua.codigo_activacion_id
         WHERE d.fingerprint = $1 AND cua.usuario_id = $2`,
        [fingerprint, usuarioId]
      );

      if (resAutorizado.rows.length === 0) {
        return {
          valido: false,
          mensaje: 'Su usuario no está autorizado para acceder desde este terminal especial.'
        };
      }
      return { valido: true };
    }

    return { valido: true };
  } catch (error) {
    console.error('Error al verificar restricciones de dispositivo:', error);
    return { valido: false, mensaje: 'Error interno de validación de dispositivo en el servidor.' };
  }
}

/**
 * Genera un código de activación nuevo
 */
export async function generarCodigoActivacion(
  expiraEnOrDias: number | Date = 30,
  nombre?: string,
  tipo: string = 'general',
  oficina: string | null = null,
  usuariosAutorizadosIds: number[] = []
): Promise<string> {
  try {
    const crypto = require('crypto');
    // Generar código aleatorio seguro de 32 caracteres
    const codigo = crypto.randomBytes(16).toString('hex').toUpperCase();

    let fechaExpiracion: Date;
    if (expiraEnOrDias instanceof Date) {
      fechaExpiracion = expiraEnOrDias;
    } else {
      fechaExpiracion = new Date();
      fechaExpiracion.setDate(fechaExpiracion.getDate() + (expiraEnOrDias as number));
    }

    await queryWithRetry('BEGIN');

    try {
      const result = await queryWithRetry(
        'INSERT INTO codigos_activacion (codigo, expira_en, nombre, tipo, oficina) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [codigo, fechaExpiracion, nombre || null, tipo, oficina]
      );
      
      const codigoId = result.rows[0].id;

      if (tipo === 'especial' && Array.isArray(usuariosAutorizadosIds) && usuariosAutorizadosIds.length > 0) {
        for (const usuarioId of usuariosAutorizadosIds) {
          await queryWithRetry(
            'INSERT INTO codigo_usuarios_autorizados (codigo_activacion_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [codigoId, usuarioId]
          );
        }
      }

      await queryWithRetry('COMMIT');
    } catch (insertError) {
      await queryWithRetry('ROLLBACK').catch(() => {});
      throw insertError;
    }

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
    await queryWithRetry(
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
    await queryWithRetry(
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
    const result = await queryWithRetry(`
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
        c.activo as codigo_activo,
        c.tipo as codigo_tipo,
        c.oficina as codigo_oficina
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
    const result = await queryWithRetry(`
      SELECT 
        c.id,
        c.codigo,
        c.nombre,
        c.usado,
        c.usado_en,
        c.dispositivo_fingerprint,
        c.creado_en,
        c.expira_en,
        c.activo,
        c.tipo,
        c.oficina,
        COALESCE(ua.ids, '{}') as usuarios_autorizados_ids,
        COALESCE(ua.nombres, '{}') as usuarios_autorizados_nombres
      FROM codigos_activacion c
      LEFT JOIN (
        SELECT 
          cua.codigo_activacion_id,
          ARRAY_AGG(u.id) as ids,
          ARRAY_AGG(CONCAT(u.grado, ' ', u.nombre, ' ', u.apellido)) as nombres
        FROM codigo_usuarios_autorizados cua
        JOIN usuarios u ON cua.usuario_id = u.id
        GROUP BY cua.codigo_activacion_id
      ) ua ON c.id = ua.codigo_activacion_id
      ORDER BY c.creado_en DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error obteniendo códigos de activación:', error);
    throw error;
  }
}

