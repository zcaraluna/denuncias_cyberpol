'use client'

import { useState, useEffect } from 'react'
import { 
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Zap,
  Building2,
  Calendar
} from 'lucide-react'

export default function PresupuestoPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(data)
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 antialiased">
      {/* Header Minimalista */}
      <header className="py-16 px-6 max-w-5xl mx-auto border-b border-slate-200 mb-16 flex items-center justify-between">
        <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#002147] rounded-xl flex items-center justify-center shadow-2xl shadow-blue-900/20">
                <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tight text-[#002147] uppercase leading-none mb-2">Cyberpol</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Habilitación y Presupuesto Operativo</p>
            </div>
        </div>
        <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Referencia Institucional</p>
            <p className="text-sm font-bold text-[#002147]">DCHPEF - Paraguay</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 space-y-20 pb-32">
        {/* Metrica de Uso */}
        <section className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left pr-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carga Diaria Promedio</p>
                    <p className="text-2xl font-black text-[#002147]">
                        {loading ? '...' : `${metrics?.avgComplaintsPerDay.toFixed(1)} denuncias`}
                    </p>
                </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic">Metodología de cálculo basada en registros completados a la fecha.</p>
        </section>

        {/* Planes de Inversión */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Plan A */}
            <div className="bg-white p-12 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-[#002147] text-white text-[9px] font-black uppercase tracking-widest rounded-full">Opción A</span>
                    <Zap className="w-5 h-5 text-blue-500 opacity-20" />
                </div>
                <div className="space-y-3">
                    <h3 className="text-2xl font-black text-[#002147] tracking-tight">Habilitación Corporativa</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">Habilitación total e ilimitada para todas las oficinas institucionales existentes.</p>
                </div>
                <div className="pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inversión Única</p>
                    <p className="text-5xl font-black text-[#002147] tracking-tighter tabular-nums">{formatPYG(35000000)}</p>
                    <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">* Pago por derecho de uso y licenciamiento perpetuo de software.</p>
                </div>
            </div>

            {/* Plan B */}
            <div className="bg-white p-12 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-slate-100 text-[#002147] text-[9px] font-black uppercase tracking-widest rounded-full">Opción B</span>
                    <Building2 className="w-5 h-5 text-blue-500 opacity-20" />
                </div>
                <div className="space-y-3">
                    <h3 className="text-2xl font-black text-[#002147] tracking-tight">Habilitación por Oficina</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">Derecho de uso especializado por cada sede operativa independiente.</p>
                </div>
                <div className="pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inversión por Unidad</p>
                    <p className="text-5xl font-black text-[#002147] tracking-tighter tabular-nums">{formatPYG(6000000)}</p>
                    <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">* Escalabilidad sujeta a requerimientos operativos por oficina.</p>
                </div>
            </div>
        </section>

        {/* Sostenimiento y Mantenimiento */}
        <section className="bg-[#002147] p-12 sm:p-16 rounded-[48px] text-white shadow-2xl shadow-blue-900/30">
            <div className="max-w-3xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h3 className="text-2xl font-black tracking-tight uppercase">Presupuesto de Sostenimiento Anual</h3>
                    <p className="text-blue-200/60 text-sm leading-relaxed max-w-xl mx-auto">
                        Inversión operativa obligatoria para garantizar soporte técnico, redundancia de datos y actualizaciones de seguridad.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-10 border-y border-white/5">
                    <div className="text-center sm:text-left space-y-1">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Base de Sostenimiento</p>
                        <p className="text-4xl font-black tabular-nums">{formatPYG(5500000)}</p>
                        <p className="text-[10px] text-blue-200/40 italic">Costo actual por oficina</p>
                    </div>
                    <div className="text-center sm:text-left space-y-1 sm:border-l sm:border-white/10 sm:pl-10">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Incremento Indexado</p>
                        <p className="text-4xl font-black tabular-nums">+ {formatPYG(1500000)}</p>
                        <p className="text-[10px] text-blue-200/40 italic">Ajuste anual operativo</p>
                    </div>
                </div>

                {/* Nota de Hardware */}
                <div className="bg-white/5 rounded-3xl p-8 border border-white/10 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-12 h-12 bg-amber-400/10 rounded-2xl flex items-center justify-center shrink-0">
                        <AlertCircle className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white mb-1 uppercase tracking-tight">Especificación Técnica de Adquisición</p>
                        <p className="text-xs text-blue-200/60 leading-relaxed font-medium">
                            Los montos detallados cubren la **habilitación del software**. No está incluida la adquisición de hardware de terceros. La DCHPEF proveerá la presupuestación técnica para compras externas.
                        </p>
                    </div>
                </div>
            </div>
        </section>
      </main>

      <footer className="py-20 text-center border-t border-slate-100 max-w-5xl mx-auto">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-2">Cyberpol Security System</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-30">© {new Date().getFullYear()} DCHPEF - Todos los derechos reservados</p>
      </footer>
    </div>
  )
}
