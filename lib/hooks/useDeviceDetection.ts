'use client'

import { useEffect, useState } from 'react'

export function useDeviceDetection() {
  const [esMovilReal, setEsMovilReal] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const detectar = () => {
      // 1. Detección por User Agent (Básica)
      const ua = navigator.userAgent || ''
      const esUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
      
      // 2. Detección por Hardware (Touch Points)
      // La mayoría de los móviles reportan 5 o 10. Desktops suelen ser 0 o 1.
      const hasTouch = navigator.maxTouchPoints > 1
      
      // 3. Detección por Plataforma (Incluso en modo escritorio, esta suele persistir)
      const pl = (navigator as any).platform || ''
      const esPlataformaMovil = /iPhone|iPad|iPod|Android|Linux arm|Linux aarch64/i.test(pl)

      // 4. Detección por APIs específicas de móvil
      const hasOrientation = typeof window.orientation !== 'undefined'
      
      // Lógica de decisión:
      // Si tiene touch Y es detectado por UA o Plataforma, o tiene touch y orientación, es móvil real.
      // Un iPad en modo escritorio dirá "MacIntel" pero maxTouchPoints > 1.
      const esRealmenteMovil = (hasTouch && (esUA || esPlataformaMovil || hasOrientation))
      
      setEsMovilReal(esRealmenteMovil)
      setIsLoaded(true)
    }

    detectar()
    
    // Escuchar cambios de orientación (típico de móviles)
    window.addEventListener('orientationchange', detectar)
    return () => window.removeEventListener('orientationchange', detectar)
  }, [])

  return { esMovilReal, isLoaded }
}
