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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Elementos decorativos de fondo muy sutiles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[30%] h-[30%] rounded-full bg-blue-100/40 blur-[100px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[30%] h-[30%] rounded-full bg-slate-200/40 blur-[100px]"></div>
      </div>

      <div className="max-w-[400px] w-full mx-4 relative z-10">
        <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 p-8 md:p-10 border border-slate-200/50">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
              <Shield className="h-7 w-7 text-[#002147]" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-black text-[#002147] tracking-tighter mb-1">
              CYBERPOL
            </h1>
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.15em]">
              Departamento de Delitos Económicos
            </p>
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
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              D.C.H.P.E.F. © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

