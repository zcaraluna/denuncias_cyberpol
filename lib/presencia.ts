import { EventEmitter } from 'events'

/**
 * Registro de PRESENCIA EN TIEMPO REAL de operadores tomando denuncias.
 *
 * Se mantiene EN MEMORIA (no toca la base de datos) porque la presencia es
 * información efímera y de alta frecuencia: guardarla en la BD invaluable no
 * aportaría valor y sí generaría escrituras constantes. El despliegue corre como
 * una única instancia (PM2 `fork`), por lo que un singleton en memoria es
 * suficiente y coherente. Si el proceso se reinicia, la presencia se reconstruye
 * sola en segundos a partir de los heartbeats de los operadores activos.
 *
 * Los cambios se difunden por un EventEmitter para permitir push inmediato (SSE)
 * al panel del desarrollador, sin polling y sin delay perceptible.
 */

export interface PresenciaOperador {
  usuarioId: number
  usuario: string
  nombre: string
  apellido: string
  grado: string
  oficina: string
  paso: number
  pasoLabel: string
  tipoFormulario: string | null
  borradorId: number | null
  /** Hora de la denuncia capturada al iniciar (HH:MM). */
  horaInicio: string | null
  /** Fecha de la denuncia capturada al iniciar (formato libre del cliente). */
  fechaInicio: string | null
  /** Epoch ms en que el operador comenzó a ser visto en esta sesión de carga. */
  inicioEn: number
  /** Epoch ms del último heartbeat recibido. */
  actualizadoEn: number
}

/** Milisegundos sin heartbeat tras los cuales se considera que el operador ya no está activo. */
export const TTL_PRESENCIA_MS = 15_000

// Singleton resistente a hot-reload (dev) y a múltiples imports.
interface PresenciaStore {
  mapa: Map<number, PresenciaOperador>
  emitter: EventEmitter
  barridoIniciado: boolean
}

const globalRef = globalThis as unknown as { __presenciaStore?: PresenciaStore }

function getStore(): PresenciaStore {
  if (!globalRef.__presenciaStore) {
    const emitter = new EventEmitter()
    emitter.setMaxListeners(0) // sin límite de suscriptores SSE
    globalRef.__presenciaStore = {
      mapa: new Map<number, PresenciaOperador>(),
      emitter,
      barridoIniciado: false,
    }
  }
  return globalRef.__presenciaStore
}

function emitirCambio() {
  getStore().emitter.emit('cambio', listarPresencias())
}

/** Elimina las presencias expiradas. Devuelve true si eliminó alguna. */
function purgarExpiradas(): boolean {
  const store = getStore()
  const ahora = Date.now()
  let cambio = false
  for (const [id, p] of Array.from(store.mapa.entries())) {
    if (ahora - p.actualizadoEn > TTL_PRESENCIA_MS) {
      store.mapa.delete(id)
      cambio = true
    }
  }
  return cambio
}

/** Inicia (una sola vez) el barrido periódico que expira presencias inactivas. */
function asegurarBarrido() {
  const store = getStore()
  if (store.barridoIniciado) return
  store.barridoIniciado = true
  const intervalo = setInterval(() => {
    if (purgarExpiradas()) emitirCambio()
  }, 5_000)
  // No mantener el proceso vivo solo por este timer.
  if (typeof intervalo.unref === 'function') intervalo.unref()
}

export interface ActualizarPresenciaInput {
  usuarioId: number
  usuario: string
  nombre: string
  apellido: string
  grado: string
  oficina: string
  paso: number
  pasoLabel: string
  tipoFormulario?: string | null
  borradorId?: number | null
  horaInicio?: string | null
  fechaInicio?: string | null
}

/** Registra o actualiza (heartbeat) la presencia de un operador. */
export function actualizarPresencia(input: ActualizarPresenciaInput): void {
  asegurarBarrido()
  const store = getStore()
  const ahora = Date.now()
  const previa = store.mapa.get(input.usuarioId)

  store.mapa.set(input.usuarioId, {
    usuarioId: input.usuarioId,
    usuario: input.usuario,
    nombre: input.nombre,
    apellido: input.apellido,
    grado: input.grado,
    oficina: input.oficina,
    paso: input.paso,
    pasoLabel: input.pasoLabel,
    tipoFormulario: input.tipoFormulario ?? null,
    borradorId: input.borradorId ?? null,
    horaInicio: input.horaInicio ?? previa?.horaInicio ?? null,
    fechaInicio: input.fechaInicio ?? previa?.fechaInicio ?? null,
    inicioEn: previa?.inicioEn ?? ahora,
    actualizadoEn: ahora,
  })
  emitirCambio()
}

/** Elimina la presencia de un operador (al finalizar o abandonar la carga). */
export function eliminarPresencia(usuarioId: number): void {
  const store = getStore()
  if (store.mapa.delete(usuarioId)) emitirCambio()
}

/** Devuelve la lista de operadores activos (sin los expirados), del más reciente al más antiguo. */
export function listarPresencias(): PresenciaOperador[] {
  const store = getStore()
  const ahora = Date.now()
  return Array.from(store.mapa.values())
    .filter((p) => ahora - p.actualizadoEn <= TTL_PRESENCIA_MS)
    .sort((a, b) => b.inicioEn - a.inicioEn)
}

/** Suscribe un callback a los cambios de presencia. Devuelve una función para desuscribirse. */
export function suscribirPresencia(cb: (lista: PresenciaOperador[]) => void): () => void {
  const store = getStore()
  asegurarBarrido()
  store.emitter.on('cambio', cb)
  return () => store.emitter.off('cambio', cb)
}
