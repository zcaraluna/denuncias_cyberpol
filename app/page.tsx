'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Shield, Lock, User, Eye, EyeOff, Loader2, Phone, Globe, X } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDevModal, setShowDevModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario, contraseña }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Credenciales inválidas')
        setLoading(false)
        return
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('usuario', JSON.stringify(data.usuario))
      }

      if (data.debe_cambiar_contraseña) {
        router.push('/cambiar-password')
      } else {
        router.push('/inicio')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#002147] relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-slate-900/40 blur-[120px]"></div>
      </div>

      <div className="max-w-[400px] w-full mx-4 relative z-10">
        <div className="bg-white rounded-[32px] shadow-2xl p-8 md:p-10 border border-slate-200/60">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
              <Shield className="h-7 w-7 text-[#002147]" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-black text-[#002147] tracking-tighter mb-1 uppercase">
              CYBERPOL
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="usuario" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Usuario
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#002147] placeholder:text-slate-300 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                  placeholder="Usuario"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contraseña" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="contraseña"
                  type={showPassword ? "text" : "password"}
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  required
                  className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#002147] placeholder:text-slate-300 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider text-center border border-red-100 animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#002147] text-white py-4 px-4 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-[#003366] active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-blue-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-white/50" />
                  PROCESANDO...
                </>
              ) : (
                'INICIAR SESIÓN'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <button
              onClick={() => setShowDevModal(true)}
              className="text-[9px] font-bold text-slate-300 hover:text-slate-400 uppercase tracking-[0.2em] transition-colors"
            >
              desarrollado por <span className="text-slate-400 font-black">s1mple.dev</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Desarrollador */}
      {showDevModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-[#002147]/40 backdrop-blur-sm"
            onClick={() => setShowDevModal(false)}
          ></div>
          <div className="bg-white rounded-[32px] shadow-2xl p-6 md:p-8 border border-slate-200/60 w-full max-w-[360px] relative z-10 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowDevModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-[#002147] transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
                <Globe className="h-6 w-6 text-[#002147]" />
              </div>
              <h2 className="text-sm font-black text-[#002147] uppercase tracking-widest">
                Información de Desarrollador
              </h2>
            </div>

            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 mb-6">
              <p className="text-[10px] font-black text-[#002147] uppercase tracking-tight mb-4 text-center leading-relaxed">
                Oficial Segundo PS Lic.<br />GUILLERMO RECALDE
              </p>

              <div className="space-y-3">
                <a
                  href="https://wa.me/595973408754"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-600 hover:text-emerald-600 transition-colors"
                >
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  +595 973 408 754
                </a>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <a
                    href="https://s1mple.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-2 py-3 bg-white border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 hover:text-[#002147] hover:border-blue-100 transition-all shadow-sm"
                  >
                    <Globe className="h-3 w-3 mb-1" />
                    s1mple.dev
                  </a>
                  <a
                    href="https://s1mple.cloud"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-2 py-3 bg-white border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 hover:text-[#002147] hover:border-blue-100 transition-all shadow-sm"
                  >
                    <Globe className="h-3 w-3 mb-1" />
                    s1mple.cloud
                  </a>
                </div>
              </div>
            </div>

            <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest opacity-50">
              Cyberpol System © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
