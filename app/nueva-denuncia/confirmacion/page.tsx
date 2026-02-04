'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

interface DenunciaInfo {
  id: number
  orden: number
  año: string
  fecha: string
  hora: string
  denunciante: string
  tipoHecho: string
}

interface Usuario {
  id: number
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
}

function ConfirmacionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { usuario, loading: authLoading } = useAuth()
  const [denuncia, setDenuncia] = useState<DenunciaInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = searchParams.get('id')
    if (!id) {
      router.push('/dashboard')
      return
    }

    // Obtener información de la denuncia
    const fetchDenuncia = async () => {
      try {
        const response = await fetch(`/api/denuncias/${id}`, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Denuncia no encontrada')
        }
        const data = await response.json()

        // Formatear la fecha correctamente
        let fechaStr = data.fecha_denuncia
        if (fechaStr instanceof Date) {
          fechaStr = fechaStr.toISOString().split('T')[0]
        } else if (typeof fechaStr === 'string' && fechaStr.includes('T')) {
          fechaStr = fechaStr.split('T')[0]
        }

        setDenuncia({
          id: data.id,
          orden: data.orden,
          año: fechaStr.split('-')[0],
          fecha: fechaStr,
          hora: data.hora_denuncia,
          denunciante: data.denunciante_nombres,
          tipoHecho: data.tipo_denuncia,
        })
      } catch (error) {
        console.error('Error:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDenuncia()
  }, [searchParams, router])

  const handleDescargarPDF = () => {
    if (denuncia && usuario) {
      window.open(`/api/denuncias/pdf/${denuncia.id}?usuario_id=${usuario.id}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!denuncia) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">Confirmación</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              Ir al Inicio →
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-8">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
              <svg
                className="h-12 w-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Denuncia Registrada Exitosamente
          </h2>

          <p className="text-lg text-gray-600 mb-8">
            La denuncia ha sido procesada y guardada en el sistema.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Número de Acta
                </p>
                <p className="text-xl font-bold text-gray-900">
                  Nº {denuncia.orden}/{denuncia.año}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Fecha y Hora
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {denuncia.fecha.split('-').reverse().join('/')} - {denuncia.hora}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Denunciante
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {denuncia.denunciante}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Supuesto Hecho
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {denuncia.tipoHecho}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDescargarPDF}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Descargar PDF
            </button>
            <button
              onClick={() => router.push('/nueva-denuncia')}
              className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
            >
              Nueva Denuncia
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ConfirmacionPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Cargando...</div>
      </div>
    }>
      <ConfirmacionPage />
    </Suspense>
  )
}

