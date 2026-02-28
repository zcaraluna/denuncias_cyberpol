'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/MainLayout'
import {
  TrendingUp,
  RefreshCw,
  Clock
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

        {/* Ultra-Compact Single Frame Currency List */}
        <div className="mb-10 max-w-xl">
          <div className="bg-white/70 backdrop-blur-md rounded-[2rem] border border-slate-100 p-1.5 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden">
            <div className="flex flex-col">
              {currencies.map((currency, index) => (
                <div key={currency.code}>
                  <CurrencyListItem
                    currency={currency}
                    loading={loading}
                    buyingValue={rates[currency.code]?.compra || 0}
                  />
                  {index < currencies.length - 1 && (
                    <div className="mx-4 h-px bg-slate-50" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Professional Footer */}
        <div className="mt-12 flex flex-col items-start px-4">
          <div className="w-12 h-1 bg-[#002147]/10 rounded-full mb-4" />
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider max-w-xl leading-relaxed">
            Monitoreo exclusivo DCHPEF.
            <span className="opacity-50 italic ml-1">Valores Tiempo Real: Cambios Chaco.</span>
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
  const [amount, setAmount] = useState<string>('1')

  const sellingRate = currency.rate
  const buyingRate = buyingValue
  const convertedValue = amount ? Math.round(parseFloat(amount.replace(',', '.')) * sellingRate) : 0

  return (
    <div className="py-2 px-4 hover:bg-white/90 transition-all duration-300 flex items-center justify-between group rounded-xl">
      {/* Left Part: Flag & Name */}
      <div className="flex items-center gap-3 min-w-[110px]">
        <div className="text-lg filter grayscale-[0.3] group-hover:grayscale-0 transition-all">{currency.flag}</div>
        <div className="flex flex-col">
          <span className="text-xs font-black text-[#002147] tracking-tighter leading-none mb-0.5">{currency.code}</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{currency.code === 'USD' ? 'Dólar' : currency.name.split(' ')[0]}</span>
        </div>
      </div>

      {/* Center: Rates */}
      <div className="flex items-center gap-6 flex-grow justify-center px-2">
        <div className="flex flex-col items-end">
          <span className="text-[7px] font-bold text-slate-300 uppercase tracking-tighter">Compra</span>
          <span className="text-xs font-bold text-slate-400">
            {loading ? '---' : buyingRate.toLocaleString('es-PY')}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-100" />
        <div className="flex flex-col items-start">
          <span className="text-[7px] font-black text-[#002147] uppercase tracking-tighter">Venta</span>
          <span className="text-sm font-black text-[#002147] tracking-tight">
            {loading ? '---' : sellingRate.toLocaleString('es-PY')}
          </span>
        </div>
      </div>

      {/* Right: Quick Converter */}
      <div className="flex items-center gap-2 bg-slate-50/50 p-1 rounded-lg border border-slate-100/50 group-hover:bg-white transition-all scale-95 group-hover:scale-100 origin-right">
        <div className="relative w-12">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent border-none text-[10px] font-black text-[#002147] pl-1 pr-4 py-0.5 outline-none focus:ring-0"
          />
          <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[7px] font-bold text-slate-300 uppercase">{currency.code}</span>
        </div>
        <div className="flex flex-col items-end min-w-[60px]">
          <span className="text-[10px] font-black text-emerald-600 leading-none">
            {loading ? '---' : convertedValue.toLocaleString('es-PY')}
          </span>
          <span className="text-[6px] font-black text-slate-300 uppercase tracking-tighter">PYG</span>
        </div>
      </div>
    </div>
  )
}
