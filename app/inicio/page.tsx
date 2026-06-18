'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/MainLayout'
import {
  TrendingUp,
  RefreshCw,
  Clock,
  ArrowRight,
  Calculator,
  X,
  BookOpen,
  FileText,
  Smartphone,
  ShieldCheck,
  Shield,
  Loader2,
  Search,
  Book
} from 'lucide-react'

const API_KEY = 'c26434662f9a1a4869628002'

const PREGUNTAS_PREDEFINIDAS = [
  "¿Cuál es tu número de credencial?",
  "¿Cuál fue el modelo de tu primer automóvil (o motocicleta)?",
  "¿Cuál fue el primer país extranjero que visitaste?",
  "¿Cuál es tu comida favorita?",
  "¿Cuál fue la primera marca de teléfono celular que tuviste?",
  "¿Cuántos hermanos/as tienes?",
  "¿Cuál es tu banda o artista musical favorito?",
  "¿Cuál es tu color favorito?",
  "¿Cuál es tu número favorito?",
  "¿Cuál es el nombre de tu primera mascota?",
  "¿Cuál es el nombre de tu mascota actual?"
]

interface Manual {
  id: string
  title: string
  description: string
  content: string
  icon: any
  category: string
  color: string
}

const MANUALS_DATA: Manual[] = [
  {
    id: 'exportar-word',
    title: 'Exportar a Word (Reporte Diario)',
    description: 'Instrucciones para generar la Nota de Elevación y el reporte diario en formato .docx.',
    category: 'REPORTE',
    icon: FileText,
    color: 'bg-indigo-50 text-indigo-600',
    content: `Para exportar el reporte diario a Word:
    
1. Ingrese a la sección **Reportes**.
2. Seleccione la pestaña **Diario**.
3. Elija la **Fecha** del reporte y las horas de inicio/fin (de 07:00 a 07:00 suele ser lo habitual).
4. Haga clic en el botón de **Buscar**.
5. Verifique que el orden de las denuncias sea el correcto (Ascendente por Nro. de Orden).
6. Presione el botón azul con el **Icono de Word** (Descargar).
7. Complete los datos solicitados (Nro. de Nota, Destinatario y Remitente).
8. Presione **Generar Reporte** para descargar el archivo.`
  }
]

interface CurrencyData {
  code: string
  name: string
  flag: string
  rate: number
  color: string
}

export default function InicioPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [rates, setRates] = useState<Record<string, { compra: number, venta: number }>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<'new' | null>(null)

  // Recordatorio de preguntas de seguridad
  const [showPreguntasReminder, setShowPreguntasReminder] = useState(false)
  const [showWizardModal, setShowWizardModal] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [wizardPreguntas, setWizardPreguntas] = useState<{ pregunta: string, respuesta: string }[]>([
    { pregunta: '', respuesta: '' },
    { pregunta: '', respuesta: '' },
    { pregunta: '', respuesta: '' },
    { pregunta: '', respuesta: '' },
    { pregunta: '', respuesta: '' },
  ])
  const [guardandoWizard, setGuardandoWizard] = useState(false)
  const [wizardError, setWizardError] = useState('')

  const fetchRates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cotizaciones')
      const data = await response.json()
      if (!data.error) {
        // Soporta tanto el formato {} como { rates: {} }
        setRates(data.rates || data)
      }
    } catch (error) {
      console.error('Error fetching rates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setWizardError('')

    const currentIdx = wizardStep - 1
    const currentQ = wizardPreguntas[currentIdx]

    if (!currentQ.pregunta) {
      setWizardError('Debe seleccionar una pregunta.')
      return
    }

    if (!currentQ.respuesta.trim()) {
      setWizardError('Debe responder a la pregunta.')
      return
    }

    if (wizardStep < 5) {
      setWizardStep(prev => prev + 1)
      return
    }

    setGuardandoWizard(true)
    try {
      const res = await fetch('/api/usuarios/preguntas-seguridad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preguntas: wizardPreguntas })
      })

      const data = await res.json()
      if (!res.ok) {
        setWizardError(data.error || 'Error al guardar preguntas de seguridad.')
        return
      }

      alert('¡Preguntas de seguridad configuradas exitosamente!')
      setShowWizardModal(false)
      setWizardPreguntas([
        { pregunta: '', respuesta: '' },
        { pregunta: '', respuesta: '' },
        { pregunta: '', respuesta: '' },
        { pregunta: '', respuesta: '' },
        { pregunta: '', respuesta: '' },
      ])
    } catch (err) {
      console.error('Error guardando preguntas en el wizard:', err)
      setWizardError('Error de conexión con el servidor')
    } finally {
      setGuardandoWizard(false)
    }
  }

  const checkPreguntas = async () => {
    try {
      const res = await fetch('/api/usuarios/preguntas-seguridad')
      const data = await res.json()
      const omitidoSesion = sessionStorage.getItem('preguntas_omitidas')
      if (res.ok && !data.configuradas && omitidoSesion !== 'true') {
        setShowPreguntasReminder(true)
      }
    } catch (err) {
      console.error('Error al verificar preguntas de seguridad:', err)
    }
  }

  useEffect(() => {
    if (!authLoading && usuario && usuario.debe_cambiar_contraseña) {
      router.push('/cambiar-password')
    }
    if (usuario) {
      fetchRates()

      // Mostrar modal de actualizaciones una vez por sesión
      const hasSeen = sessionStorage.getItem('hasSeenUpdateModal')
      if (!hasSeen) {
        setActiveModal('new')
      } else {
        checkPreguntas()
      }
    }
  }, [usuario, authLoading, router])

  const handleCloseNewModal = () => {
    sessionStorage.setItem('hasSeenUpdateModal', 'true')
    setActiveModal(null)
    checkPreguntas()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002147]"></div>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!usuario || usuario.debe_cambiar_contraseña) {
    return null
  }

  // Sanitizar nombre: Tomar primer nombre y primer apellido
  const primerNombre = usuario.nombre ? usuario.nombre.split(' ')[0] : ''
  const primerApellido = usuario.apellido ? usuario.apellido.split(' ')[0] : ''

  const currencies: CurrencyData[] = [
    { code: 'USD', name: 'Dólar Americano', flag: '🇺🇸', rate: rates['USD']?.venta || 0, color: 'text-emerald-600 bg-emerald-50' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺', rate: rates['EUR']?.venta || 0, color: 'text-blue-600 bg-blue-50' },
    { code: 'BRL', name: 'Real Brasileño', flag: '🇧🇷', rate: rates['BRL']?.venta || 0, color: 'text-amber-600 bg-amber-50' },
    { code: 'ARS', name: 'Peso Argentino', flag: '🇦🇷', rate: rates['ARS']?.venta || 0, color: 'text-sky-600 bg-sky-50' },
  ]

  return (
    <MainLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#002147] tracking-tight mb-1">
              Bienvenido, {usuario.grado} <span className="uppercase">{primerNombre} {primerApellido}</span>
            </h1>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
              {usuario.oficina}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchRates}
              disabled={loading}
              className="flex items-center gap-2 text-xs font-bold text-[#002147] bg-white border-2 border-slate-100 hover:border-[#002147]/20 hover:bg-slate-50 px-5 py-3 rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Widgets Row: Currency & Manuals */}
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Currency Section */}
          <div className="w-fit min-w-[320px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-[#002147] rounded-full" />
              <div>
                <h2 className="text-lg font-black text-[#002147] tracking-tight uppercase">Cotizaciones</h2>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Mercado Cambiario</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-md rounded-[1.8rem] border border-slate-100 p-1 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden">
              <div className="flex flex-col">
                {currencies.map((currency, index) => (
                  <div key={currency.code}>
                    <CurrencyListItem
                      currency={currency}
                      loading={loading}
                      buyingValue={rates[currency.code]?.compra || 0}
                      onOpenConverter={() => {
                        setSelectedCurrency(currency)
                        setIsModalOpen(true)
                      }}
                    />
                    {index < currencies.length - 1 && (
                      <div className="mx-4 h-px bg-slate-50/50" />
                    )}
                  </div>
                ))}
              </div>
              {/* Internal Disclaimer */}
              <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100/50">
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  Fuente: <a href="https://www.cambioschaco.com.py/" target="_blank" rel="noopener noreferrer" className="hover:text-[#002147] transition-colors underline decoration-slate-200 underline-offset-2">Cambios Chaco</a>
                </p>
              </div>
            </div>
          </div>

          {/* Manuals Section */}
          <div className="flex-1 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-[#002147] rounded-full" />
              <div>
                <h2 className="text-lg font-black text-[#002147] tracking-tight uppercase">Guías Rápidas</h2>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Instrucciones de uso</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {MANUALS_DATA.map((manual) => (
                <ManualCard
                  key={manual.id}
                  manual={manual}
                  onClick={() => {
                    setSelectedManual(manual)
                    setIsManualModalOpen(true)
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Currency Converter Modal */}
        {isModalOpen && selectedCurrency && (
          <CurrencyModal
            currency={selectedCurrency}
            buyingValue={rates[selectedCurrency.code]?.compra || 0}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>

      {/* Manual Modal */}
      {isManualModalOpen && selectedManual && (
        <ManualModal
          manual={selectedManual}
          onClose={() => setIsManualModalOpen(false)}
        />
      )}

      {/* Modal de Actualización - Novedades (v1.5.549) */}
      {activeModal === 'new' && (
        <UpdateModal
          version="v1.5.549"
          onClose={handleCloseNewModal}
          features={[
            {
              icon: (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              title: "Exportación a Word Completa",
              description: (
                <>
                  Al exportar el reporte diario a Word, la columna <strong className="font-extrabold text-[#002147]">Dpto. a Cargo</strong> ahora se completa de manera automática con la dependencia sugerida, evitando celdas vacías en el documento.
                </>
              ),
              bgClass: "bg-blue-50",
              borderClass: "border-blue-100"
            },
            {
              icon: (
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
              title: "Preguntas de Seguridad (Recuperación de Clave)",
              description: (
                <>
                  Ahora puedes configurar <strong className="font-extrabold text-[#002147]">preguntas de seguridad</strong> para poder recuperar de forma autónoma el acceso a tu cuenta en caso de olvidar tu contraseña.
                </>
              ),
              bgClass: "bg-emerald-50",
              borderClass: "border-emerald-100"
            }
          ]}
        />
      )}

      {/* Modal de Recordatorio de Preguntas de Seguridad */}
      {showPreguntasReminder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#002147]/45 backdrop-blur-sm transition-opacity"
            onClick={() => {
              sessionStorage.setItem('preguntas_omitidas', 'true')
              setShowPreguntasReminder(false)
            }}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header decoration */}
            <div className="bg-[#002147] px-8 py-8 text-white relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-6 -mt-6 blur-md" />
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 shrink-0">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200 block mb-0.5">
                    Recomendación de Seguridad
                  </span>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    Recuperación de Contraseña
                  </h2>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                Detectamos que aún no has configurado tus <strong className="font-bold text-[#002147]">preguntas de seguridad</strong>. 
                Es altamente recomendable configurarlas para que puedas recuperar de forma autónoma el acceso a tu cuenta en caso de olvidar tu contraseña.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    sessionStorage.setItem('preguntas_omitidas', 'true')
                    setShowPreguntasReminder(false)
                  }}
                  className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all text-center active:scale-95"
                >
                  Omitir por esta vez
                </button>
                <button
                  onClick={() => {
                    setShowPreguntasReminder(false)
                    setShowWizardModal(true)
                    setWizardStep(1)
                  }}
                  className="flex-1 bg-[#002147] hover:bg-blue-900 text-white py-3.5 px-4 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-blue-950/10 text-center active:scale-95"
                >
                  Configurar ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Asistente (Wizard) de Preguntas de Seguridad */}
      {showWizardModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-[#002147]/45 backdrop-blur-sm"
            onClick={() => {
              if (confirm("¿Desea cancelar la configuración de seguridad? Se guardará el recordatorio para el próximo inicio de sesión.")) {
                setShowWizardModal(false)
                sessionStorage.setItem('preguntas_omitidas', 'true')
              }
            }}
          />
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-200/60 w-full max-w-md relative z-10 animate-in zoom-in-95 duration-300">
            <button
              type="button"
              onClick={() => {
                if (confirm("¿Desea cancelar la configuración de seguridad? Se guardará el recordatorio para el próximo inicio de sesión.")) {
                  setShowWizardModal(false)
                  sessionStorage.setItem('preguntas_omitidas', 'true')
                }
              }}
              className="absolute top-4 right-4 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-[#002147] transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-slate-50/50 rounded-2xl mb-4 border border-slate-100 animate-pulse">
                <Shield className="h-6 w-6 text-[#002147]" />
              </div>
              <h2 className="text-lg font-black text-[#002147] uppercase tracking-wider">
                Pregunta de Seguridad {wizardStep} de 5
              </h2>
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-[#002147] h-full rounded-full transition-all duration-300"
                  style={{ width: `${(wizardStep / 5) * 100}%` }}
                />
              </div>
            </div>

            <form onSubmit={handleWizardSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Seleccione la Pregunta #{wizardStep}
                </label>
                <select
                  required
                  value={wizardPreguntas[wizardStep - 1].pregunta}
                  onChange={(e) => {
                    const newP = [...wizardPreguntas]
                    newP[wizardStep - 1].pregunta = e.target.value
                    setWizardPreguntas(newP)
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-[#002147] outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 transition-all"
                >
                  <option value="">-- Elija una pregunta --</option>
                  {PREGUNTAS_PREDEFINIDAS.map((pregunta, idx) => {
                    const isSelectedElsewhere = wizardPreguntas.some((p, otherIdx) => p.pregunta === pregunta && otherIdx !== (wizardStep - 1))
                    return (
                      <option key={idx} value={pregunta} disabled={isSelectedElsewhere}>
                        {pregunta}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Su Respuesta
                </label>
                <input
                  type="text"
                  required
                  value={wizardPreguntas[wizardStep - 1].respuesta}
                  onChange={(e) => {
                    const newP = [...wizardPreguntas]
                    newP[wizardStep - 1].respuesta = e.target.value
                    setWizardPreguntas(newP)
                  }}
                  placeholder="Escriba su respuesta secreta"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#002147] placeholder:text-slate-300 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                />
              </div>

              {wizardError && (
                <div className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider text-center border border-red-100 animate-in fade-in slide-in-from-top-1">
                  {wizardError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setWizardError('')
                      setWizardStep(prev => prev - 1)
                    }}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all text-center active:scale-95"
                  >
                    Atrás
                  </button>
                )}
                <button
                  type="submit"
                  disabled={guardandoWizard}
                  className="flex-1 bg-[#002147] hover:bg-blue-900 text-white py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 active:scale-95"
                >
                  {guardandoWizard ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-white/50" />
                      GUARDANDO...
                    </>
                  ) : (
                    wizardStep === 5 ? 'FINALIZAR' : 'SIGUIENTE'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

interface Feature {
  icon: React.ReactNode
  title: string
  description: React.ReactNode
  bgClass: string
  borderClass: string
}

function UpdateModal({
  version,
  features,
  onClose
}: {
  version: string
  features: Feature[]
  onClose: () => void
}) {
  const [segundos, setSegundos] = useState(5)

  useEffect(() => {
    setSegundos(5)
  }, [version])

  useEffect(() => {
    if (segundos <= 0) return
    const timer = setInterval(() => {
      setSegundos((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [segundos])

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#002147]/45 backdrop-blur-sm transition-opacity"
        onClick={segundos === 0 ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header decoration */}
        <div className="bg-[#002147] px-10 py-10 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8 blur-lg" />
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 shrink-0">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-200 block mb-0.5">
                Nueva Actualización ({version})
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight">
                SIDE Sistema de Denuncias
              </h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-10">
          <p className="text-sm text-slate-500 leading-relaxed mb-8 font-semibold">
            Se ha implementado una nueva versión del sistema con herramientas avanzadas para optimizar la carga de actas y proteger tu trabajo.
          </p>

          <div className="space-y-6">
            {features.map((feature, idx) => (
              <div key={idx} className="flex gap-5">
                <div className={`flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-2xl ${feature.bgClass} border ${feature.borderClass}`}>
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#002147] uppercase tracking-wide mb-1.5">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            disabled={segundos > 0}
            className="w-full bg-[#002147] text-white py-4 px-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-blue-900 active:scale-[0.98] transition-all shadow-md shadow-blue-950/10 mt-10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#002147]"
          >
            {segundos > 0 ? `Entendido, Continuar (${segundos}s)` : 'Entendido, Continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CurrencyListItem({
  currency,
  loading,
  buyingValue,
  onOpenConverter
}: {
  currency: CurrencyData,
  loading: boolean,
  buyingValue: number,
  onOpenConverter: () => void
}) {
  const sellingRate = currency.rate
  const buyingRate = buyingValue


  return (
    <div className="py-2 px-3 hover:bg-white/90 transition-all duration-300 flex items-center gap-4 group rounded-xl">
      {/* Left Part: Flag & Name */}
      <div className="flex items-center gap-3 w-24 shrink-0">
        <div className="text-lg filter grayscale-[0.3] group-hover:grayscale-0 transition-all">{currency.flag}</div>
        <div className="flex flex-col">
          <span className="text-xs font-black text-[#002147] tracking-tighter leading-none mb-0.5">{currency.code}</span>
          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">{currency.code === 'USD' ? 'Dólar' : currency.name.split(' ')[0]}</span>
        </div>
      </div>

      {/* Center: Rates */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col items-end min-w-[45px]">
          <span className="text-[6px] font-bold text-slate-300 uppercase tracking-tighter">Compra</span>
          <span className="text-[11px] font-bold text-slate-400">
            {loading ? '---' : buyingRate.toLocaleString('es-PY')}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-100" />
        <div className="flex flex-col items-start min-w-[50px]">
          <span className="text-[6px] font-black text-[#002147] uppercase tracking-tighter">Venta</span>
          <span className="text-xs font-black text-[#002147] tracking-tight">
            {loading ? '---' : sellingRate.toLocaleString('es-PY')}
          </span>
        </div>
      </div>

      {/* Vertical Separator */}
      <div className="h-8 w-px bg-slate-100/80 mx-1" />

      {/* Action Button */}
      <div className="flex items-center">
        <button
          onClick={onOpenConverter}
          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#002147] hover:text-white transition-all duration-300 active:scale-95 group/btn border border-transparent hover:border-[#002147]/10"
          title="Abrir conversor"
        >
          <Calculator className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function ManualCard({ manual, onClick }: { manual: Manual, onClick: () => void }) {
  const Icon = manual.icon

  return (
    <button
      onClick={onClick}
      className="group bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 text-left relative overflow-hidden"
    >
      <div className={`w-12 h-12 rounded-2xl ${manual.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">{manual.category}</span>
        </div>
        <h3 className="text-sm font-black text-[#002147] leading-tight mb-2 group-hover:text-blue-600 transition-colors">{manual.title}</h3>
        <p className="text-[11px] font-medium text-slate-400 leading-relaxed line-clamp-2">{manual.description}</p>
      </div>
      <div className="mt-auto pt-2 flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
        Ver Manual <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  )
}

function ManualModal({ manual, onClose }: { manual: Manual, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#002147]/40 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-[3rem] shadow-2xl border border-white/20 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-8 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-3xl ${manual.color} shadow-sm`}>
                <manual.icon className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 block mb-1">{manual.category}</span>
                <h2 className="text-2xl font-black text-[#002147] tracking-tight">{manual.title}</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300 hover:text-[#002147]">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="prose prose-slate max-w-none">
            <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              {manual.content.split('**').map((part, i) => (
                i % 2 === 1 ? <b key={i} className="font-black text-[#002147]">{part}</b> : part
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#002147] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-900 transition-all shadow-lg active:scale-95"
            >
              Comprendido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CurrencyModal({
  currency,
  buyingValue,
  onClose
}: {
  currency: CurrencyData,
  buyingValue: number,
  onClose: () => void
}) {
  const [currencyAmount, setCurrencyAmount] = useState<string>('1')
  const [pygAmount, setPygAmount] = useState<string>('')
  const sellingRate = currency.rate

  useEffect(() => {
    if (sellingRate) {
      setPygAmount(Math.round(1 * sellingRate).toLocaleString('es-PY'))
    }
  }, [sellingRate])

  const handleCurrencyChange = (val: string) => {
    setCurrencyAmount(val)
    const num = parseFloat(val.replace(',', '.'))
    if (!isNaN(num)) {
      setPygAmount(Math.round(num * sellingRate).toLocaleString('es-PY'))
    } else {
      setPygAmount('')
    }
  }

  const handlePygChange = (val: string) => {
    const cleanVal = val.replace(/\./g, '')
    setPygAmount(val)
    const num = parseFloat(cleanVal.replace(',', '.'))
    if (!isNaN(num)) {
      const result = num / sellingRate
      setCurrencyAmount(result.toLocaleString('es-PY', { maximumFractionDigits: 2 }))
    } else {
      setCurrencyAmount('')
    }
  }

  const formatPygInput = (val: string) => {
    const clean = val.replace(/\./g, '').replace(/\D/g, '')
    if (clean === '') return ''
    return parseInt(clean).toLocaleString('es-PY')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#002147]/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="text-3xl p-3 bg-slate-50 rounded-2xl">{currency.flag}</div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-[#002147] tracking-tighter leading-none">{currency.code}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currency.name}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-[#002147]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Rates Info */}
          <div className="flex gap-4 p-4 bg-slate-50 rounded-3xl mb-8 border border-slate-100/50">
            <div className="flex-1">
              <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Compra</span>
              <span className="text-lg font-black text-slate-400 tracking-tight">{buyingValue.toLocaleString('es-PY')}</span>
            </div>
            <div className="w-px bg-slate-200 my-1" />
            <div className="flex-1 pl-2">
              <span className="block text-[8px] font-black text-[#002147] uppercase tracking-widest mb-1">Venta</span>
              <span className="text-lg font-black text-[#002147] tracking-tight">{sellingRate.toLocaleString('es-PY')}</span>
            </div>
          </div>

          {/* Converter Inputs */}
          <div className="space-y-4">
            <div className="relative group">
              <label className="text-[10px] font-bold text-[#002147] uppercase tracking-widest ml-4 mb-1 block opacity-50">Cantidad ({currency.code})</label>
              <input
                type="text"
                value={currencyAmount}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                autoFocus
                className="w-full bg-slate-50 border-2 border-transparent focus:border-[#002147]/10 text-2xl font-black text-[#002147] px-6 py-4 rounded-3xl outline-none transition-all"
              />
              <span className="absolute right-6 bottom-4 text-xs font-black text-slate-300">{currency.code}</span>
            </div>

            <div className="h-2" /> {/* Spacer instead of icon */}

            <div className="relative group">
              <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest ml-4 mb-1 block opacity-50">Total aproximado (PYG)</label>
              <input
                type="text"
                value={pygAmount}
                onChange={(e) => handlePygChange(formatPygInput(e.target.value))}
                className="w-full bg-emerald-50 border-2 border-transparent focus:border-emerald-100 text-2xl font-black text-emerald-600 px-6 py-4 rounded-3xl outline-none transition-all"
              />
              <span className="absolute right-6 bottom-4 text-xs font-black text-emerald-200">PYG</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
            Cálculo basado en las fuentes de Cambios Chaco
          </p>
        </div>
      </div>
    </div>
  )
}
