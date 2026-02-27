'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/MainLayout'
import {
  TrendingUp,
  DollarSign,
  Euro,
  Coins,
  ArrowRightLeft,
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Cotizaciones del Mercado</h2>
          </div>
          <button
            onClick={fetchRates}
            className="flex items-center gap-2 text-sm font-bold text-[#002147] hover:bg-slate-100 px-4 py-2 rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Currency Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {currencies.map((currency) => (
            <div
              key={currency.code}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 ${currency.color} opacity-10 rounded-full group-hover:scale-125 transition-transform duration-500`} />

              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{currency.flag}</span>
                <span className="text-xs font-black text-slate-400 tracking-tighter">{currency.code}</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-500">{currency.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#002147]">
                    {loading ? '---' : Math.round(currency.rate).toLocaleString('es-PY')}
                  </span>
                  <span className="text-xs font-bold text-slate-400">PYG</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black text-slate-300 tracking-wider">Compra</span>
                  <span className="text-xs font-bold text-slate-600">
                    {loading ? '---' : Math.round(currency.rate * 0.985).toLocaleString('es-PY')}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] uppercase font-black text-slate-300 tracking-wider">Venta</span>
                  <span className="text-xs font-bold text-slate-600">
                    {loading ? '---' : Math.round(currency.rate * 1.015).toLocaleString('es-PY')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Informative Section */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#002147] to-[#003366] rounded-3xl p-8 text-white relative overflow-hidden">
            <ArrowRightLeft className="absolute right-0 bottom-0 w-64 h-64 -mb-16 -mr-16 text-white/5" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4">Análisis de Divisas</h3>
              <p className="text-blue-100 leading-relaxed mb-6">
                Este panel proporciona una visualización rápida de las tasas de conversión actuales.
                Los valores de compra y venta son aproximados y se calculan basándose en la tasa media del mercado proporcionada por la API.
              </p>
              <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex-1">
                  <span className="block text-[10px] uppercase font-bold text-blue-200 mb-1">Volatilidad</span>
                  <span className="text-lg font-bold">Baja</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex-1">
                  <span className="block text-[10px] uppercase font-bold text-blue-200 mb-1">Tendencia</span>
                  <span className="text-lg font-bold">Estable</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <Coins className="w-6 h-6 text-[#002147]" />
              <h3 className="text-lg font-bold text-slate-800">Recursos Útiles</h3>
            </div>
            <ul className="space-y-4">
              {['Banco Central del Paraguay', 'Cotización SET', 'Prevención de Lavado'].map((item) => (
                <li key={item} className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm font-semibold text-slate-600 group-hover:text-[#002147] transition-colors">{item}</span>
                  <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:bg-[#002147] group-hover:text-white transition-all">→</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

