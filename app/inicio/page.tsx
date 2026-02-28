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

  // Sanitizar nombre: Tomar primer nombre y primer apellido
  const primerNombre = usuario.nombre ? usuario.nombre.split(' ')[0] : ''
  const primerApellido = usuario.apellido ? usuario.apellido.split(' ')[0] : ''

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
              Bienvenido, {usuario.grado} <span className="uppercase">{primerNombre} {primerApellido}</span>
            </h1>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
              {usuario.oficina}
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

        {/* Cambios Chaco Widget - Versión Sutil & Reposicionada */}
        <div className="flex justify-start mb-10 pl-1">
          <div className="w-full max-w-sm bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-500">
            <iframe
              width="100%"
              height="320"
              src="https://www.cambioschaco.com.py/widgets/cotizacion/?lang=es"
              frameBorder="0"
              title="Cotizaciones Cambios Chaco"
              className="rounded-2xl grayscale-[0.3] opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
            ></iframe>
          </div>
        </div>

        {/* Grid Section (Oculto por ahora) */}
        {false && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currencies.map((currency) => (
              <CurrencyCard key={currency.code} currency={currency} loading={loading} />
            ))}
          </div>
        )}

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

  const sellingRate = Math.round(currency.rate * 1.012)
  const buyingRate = Math.round(currency.rate * 0.988)
  const convertedValue = amount ? Math.round(parseFloat(amount.replace(',', '.')) * sellingRate) : 0

  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-[#002147]/5 transition-all duration-500 flex flex-col">
      {/* Header Moneda */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="text-2xl filter drop-shadow-sm grayscale-[0.2] transition-all">{currency.flag}</div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-[#002147] tracking-tight">{currency.code}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{currency.name.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      {/* Conversion Body */}
      <div className="space-y-6 flex-grow">
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3 bg-[#002147]/20 rounded-full" />
            <label className="block text-[9px] font-bold uppercase text-slate-500 tracking-[0.1em]">
              Cotización referencial de venta
            </label>
          </div>
          <div className="flex items-baseline gap-2 pl-0.5">
            <span className="text-3xl font-extrabold text-[#002147] tracking-tighter">
              {loading ? '---' : sellingRate.toLocaleString('es-PY')}
            </span>
            <span className="text-[10px] font-black text-slate-300 tracking-wider">PYG</span>
          </div>
        </div>

        {/* Subtle Converter */}
        <div className="pt-4 border-t border-slate-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Conversor rápido</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="relative group">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Cantidad"
                className="w-full bg-slate-50/50 border-none text-sm font-bold text-[#002147] px-3 py-2 rounded-xl focus:ring-1 focus:ring-[#002147]/10 transition-all outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">{currency.code}</span>
            </div>
            {amount && !loading && (
              <div className="px-1 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 italic">Equivale a:</span>
                <span className="text-xs font-black text-emerald-600">
                  {convertedValue.toLocaleString('es-PY')} <span className="text-[9px] opacity-70">PYG</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Reference */}
      <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[8px] uppercase font-bold text-slate-400 tracking-widest">Ref. Compra</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <span className="text-[11px] font-bold text-slate-500">
            {loading ? '---' : buyingRate.toLocaleString('es-PY')}
          </span>
        </div>
      </div>
    </div>
  )
}
