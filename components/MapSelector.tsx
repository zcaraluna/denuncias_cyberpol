'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// @ts-ignore - leaflet-geosearch no tiene tipos completos
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'
import 'leaflet-geosearch/dist/geosearch.css'

// Estilos personalizados para el buscador
const searchStyles = `
  .leaflet-control-geosearch {
    font-family: 'Inter', sans-serif !important;
  }
  .leaflet-control-geosearch * {
    color: #1f2937 !important;
  }
  .leaflet-control-geosearch form {
    background: white !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  }
  .leaflet-control-geosearch form input {
    color: #1f2937 !important;
    background: white !important;
    border: 1px solid #d1d5db !important;
    padding: 8px 12px !important;
    font-size: 14px !important;
  }
  .leaflet-control-geosearch form input::placeholder {
    color: #9ca3af !important;
  }
  .leaflet-control-geosearch .results {
    background: white !important;
    border: 1px solid #d1d5db !important;
    border-radius: 8px !important;
    margin-top: 4px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    max-height: 300px !important;
    overflow-y: auto !important;
  }
  .leaflet-control-geosearch .results * {
    color: #1f2937 !important;
    background: white !important;
  }
  .leaflet-control-geosearch .results a,
  .leaflet-control-geosearch .results .result {
    padding: 10px 12px !important;
    border-bottom: 1px solid #e5e7eb !important;
    cursor: pointer !important;
    color: #1f2937 !important;
    background: white !important;
    text-decoration: none !important;
  }
  .leaflet-control-geosearch .results a:hover,
  .leaflet-control-geosearch .results .result:hover {
    background: #f3f4f6 !important;
    color: #1f2937 !important;
  }
  .leaflet-control-geosearch .results a.active,
  .leaflet-control-geosearch .results .result.active {
    background: #eff6ff !important;
    color: #1f2937 !important;
  }
  .leaflet-control-geosearch .results .name,
  .leaflet-control-geosearch .results .result-name {
    color: #1f2937 !important;
    font-weight: 500 !important;
  }
  .leaflet-control-geosearch .results .location,
  .leaflet-control-geosearch .results .result-label {
    color: #6b7280 !important;
    font-size: 12px !important;
  }
  .leaflet-control-geosearch button {
    color: #1f2937 !important;
    background: white !important;
  }
`

interface MapSelectorProps {
  onSelect: (lat: number, lng: number) => void
  onClose: () => void
}

// Fix para los iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    dblclick: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Componente para agregar el buscador al mapa
function SearchControl({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const map = useMap()
  const searchControlRef = useRef<any>(null)

  useEffect(() => {
    if (!searchControlRef.current) {
      // @ts-ignore - Crear provider personalizado que filtre solo por Paraguay
      const provider = new OpenStreetMapProvider({
        params: {
          countrycodes: 'py', // Código ISO de Paraguay
          'accept-language': 'es',
          limit: 10,
          // Priorizar resultados cercanos al centro de Paraguay
          'focus.point.lat': -25.2865,
          'focus.point.lon': -57.6470,
        },
      })

      // @ts-ignore
      const searchControl = new GeoSearchControl({
        provider: provider,
        style: 'bar',
        showMarker: false,
        showPopup: false,
        marker: {
          icon: new L.Icon.Default(),
          draggable: false,
        },
        popupFormat: ({ query, result }: any) => result.label,
        resultFormat: ({ result }: any) => result.label,
        maxMarkers: 1,
        retainZoomLevel: false,
        animateZoom: true,
        autoClose: true,
        searchLabel: 'Buscar ubicación...',
        keepResult: true,
      })

      map.addControl(searchControl)
      searchControlRef.current = searchControl

      // Escuchar cuando se selecciona una ubicación
      map.on('geosearch/showlocation', (e: any) => {
        if (e.location && e.location.y && e.location.x) {
          onLocationSelect(e.location.y, e.location.x)
        }
      })
    }

    return () => {
      if (searchControlRef.current) {
        map.removeControl(searchControlRef.current)
        searchControlRef.current = null
      }
    }
  }, [map, onLocationSelect])

  return null
}

export default function MapSelector({ onSelect, onClose }: MapSelectorProps) {
  const [coordenadas, setCoordenadas] = useState({ lat: -25.2865, lng: -57.6470 })
  const markerRef = useRef<L.Marker | null>(null)

  // Inyectar estilos personalizados
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = searchStyles
    document.head.appendChild(styleElement)
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement)
      }
    }
  }, [])

  const handleMapClick = (lat: number, lng: number) => {
    setCoordenadas({ lat, lng })
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setCoordenadas({ lat, lng })
    // Actualizar posición del marcador si existe
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    }
  }

  const handleConfirm = () => {
    onSelect(coordenadas.lat, coordenadas.lng)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <style>{searchStyles}</style>
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
        <div className="flex-1 p-4 flex flex-col">
          <div className="mb-4 text-sm text-gray-600">
            <p>Busca una ubicación, haz doble clic en el mapa para colocar el marcador, o arrastra el marcador existente.</p>
            <p className="mt-2 font-mono">
              Latitud: {coordenadas.lat.toFixed(6)}, Longitud: {coordenadas.lng.toFixed(6)}
            </p>
          </div>
          <div className="flex-1 rounded-lg border border-gray-300 overflow-hidden relative">
            <MapContainer
              center={[coordenadas.lat, coordenadas.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={[coordenadas.lat, coordenadas.lng]}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target
                    const position = marker.getLatLng()
                    setCoordenadas({ lat: position.lat, lng: position.lng })
                  },
                }}
                ref={markerRef}
              />
              <MapClickHandler onMapClick={handleMapClick} />
              <SearchControl onLocationSelect={handleLocationSelect} />
            </MapContainer>
          </div>
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Confirmar Ubicación
          </button>
        </div>
      </div>
    </div>
  )
}
