'use client'

import { useEffect, useRef, useState } from 'react'

interface MapSelectorProps {
  onSelect: (lat: number, lng: number) => void
  onClose: () => void
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function MapSelector({ onSelect, onClose }: MapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [coordenadas, setCoordenadas] = useState({ lat: -25.2865, lng: -57.6470 })
  const [mapsLoaded, setMapsLoaded] = useState(false)

  useEffect(() => {
    // Cargar Google Maps API
    if (typeof window !== 'undefined' && !window.google) {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`
      script.async = true
      script.defer = true
      
      window.initMap = () => {
        setMapsLoaded(true)
      }
      
      document.head.appendChild(script)
      
      return () => {
        document.head.removeChild(script)
        delete window.initMap
      }
    } else if (window.google) {
      setMapsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (mapsLoaded && mapRef.current && !mapInstanceRef.current && window.google) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: coordenadas.lat, lng: coordenadas.lng },
        zoom: 13,
      })

      const marker = new window.google.maps.Marker({
        position: { lat: coordenadas.lat, lng: coordenadas.lng },
        map: map,
        draggable: true,
      })

      marker.addListener('dragend', (e: any) => {
        if (e.latLng) {
          setCoordenadas({
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          })
        }
      })

      map.addListener('dblclick', (e: any) => {
        if (e.latLng) {
          const newPos = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          }
          marker.setPosition(newPos)
          setCoordenadas(newPos)
        }
      })

      mapInstanceRef.current = map
      markerRef.current = marker
    }
  }, [mapsLoaded, coordenadas])

  const handleConfirm = () => {
    onSelect(coordenadas.lat, coordenadas.lng)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            Seleccionar Ubicación en el Mapa
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="flex-1 p-4">
          <div className="mb-4 text-sm text-gray-600">
            <p>Doble clic en el mapa para colocar el marcador, o arrastre el marcador existente.</p>
            <p className="mt-2 font-mono">
              Latitud: {coordenadas.lat.toFixed(6)}, Longitud: {coordenadas.lng.toFixed(6)}
            </p>
          </div>
          {!mapsLoaded && (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500">Cargando mapa...</p>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full rounded-lg border border-gray-300" style={{ display: mapsLoaded ? 'block' : 'none' }} />
        </div>
        <div className="p-4 border-t flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!mapsLoaded}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar Ubicación
          </button>
        </div>
      </div>
    </div>
  )
}

