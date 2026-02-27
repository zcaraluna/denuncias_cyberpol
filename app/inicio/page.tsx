'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/MainLayout'
import {
  TrendingUp,
  RefreshCw,
  Clock,
  ArrowRightLeft
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
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchRates = async () => {
    setLoading(true)
    try {
      const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/PYG`)
      const data = await response.json()
      if (data.result === 'success') {
        setRates(data.conversion_rates)
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

  const currencies: CurrencyData[] = [
    { code: 'USD', name: 'Dólar Americano', flag: '🇺🇸', rate: rates['USD'] ? 1 / rates['USD'] : 0, color: 'text-emerald-600 bg-emerald-50' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺', rate: rates['EUR'] ? 1 / rates['EUR'] : 0, color: 'text-blue-600 bg-blue-50' },
    { code: 'BRL', name: 'Real Brasileño', flag: '🇧🇷', rate: rates['BRL'] ? 1 / rates['BRL'] : 0, color: 'text-amber-600 bg-amber-50' },
    { code: 'ARS', name: 'Peso Argentino', flag: '🇦🇷', rate: rates['ARS'] ? 1 / rates['ARS'] : 0, color: 'text-sky-600 bg-sky-50' },
  ]

  return (
    <MainLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#002147] tracking-tight mb-1">
              Bienvenido, {usuario.grado} {usuario.apellido}
            </h1>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
              {usuario.oficina} • Dashboard Informativo
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Última actualización</span>
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

        {/* Section Title */}
        <div className="flex items-center gap-2 mb-8 pl-1">
          <div className="w-1.5 h-6 bg-[#002147] rounded-full" />
          <h2 className="text-lg font-bold text-slate-800">Conversor de Moneda Extranjera</h2>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {currencies.map((currency) => (
            <CurrencyCard key={currency.code} currency={currency} loading={loading} />
          ))}
        </div>

        {/* Professional Footer */}
        <div className="mt-16 flex flex-col items-center">
          <div className="w-20 h-1 bg-gradient-to-r from-transparent via-[#002147]/10 to-transparent mb-8" />
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-2xl leading-relaxed">
            Sistema de monitoreo de divisas para uso exclusivo de la Dirección Contra Hechos Punibles Económicos y Financieros.
            <span className="block mt-1 opacity-50 italic">Los valores son de carácter informativo y pueden variar según el mercado local.</span>
          </p>
        </div>
      </div>
    </MainLayout>
  )
}

function CurrencyCard({ currency, loading }: { currency: CurrencyData, loading: boolean }) {
  const [amount, setAmount] = useState<string>('1')
  const total = loading ? 0 : (parseFloat(amount) || 0) * currency.rate

  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-[#002147]/5 transition-all duration-500 flex flex-col">
      {/* Header Moneda */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="text-2xl filter drop-shadow-sm grayscale-[0.2] group-hover:grayscale-0 transition-all">{currency.flag}</div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-[#002147] tracking-tight">{currency.code}</span>
              <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${currency.color.includes('emerald') ? 'text-emerald-700 bg-emerald-50' : currency.color.includes('blue') ? 'text-blue-700 bg-blue-50' : currency.color.includes('amber') ? 'text-amber-700 bg-amber-50' : 'text-sky-700 bg-sky-50'}`}>Live</div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{currency.name.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      {/* Input Group */}
      <div className="space-y-6 flex-grow">
        <div className="group/input">
          <label className="block text-[9px] font-bold uppercase text-slate-400 mb-2 tracking-[0.1em] pl-0.5">
            Monto a Convertir
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-[#002147] focus:bg-white focus:border-[#002147] focus:ring-4 focus:ring-[#002147]/5 transition-all outline-none"
              placeholder="0.00"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-30">
              <span className="text-[10px] font-black">{currency.code}</span>
              <ArrowRightLeft className="w-3 h-3" />
            </div>
          </div>
        </div>

        <div className="relative pt-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3 bg-slate-200 rounded-full" />
            <label className="block text-[9px] font-bold uppercase text-slate-500 tracking-[0.1em]">
              Equivalente en PYG
            </label>
          </div>
          <div className="flex items-baseline gap-2 pl-0.5">
            <span className="text-2xl font-extrabold text-[#002147] tracking-tighter">
              {loading ? '---' : Math.round(total).toLocaleString('es-PY')}
            </span>
            <span className="text-[10px] font-black text-slate-300 tracking-wider">PYG</span>
          </div>
          {/* Subtle underline */}
          <div className="h-0.5 w-full bg-slate-50 mt-4 rounded-full" />
        </div>
      </div>

      {/* Buying/Selling References */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] uppercase font-bold text-slate-400 tracking-widest">Referencia Compra</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/30" />
            <span className="text-xs font-bold text-slate-600">
              {loading ? '---' : Math.round(currency.rate * 0.988).toLocaleString('es-PY')}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className="text-[8px] uppercase font-bold text-slate-400 tracking-widest">Referencia Venta</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">
              {loading ? '---' : Math.round(currency.rate * 1.012).toLocaleString('es-PY')}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400/30" />
          </div>
        </div>
      </div>
    </div>
  )
}
