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

  // Estados para la firma digital
  const [tokens, setTokens] = useState<{ operador: string | null, denunciante: string | null }>({ operador: null, denunciante: null })
  const [firmasStatus, setFirmasStatus] = useState<{ operador: boolean, denunciante: boolean }>({ operador: false, denunciante: false })
  const [loadingStatus, setLoadingStatus] = useState(false)

  // Función para obtener/generar tokens de firma
  const initFirmas = async (denunciaId: any) => {
    try {
      const res = await fetch(`/api/denuncias/${denunciaId}/firmas`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setTokens(data.tokens)

        // También obtener el estado actual de las firmas
        const statusRes = await fetch(`/api/denuncias/${denunciaId}/firmas`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          const status = { operador: false, denunciante: false }
          statusData.firmas.forEach((f: any) => {
            if (f.rol === 'operador') status.operador = f.usado
            if (f.rol === 'denunciante') status.denunciante = f.usado
          })
          setFirmasStatus(status)
        }
      }
    } catch (error) {
      console.error('Error inicializando firmas:', error)
    }
  }

  // Función para refrescar solo el estado de las firmas
  const refreshStatus = async () => {
    if (!denuncia || isSimulacion) return
    setLoadingStatus(true)
    try {
      const res = await fetch(`/api/denuncias/${denuncia.id}/firmas`)
      if (res.ok) {
        const data = await res.json()
        const status = { operador: false, denunciante: false }
        data.firmas.forEach((f: any) => {
          if (f.rol === 'operador') status.operador = f.usado
          if (f.rol === 'denunciante') status.denunciante = f.usado
        })
        setFirmasStatus(status)
      }
    } catch (error) {
      console.error('Error al refrescar firmas:', error)
    } finally {
      setLoadingStatus(false)
    }
  }

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
        initFirmas(data.id)
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

              {/* SECCIÓN DE FIRMA DIGITAL */}
              {!isSimulacion && (
                <div className="mt-8 border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-[#002147] uppercase tracking-wider flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Firma Digital del Acta
                    </h3>
                    <div className="bg-blue-50 text-blue-700 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Opcional
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 mb-6 leading-relaxed">
                    Escanee los códigos QR con su teléfono para firmar digitalmente.
                    El PDF se generará con las firmas capturadas.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {/* QR Operador */}
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100 mb-3 group hover:border-blue-200 transition-colors">
                        <QRCodeSection
                          token={tokens.operador}
                          rol="operador"
                          usado={firmasStatus.operador}
                        />
                      </div>
                      <p className="text-[9px] font-bold text-[#002147] uppercase mb-0.5">Operador</p>
                      <SignatureStatus usado={firmasStatus.operador} />
                    </div>

                    {/* QR Denunciante */}
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100 mb-3 group hover:border-blue-200 transition-colors">
                        <QRCodeSection
                          token={tokens.denunciante}
                          rol="denunciante"
                          usado={firmasStatus.denunciante}
                        />
                      </div>
                      <p className="text-[9px] font-bold text-[#002147] uppercase mb-0.5">Denunciante</p>
                      <SignatureStatus usado={firmasStatus.denunciante} />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col items-center">
                    <button
                      onClick={refreshStatus}
                      className="flex items-center text-[9px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                    >
                      <svg className={`w-3 h-3 mr-1 ${loadingStatus ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Actualizar Estado
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function QRCodeSection({ token, rol, usado }: { token: string | null, rol: string, usado: boolean }) {
  const [qrUrl, setQrUrl] = useState<string>('')

  useEffect(() => {
    if (token && !usado) {
      const url = `${window.location.protocol}//${window.location.host}/firmar/${token}`
      import('qrcode').then(QRCode => {
        QRCode.toDataURL(url, {
          margin: 1,
          width: 256,
          color: {
            dark: '#002147',
            light: '#ffffff'
          }
        }).then(setQrUrl)
      })
    }
  }, [token, usado])

  if (usado) {
    return (
      <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center bg-green-50 rounded-lg">
        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }

  if (!qrUrl) {
    return <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-100 animate-pulse rounded-lg" />
  }

  return <img src={qrUrl} alt={`QR ${rol}`} className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg" />
}

function SignatureStatus({ usado }: { usado: boolean }) {
  if (usado) {
    return (
      <div className="flex items-center text-[8px] font-black text-green-600 uppercase tracking-tighter">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
        Firmado
      </div>
    )
  }
  return (
    <div className="flex items-center text-[8px] font-black text-slate-400 uppercase tracking-tighter">
      Pendiente
    </div>
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

