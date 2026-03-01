'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Shield, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

      <div className="max-w-[440px] w-full mx-4 relative z-10">
        <div className="bg-white rounded-[40px] shadow-2xl p-10 md:p-12 border border-slate-200/60">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-slate-50 rounded-3xl mb-6 ring-1 ring-slate-100">
              <Shield className="h-10 w-10 text-[#002147]" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-[#002147] tracking-tight mb-2 uppercase">
              CYBERPOL
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Departamento de Delitos Económicos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="usuario" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Usuario de Sistema
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-[#002147] placeholder:text-slate-300 focus:bg-white focus:border-[#002147] focus:ring-4 focus:ring-blue-900/5 outline-none transition-all"
                  placeholder="Ej: jgarcia"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="contraseña" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="contraseña"
                  type={showPassword ? "text" : "password"}
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-[#002147] placeholder:text-slate-300 focus:bg-white focus:border-[#002147] focus:ring-4 focus:ring-blue-900/5 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider text-center animate-in fade-in zoom-in-95">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#002147] text-white py-5 px-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#003366] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white/50" />
                  PROCESANDO...
                </>
              ) : (
                'INICIAR SESIÓN'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              D.C.H.P.E.F. © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

