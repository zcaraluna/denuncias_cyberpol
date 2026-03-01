'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/MainLayout'
import { MiniHeader } from '@/components/MiniHeader'
import { cn } from '@/lib/utils'

interface DenunciaInfo {
  id: number | string
  orden: number | string
  año: string
  fecha: string
  hora: string
  denunciante: string
  tipoHecho: string
}

function ConfirmacionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { usuario, loading: authLoading } = useAuth()
  const [denuncia, setDenuncia] = useState<DenunciaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const isSimulacion = searchParams.get('simulacion') === 'true'

  useEffect(() => {
    if (isSimulacion) {
      setDenuncia({
        id: 'SIM-001',
        orden: '001',
        año: new Date().getFullYear().toString(),
        fecha: new Date().toISOString().split('T')[0],
        hora: '12:00',
        denunciante: 'GUILLERMO RECALDE',
        tipoHecho: 'HURTO AGRAVADO',
      })
      setLoading(false)
      return
    }

    const id = searchParams.get('id')
    if (!id) {
      router.push('/dashboard')
      return
    }

    const fetchDenuncia = async () => {
      try {
        const response = await fetch(`/api/denuncias/${id}`, { cache: 'no-store' })
        if (!response.ok) throw new Error('Denuncia no encontrada')
        const data = await response.json()

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
  }, [searchParams, router, isSimulacion])

  const handleDescargarPDF = () => {
    if (isSimulacion) {
      alert('Modo simulación: La descarga de PDF real está deshabilitada.')
      return
    }
    if (denuncia && usuario) {
      window.open(`/api/denuncias/pdf/${denuncia.id}?usuario_id=${usuario.id}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#002147]/20 border-t-[#002147] rounded-full animate-spin mb-4" />
          <div className="text-[#002147] font-bold animate-pulse text-lg">Procesando...</div>
        </div>
      </div>
    )
  }

  if (!denuncia) return null

  return (
    <MainLayout hideSidebar={true}>
      <MiniHeader />
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] py-6 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-lg mx-auto">
          {isSimulacion && (
            <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-xs font-medium flex items-center justify-center shadow-sm">
              <span className="mr-2">⚠️</span>
              Simulación: Visualización previa con datos de ejemplo.
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transform transition-all duration-300">
            <div className="bg-[#002147] p-5 text-center relative overflow-hidden">
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-xl" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-400/10 rounded-full -ml-8 -mb-8 blur-xl" />

              <div className="relative z-10">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md mb-3 ring-1 ring-white/20">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase mb-1">Denuncia Registrada</h2>
              </div>
            </div>

            <div className="p-5">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 transition-hover duration-200 hover:bg-slate-100/50">
                    <p className="text-[9px] font-black text-[#002147]/50 uppercase tracking-wider mb-1">Número de Acta</p>
                    <p className="text-lg font-black text-[#002147]">Nº {denuncia.orden}/{denuncia.año}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 transition-hover duration-200 hover:bg-slate-100/50">
                    <p className="text-[9px] font-black text-[#002147]/50 uppercase tracking-wider mb-1">Fecha y Hora</p>
                    <p className="text-sm font-bold text-[#002147]">
                      {denuncia.fecha.split('-').reverse().join('/')} <span className="text-slate-400 font-medium mx-1">•</span> {denuncia.hora}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 transition-hover duration-200 hover:bg-slate-100/50">
                  <p className="text-[9px] font-black text-[#002147]/50 uppercase tracking-wider mb-1">Denunciante</p>
                  <p className="text-sm font-bold text-[#002147] uppercase tracking-tight">{denuncia.denunciante}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 transition-hover duration-200 hover:bg-slate-100/50">
                  <p className="text-[9px] font-black text-[#002147]/50 uppercase tracking-wider mb-1">Hecho Denunciado</p>
                  <p className="text-sm font-bold text-[#002147] uppercase tracking-tight">{denuncia.tipoHecho}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleDescargarPDF}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold uppercase tracking-widest text-[10px] shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar PDF
                </button>
                <button
                  onClick={() => router.push('/nueva-denuncia')}
                  className="w-full py-2.5 bg-[#002147] hover:bg-[#002147]/90 text-white rounded-lg font-bold uppercase tracking-widest text-[10px] shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nueva Denuncia
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full sm:col-span-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all flex items-center justify-center border border-slate-200"
                >
                  Ir al Inicio
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  )
}

export default function ConfirmacionPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#002147]/20 border-t-[#002147] rounded-full animate-spin mb-4" />
          <div className="text-[#002147] font-bold animate-pulse text-lg">Cargando...</div>
        </div>
      </div>
    }>
      <ConfirmacionPage />
    </Suspense>
  )
}

