'use client'

import { useEffect, useRef } from 'react'

interface ReportarPresenciaArgs {
  /** Debe estar activo solo mientras el operador realmente está tomando la denuncia. */
  activo: boolean
  paso: number
  pasoLabel: string
  tipoFormulario?: string | null
  borradorId?: number | null
  horaInicio?: string | null
  fechaInicio?: string | null
}

const HEARTBEAT_MS = 5_000

/**
 * Reporta la presencia del operador que está tomando una denuncia, para que el
 * desarrollador pueda verlo en tiempo real. Envía un heartbeat periódico y uno
 * inmediato cada vez que cambia el paso; da de baja la presencia al finalizar,
 * al desmontar o al cerrar la pestaña.
 *
 * La identidad NO se envía desde el cliente: el servidor la toma de la cookie de
 * sesión firmada.
 */
export function useReportarPresencia({
  activo,
  paso,
  pasoLabel,
  tipoFormulario = null,
  borradorId = null,
  horaInicio = null,
  fechaInicio = null,
}: ReportarPresenciaArgs) {
  // Mantener los últimos valores accesibles para el intervalo sin recrearlo.
  const datosRef = useRef({ paso, pasoLabel, tipoFormulario, borradorId, horaInicio, fechaInicio })
  datosRef.current = { paso, pasoLabel, tipoFormulario, borradorId, horaInicio, fechaInicio }

  const enviarHeartbeat = () => {
    fetch('/api/presencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify(datosRef.current),
    }).catch(() => {
      // La presencia es best-effort; ignorar errores de red.
    })
  }

  const darDeBaja = () => {
    // sendBeacon sobrevive a la descarga de la página; DELETE por fetch como respaldo.
    try {
      navigator.sendBeacon?.('/api/presencia/baja')
    } catch {
      // ignorar
    }
    fetch('/api/presencia', { method: 'DELETE', credentials: 'include', keepalive: true }).catch(() => {})
  }

  // Heartbeat inmediato al activarse y en cada cambio de paso.
  useEffect(() => {
    if (!activo) return
    enviarHeartbeat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, paso])

  // Intervalo de heartbeat + baja al desmontar / cerrar pestaña.
  useEffect(() => {
    if (!activo) return

    const intervalo = setInterval(enviarHeartbeat, HEARTBEAT_MS)
    const onUnload = () => darDeBaja()
    window.addEventListener('beforeunload', onUnload)

    return () => {
      clearInterval(intervalo)
      window.removeEventListener('beforeunload', onUnload)
      darDeBaja()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo])
}
