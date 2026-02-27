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
        setLastUpdate(new Date().toLocaleTimeString())
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!usuario || usuario.debe_cambiar_contraseña) {
    return null
  }

  const currencies: CurrencyData[] = [
    { code: 'USD', name: 'Dólar Americano', flag: '🇺🇸', rate: rates['USD'] ? 1 / rates['USD'] : 0, color: 'bg-green-500' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺', rate: rates['EUR'] ? 1 / rates['EUR'] : 0, color: 'bg-blue-600' },
    { code: 'BRL', name: 'Real Brasileño', flag: '🇧🇷', rate: rates['BRL'] ? 1 / rates['BRL'] : 0, color: 'bg-yellow-500' },
    { code: 'ARS', name: 'Peso Argentino', flag: '🇦🇷', rate: rates['ARS'] ? 1 / rates['ARS'] : 0, color: 'bg-sky-400' },
  ]

  return (
    <MainLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#002147] tracking-tight">
              Bienvenido, {usuario.grado} {usuario.apellido}
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              {usuario.oficina} • Sistema de Denuncias CYBERPOL
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-lg ring-1 ring-slate-200">
            <Clock className="w-3.5 h-3.5" />
            Última actualización: {lastUpdate || '---'}
          </div>
        </div>

        {/* Currency Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Conversor de Divisas</h2>
          </div>
          <button
            onClick={fetchRates}
            className="flex items-center gap-1.5 text-xs font-bold text-[#002147] bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Currency Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {currencies.map((currency) => (
            <CurrencyCard key={currency.code} currency={currency} loading={loading} />
          ))}
        </div>

        {/* Unified Footer Info */}
        <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200/50 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-black text-[#002147] uppercase tracking-wider">Servicio en línea</span>
          </div>
          <h3 className="text-slate-800 font-bold mb-2">Monitor de Cotizaciones en Tiempo Real</h3>
          <p className="text-slate-500 text-sm max-w-lg mb-0 font-medium">
            Tasas de cambio obtenidas directamente de fuentes de mercado globales.
            Valores de compra y venta calculados para uso referencial por personal de la
            <b> Dirección Contra Hechos Punibles Económicos y Financieros</b>.
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
    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
      {/* Accent Background */}
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 ${currency.color} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-3xl filter drop-shadow-sm">{currency.flag}</span>
          <div className="flex flex-col">
            <span className="text-sm font-black text-[#002147] tracking-tight">{currency.code}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{currency.name.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      {/* Converter Body */}
      <div className="space-y-6 relative z-10">
        <div className="relative group/input">
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">
            Monto en {currency.code}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-xl font-black text-[#002147] focus:bg-white focus:border-[#002147]/10 transition-all outline-none"
              placeholder="0.00"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-40">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">
            Convertido a PYG
          </label>
          <div className="flex flex-col gap-0.5 px-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#002147] tracking-tighter">
                {loading ? '---' : Math.round(total).toLocaleString('es-PY')}
              </span>
              <span className="text-[10px] font-black text-slate-300 tracking-widest">PYG</span>
            </div>
            <div className={`h-1 w-12 rounded-full ${currency.color} opacity-20`} />
          </div>
        </div>
      </div>

      {/* Spread Footer */}
      <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black text-slate-300 tracking-wider">Referencia Compra</span>
          <span className="text-xs font-black text-slate-500">
            {loading ? '---' : Math.round(currency.rate * 0.985).toLocaleString('es-PY')}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[9px] uppercase font-black text-slate-300 tracking-wider">Referencia Venta</span>
          <span className="text-xs font-black text-slate-500">
            {loading ? '---' : Math.round(currency.rate * 1.015).toLocaleString('es-PY')}
          </span>
        </div>
      </div>
    </div>
  )
}
