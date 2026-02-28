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

        {/* Single Frame Currency List */}
        <div className="mb-12 max-w-3xl mx-auto">
          <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-slate-100 p-2 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
            <div className="flex flex-col">
              {currencies.map((currency, index) => (
                <div key={currency.code}>
                  <CurrencyListItem
                    currency={currency}
                    loading={loading}
                    buyingValue={rates[currency.code]?.compra || 0}
                  />
                  {index < currencies.length - 1 && (
                    <div className="mx-6 h-px bg-slate-50" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Professional Footer */}
        <div className="mt-16 flex flex-col items-center">
          <div className="w-20 h-1 bg-gradient-to-r from-transparent via-[#002147]/10 to-transparent mb-8" />
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-2xl leading-relaxed">
            Sistema de monitoreo de divisas para uso exclusivo de la Dirección Contra Hechos Punibles Económicos y Financieros.
            <span className="block mt-1 opacity-50 italic">Los valores son obtenidos en tiempo real de Cambios Chaco para fines informativos.</span>
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
    <div className="p-4 hover:bg-white/80 transition-all duration-300 flex items-center justify-between group rounded-2xl">
      {/* Left Part: Flag & Name */}
      <div className="flex items-center gap-4 min-w-[140px]">
        <div className="text-xl filter drop-shadow-sm grayscale-[0.2] group-hover:grayscale-0 transition-all">{currency.flag}</div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-[#002147] tracking-tight leading-none mb-1">{currency.code}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{currency.name}</span>
        </div>
      </div>

      {/* Center: Rates */}
      <div className="flex items-center gap-8 flex-grow justify-center px-4">
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Compra (Ref)</span>
          <span className="text-sm font-bold text-slate-500">
            {loading ? '---' : buyingRate.toLocaleString('es-PY')}
          </span>
        </div>
        <div className="h-6 w-px bg-slate-100" />
        <div className="flex flex-col items-start">
          <span className="text-[8px] font-black text-[#002147] uppercase tracking-tighter mb-0.5">Venta (Real)</span>
          <span className="text-lg font-black text-[#002147] tracking-tight">
            {loading ? '---' : sellingRate.toLocaleString('es-PY')}
          </span>
        </div>
      </div>

      {/* Right: Quick Converter */}
      <div className="flex items-center gap-3 bg-slate-50/80 p-1.5 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-[#002147]/5 transition-all">
        <div className="relative w-16">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent border-none text-[11px] font-black text-[#002147] pl-1 pr-6 py-1 outline-none focus:ring-0"
          />
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-300 uppercase">{currency.code}</span>
        </div>
        <div className="flex flex-col items-end min-w-[70px]">
          <span className="text-[11px] font-black text-emerald-600 leading-none">
            {loading ? '---' : convertedValue.toLocaleString('es-PY')}
          </span>
          <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter mt-0.5">Guaraníes</span>
        </div>
      </div>
    </div>
  )
}
