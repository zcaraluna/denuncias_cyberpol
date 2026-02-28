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
  X
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
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
        <div className="mb-10 max-w-sm">
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

        {/* Currency Converter Modal */}
        {isModalOpen && selectedCurrency && (
          <CurrencyModal
            currency={selectedCurrency}
            buyingValue={rates[selectedCurrency.code]?.compra || 0}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
    </MainLayout>
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
      <div className="ml-auto pr-2">
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
