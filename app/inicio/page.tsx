'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/MainLayout'
import {
  TrendingUp,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react'

const API_KEY = 'c26434662f9a1a4869628002'

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
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchRates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cotizaciones')
      const data = await response.json()
      if (!data.error) {
        // Adaptamos el formato de la API a lo que espera el estado
        setRates(data)
        setLastUpdate(new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' }))
      }
    } catch (error) {
      console.error('Error fetching rates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && usuario && usuario.debe_cambiar_contraseña) {
      router.push('/cambiar-password')
    }
    if (usuario) {
      fetchRates()
    }
  }, [usuario, authLoading, router])

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
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Última actualización (Chaco)</span>
              <span className="text-xs font-bold text-[#002147]">{lastUpdate || '--:--'}</span>
            </div>
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

        {/* Optimized Ultra-Compact Single Frame Currency List */}
        <div className="mb-10 max-w-md">
          <div className="bg-white/70 backdrop-blur-md rounded-[1.8rem] border border-slate-100 p-1 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden">
            <div className="flex flex-col">
              {currencies.map((currency, index) => (
                <div key={currency.code}>
                  <CurrencyListItem
                    currency={currency}
                    loading={loading}
                    buyingValue={rates[currency.code]?.compra || 0}
                  />
                  {index < currencies.length - 1 && (
                    <div className="mx-4 h-px bg-slate-50/50" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Professional Footer */}
        <div className="mt-8 flex flex-col items-start px-2">
          <div className="w-8 h-1 bg-[#002147]/10 rounded-full mb-3" />
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider max-w-xs leading-tight">
            Oficial DCHPEF.
            <span className="opacity-50 italic ml-1">Fuente: Cambios Chaco.</span>
          </p>
        </div>
      </div>
    </MainLayout>
  )
}

function CurrencyListItem({
  currency,
  loading,
  buyingValue
}: {
  currency: CurrencyData,
  loading: boolean,
  buyingValue: number
}) {
  const [currencyAmount, setCurrencyAmount] = useState<string>('1')
  const [pygAmount, setPygAmount] = useState<string>('')

  const sellingRate = currency.rate
  const buyingRate = buyingValue

  // Sincronización inicial
  useEffect(() => {
    if (!loading && sellingRate) {
      setPygAmount(Math.round(1 * sellingRate).toLocaleString('es-PY'))
    }
  }, [loading, sellingRate])

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
    // Limpiamos los puntos de millares para el cálculo
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

  // Función para formatear mientras se escribe en PYG (opcional, pero ayuda)
  const formatPygInput = (val: string) => {
    const clean = val.replace(/\./g, '').replace(/\D/g, '')
    if (clean === '') return ''
    return parseInt(clean).toLocaleString('es-PY')
  }

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

      {/* Right: Dual-Input Interactive Converter */}
      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        {/* Currency Input */}
        <div className="relative w-12 group/input">
          <input
            type="text"
            value={currencyAmount}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="w-full bg-slate-50/50 border border-transparent group-hover/input:border-slate-100 text-[10px] font-black text-[#002147] pl-1 pr-4 py-1 rounded-md outline-none focus:bg-white focus:ring-1 focus:ring-[#002147]/10 transition-all"
          />
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[6px] font-bold text-slate-300 uppercase">{currency.code}</span>
        </div>

        <ArrowRight className="w-2.5 h-2.5 text-slate-200" />

        {/* PYG Input */}
        <div className="relative w-24 group/input">
          <input
            type="text"
            value={loading ? '---' : pygAmount}
            onChange={(e) => handlePygChange(formatPygInput(e.target.value))}
            className="w-full bg-slate-50/50 border border-transparent group-hover/input:border-slate-100 text-[10px] font-black text-emerald-600 pl-1 pr-6 py-1 rounded-md outline-none focus:bg-white focus:ring-1 focus:ring-[#002147]/10 transition-all text-right"
          />
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[6px] font-bold text-slate-300 uppercase">PYG</span>
        </div>
      </div>
    </div>
  )
}
