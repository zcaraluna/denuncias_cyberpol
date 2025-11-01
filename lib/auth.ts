import bcrypt from 'bcryptjs';
import pool from './db';

export interface Usuario {
  id: number;
  usuario: string;
  nombre: string;
  apellido: string;
  grado: string;
  oficina: string;
}

export async function verificarCredenciales(
  usuario: string,
  contraseña: string
): Promise<Usuario | null> {
  try {
    const result = await pool.query(
      'SELECT id, usuario, contraseña, nombre, apellido, grado, oficina, activo FROM usuarios WHERE usuario = $1',
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
  oficina: string
): Promise<boolean> {
  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    
    await pool.query(
      'INSERT INTO usuarios (usuario, contraseña, nombre, apellido, grado, oficina) VALUES ($1, $2, $3, $4, $5, $6)',
      [usuario, hashedPassword, nombre, apellido, grado, oficina]
    );

    return true;
  } catch (error) {
    console.error('Error creando usuario:', error);
    return false;
  }
}

