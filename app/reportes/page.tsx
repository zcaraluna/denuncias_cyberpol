'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'

interface ReporteRow {
  numero_denuncia: number
  año: number
  hora_denuncia: string
  shp: string
  denunciante: string
  interviniente: string
}

export default function ReportesPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [fecha, setFecha] = useState('')
  const [datos, setDatos] = useState<ReporteRow[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading])

  const handleBuscar = async () => {
    if (!fecha) {
      alert('Por favor seleccione una fecha')
      return
    }

    setCargando(true)
    try {
      const response = await fetch(`/api/reportes/simple?fecha=${fecha}`)
      if (!response.ok) throw new Error('Error al obtener reporte')
      const data = await response.json()
      setDatos(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar el reporte')
    } finally {
      setCargando(false)
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Volver al Inicio
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Reportes</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selector de fecha */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                id="fecha"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleBuscar}
              disabled={cargando}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {cargando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Tabla de resultados */}
        {datos.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Num. de Denuncia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hora de denuncia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S.H.P.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Denunciante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interviniente
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {datos.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.numero_denuncia}/{row.año}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.hora_denuncia}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {row.shp || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {row.denunciante || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {row.interviniente || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {datos.length === 0 && fecha && !cargando && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            No se encontraron denuncias para la fecha seleccionada.
          </div>
        )}
      </main>
    </div>
  )
}
