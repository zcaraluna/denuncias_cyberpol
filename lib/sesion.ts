import crypto from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * Manejo centralizado y firmado de la cookie de sesión (`usuario_sesion`).
 *
 * La cookie contiene la identidad y el rol del usuario. Para evitar la
 * manipulación desde el cliente (p. ej. cambiar `rol` a "developer" o alterar
 * `oficina`), el valor se firma con HMAC-SHA256. Cualquier endpoint que confíe
 * en el rol/oficina del usuario DEBE leer la sesión con `leerSesion()` en lugar
 * de parsear la cookie directamente.
 *
 * Formato del valor: `<base64url(json)>.<base64url(hmac)>`
 */

export const COOKIE_SESION = 'usuario_sesion'
export const MAX_EDAD_SESION = 7 * 24 * 60 * 60 // 7 días en segundos

export interface SesionUsuario {
  id: number
  usuario: string
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
  debe_cambiar_contraseña?: boolean
}

// El secreto de firma proviene de SESSION_SECRET. Como respaldo (para no dejar
// el sistema sin firma si la variable no está configurada) se deriva de
// DATABASE_URL, que siempre está presente. Se recomienda definir SESSION_SECRET
// de forma explícita en producción.
function obtenerSecreto(): string {
  const secreto = process.env.SESSION_SECRET || process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!secreto) {
    throw new Error('No hay secreto disponible para firmar la sesión (defina SESSION_SECRET)')
  }
  return secreto
}

function base64url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function firmarPayload(payloadB64: string): string {
  return base64url(crypto.createHmac('sha256', obtenerSecreto()).update(payloadB64).digest())
}

/**
 * Construye el valor firmado de la cookie de sesión a partir del usuario.
 */
export function firmarSesion(usuario: SesionUsuario): string {
  const payload: SesionUsuario = {
    id: usuario.id,
    usuario: usuario.usuario,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    grado: usuario.grado,
    oficina: usuario.oficina,
    rol: usuario.rol,
    debe_cambiar_contraseña: usuario.debe_cambiar_contraseña ?? false,
  }
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload), 'utf8'))
  return `${payloadB64}.${firmarPayload(payloadB64)}`
}

/**
 * Verifica y decodifica un valor firmado de sesión. Devuelve null si la firma
 * no es válida o el formato es incorrecto (incluye el formato antiguo sin firma).
 */
export function verificarValorSesion(valor: string | undefined | null): SesionUsuario | null {
  if (!valor) return null
  const partes = valor.split('.')
  if (partes.length !== 2) return null

  const [payloadB64, firmaRecibida] = partes
  const firmaEsperada = firmarPayload(payloadB64)

  // Comparación en tiempo constante para evitar ataques de temporización.
  const bufRecibida = Buffer.from(firmaRecibida)
  const bufEsperada = Buffer.from(firmaEsperada)
  if (bufRecibida.length !== bufEsperada.length) return null
  if (!crypto.timingSafeEqual(bufRecibida, bufEsperada)) return null

  try {
    const jsonStr = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const usuario = JSON.parse(jsonStr)
    if (!usuario || typeof usuario.id !== 'number' || typeof usuario.rol !== 'string') return null
    return usuario as SesionUsuario
  } catch {
    return null
  }
}

/**
 * Lee y verifica la sesión desde la cookie de la petición. Devuelve null si no
 * hay sesión válida (no autenticado o cookie manipulada/antigua).
 */
export function leerSesion(request: NextRequest): SesionUsuario | null {
  return verificarValorSesion(request.cookies.get(COOKIE_SESION)?.value)
}

/**
 * Opciones estándar de la cookie de sesión.
 */
export function opcionesCookieSesion() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: MAX_EDAD_SESION,
    path: '/',
  }
}
