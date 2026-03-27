'use client'

import { useState, useEffect } from 'react'
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  DollarSign,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import Link from 'next/link'

export default function PresupuestoPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [offices, setOffices] = useState(4) // Default based on Asu, CDE, Enc, Ov
  const [years, setYears] = useState(1)
  
  // Costos fijos (PYG)
  const PLAN_A_TOTAL = 35000000
  const PLAN_B_PER_OFFICE = 6000000
  const INITIAL_MAINTENANCE_BASE = 5500000
  const ANNUAL_INCREASE = 1500000

  useEffect(() => {
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(data)
        if (data.totalOffices > 0) setOffices(data.totalOffices)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error cargando métricas:', err)
        setLoading(false)
      })
  }, [])

  const formatPYG = (amount: number) => {
    return new Intl.NumberFormat('es-PY', { 
      style: 'currency', 
      currency: 'PYG',
      maximumFractionDigits: 0
    }).format(amount).replace('PYG', '₲')
  }

  const calculateMaintenanceForYear = (year: number) => {
    return (INITIAL_MAINTENANCE_BASE + (year * ANNUAL_INCREASE)) * offices
  }

  const calculateTotal = (plan: 'A' | 'B') => {
    const setupCost = plan === 'A' ? PLAN_A_TOTAL : PLAN_B_PER_OFFICE * offices
    
    let maintenanceTotal = 0
    for (let i = 1; i <= years; i++) {
        maintenanceTotal += calculateMaintenanceForYear(i)
    }
    
    return setupCost + maintenanceTotal
  }

  const projectionData = Array.from({ length: 5 }, (_, i) => ({
    name: `Año ${i + 1}`,
    mantenimiento: calculateMaintenanceForYear(i + 1) / 1000000
  }))

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navbar Minimalista */}
      <nav className="bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#002147] rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#002147] tracking-tight">CYBERPOL</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#002147]/60 font-black">Presupuesto y Métricas</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Encabezado */}
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-[#002147] tracking-tight">Panel Estratégico</h2>
          <p className="text-slate-500 max-w-2xl">Visualización técnica de costos operativos y métricas de desempeño del sistema de denuncias.</p>
        </div>

        {/* Sección de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <TrendingUp className="text-blue-600 w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">+12.5%</span>
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Denuncias x Día</p>
            <h3 className="text-4xl font-black text-[#002147]">
              {loading ? '...' : metrics?.avgComplaintsPerDay.toFixed(1)}
            </h3>
            <p className="text-xs text-slate-400 mt-2 italic">* Promedio histórico global</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <Clock className="text-indigo-600 w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400">Objetivo: &lt; 20m</span>
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Time-to-Report (Avg)</p>
            <h3 className="text-4xl font-black text-[#002147]">
              {loading ? '...' : `${Math.round(metrics?.avgFormulationTimeMinutes)} min`}
            </h3>
            <p className="text-xs text-slate-400 mt-2 italic">* Tiempo entre inicio y registro final</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <Building2 className="text-emerald-600 w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Activas</span>
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Oficinas Operativas</p>
            <h3 className="text-4xl font-black text-[#002147]">
              {loading ? '...' : metrics?.totalOffices}
            </h3>
            <p className="text-xs text-slate-400 mt-2 italic">* Habilitaciones vigentes a la fecha</p>
          </div>
        </div>

        {/* Sección de Presupuesto */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Calculadora */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-[#002147] rounded-3xl p-8 text-white shadow-2xl shadow-blue-900/40 relative overflow-hidden">
              {/* Decoración */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>

              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Calculator className="w-6 h-6 text-blue-300" />
                  </div>
                  <h3 className="text-2xl font-bold">Simulador de Inversión Tecnológica</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-blue-200 uppercase tracking-widest">Nº de Oficinas a Habilitar</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="1" 
                        max="50" 
                        value={offices}
                        onChange={(e) => setOffices(parseInt(e.target.value))}
                        className="flex-1 accent-blue-400"
                      />
                      <span className="text-3xl font-black min-w-[3rem] text-center">{offices}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-blue-200 uppercase tracking-widest">Proyección de Años</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={years}
                        onChange={(e) => setYears(parseInt(e.target.value))}
                        className="flex-1 accent-blue-400"
                      />
                      <span className="text-3xl font-black min-w-[3rem] text-center">{years}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-300">Plan A: Corporativo</span>
                      <Zap className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-xs text-blue-200/60 mb-1">Pago único (Setup inicial)</p>
                    <h4 className="text-2xl font-black mb-4">{formatPYG(calculateTotal('A'))}</h4>
                    <p className="text-[10px] text-blue-200/40 leading-relaxed italic">
                      Habilitación total para todas las oficinas existentes a la fecha.
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-300">Plan B: Escalamiento</span>
                      <Building2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-xs text-emerald-200/60 mb-1">Pago por unidad (Setup inicial)</p>
                    <h4 className="text-2xl font-black mb-4">{formatPYG(calculateTotal('B'))}</h4>
                    <p className="text-[10px] text-emerald-200/40 leading-relaxed italic">
                      Ideal para implementaciones progresivas o limitadas a oficinas clave.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de Mantenimiento */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-slate-700" />
                  </div>
                  <h3 className="text-xl font-bold text-[#002147]">Proyección de Costos Operativos</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Mantenimiento Anual Total</span>
                </div>
              </div>

              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis 
                      hide
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#002147] p-3 rounded-xl shadow-xl border border-white/10 border-white/20">
                              <p className="text-[10px] font-black text-blue-300 uppercase mb-1 tracking-widest">{payload[0].payload.name}</p>
                              <p className="text-sm font-bold text-white leading-none">
                                {formatPYG(payload[0].value as number * 1000000)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar 
                      dataKey="mantenimiento" 
                      radius={[6, 6, 6, 6]}
                      barSize={40}
                    >
                      {projectionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === years - 1 ? '#3b82f6' : '#e2e8f0'} 
                          className="transition-all duration-300"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detalles y Notas */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
              <h4 className="text-lg font-bold text-[#002147] flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Detalles del Presupuesto
              </h4>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Plan A: Inversión Única</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Pago fijo de ₲ 35.000.000 para habilitar todas las oficinas existentes a la fecha del cierre.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Plan B: Crecimiento Modular</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">₲ 6.000.000 por cada oficina habilitada. Útil para implementaciones por fases.</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-50">
                  <div className="mt-1">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Mantenimiento Anual</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Base actual: ₲ 5.500.000. Incremento indexado de ₲ 1.500.000 anual por oficina para soporte y actualizaciones.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer importante */}
            <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100 space-y-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">Nota Crítica</h4>
              </div>
              <p className="text-xs text-amber-800/80 leading-relaxed font-medium">
                Los planes aquí detallados cubren la **licencia, habilitación y mantenimiento del software**. 
              </p>
              <p className="text-xs text-amber-900 font-bold leading-relaxed border-l-2 border-amber-300 pl-4 py-1 bg-amber-100/30 rounded-r-lg">
                NO está incluida la adquisición del hardware (servidores, PCs, periféricos).
              </p>
              <p className="text-xs text-amber-800/80 leading-relaxed font-medium mt-2">
                Sin embargo, la DCHPEF puede proveer la presupuestación técnica y gestión para compras a través de proveedores externos autorizados.
              </p>
            </div>

            {/* CTA Final */}
            <button className="w-full bg-[#002147] text-white py-5 rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-[#003366] transition-all group shadow-xl shadow-blue-900/10">
              Generar Cotización PDF
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100">
        <div className="flex flex-col md:row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">DCHPEF - Dirección de Lucha Contra Hechos Punibles Económicos y Financieros</p>
          <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span className="hover:text-[#002147] cursor-pointer transition-colors">Soporte</span>
            <span className="hover:text-[#002147] cursor-pointer transition-colors">Términos</span>
            <span className="hover:text-[#002147] cursor-pointer transition-colors">v1.2.0</span>
          </div>
        </div>
      </footer>

      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-[#002147] uppercase tracking-widest animate-pulse">Analizando Datos...</p>
          </div>
        </div>
      )}
    </div>
  )
}
