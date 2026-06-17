'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Shield, Lock, User, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function RecuperarPasswordPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [usuario, setUsuario] = useState('')
  const [preguntas, setPreguntas] = useState<string[]>([])
  const [respuestas, setRespuestas] = useState<string[]>(['', '', '', '', ''])
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmarContrasena, setConfirmarContrasena] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleBuscarPreguntas = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario.trim()) return

    setError('')
    setLoading(true)
    try {
      const response = await fetch(`/api/auth/recuperar-password/preguntas?usuario=${encodeURIComponent(usuario.trim())}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'No se pudieron obtener las preguntas de seguridad.')
        setLoading(false)
        return
      }

      setPreguntas(data.preguntas)
      setPaso(2)
    } catch (err) {
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleRestablecer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (respuestas.some(r => !r.trim())) {
      setError('Por favor, responda a todas las preguntas.')
      return
    }

    if (nuevaContrasena.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    const respuestasFormateadas = preguntas.map((preg, idx) => ({
      pregunta: preg,
      respuesta: respuestas[idx].trim()
    }))

    try {
      const response = await fetch('/api/auth/recuperar-password/restablecer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: usuario.trim(),
          respuestas: respuestasFormateadas,
          nueva_contraseña: nuevaContrasena
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al restablecer la contraseña.')
        setLoading(false)
        return
      }

      setMensajeExito(data.mensaje || 'Contraseña restablecida correctamente.')
      setPaso(3)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err) {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleRespuestaChange = (val: string, idx: number) => {
    const newAnswers = [...respuestas]
    newAnswers[idx] = val
    setRespuestas(newAnswers)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#002147] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-slate-900/40 blur-[120px]"></div>
      </div>

      <div className="max-w-[450px] w-full mx-4 relative z-10 py-10">
        <div className="bg-white rounded-[32px] shadow-2xl p-8 md:p-10 border border-slate-200/60">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
              <Shield className="h-7 w-7 text-[#002147]" strokeWidth={2} />
            </div>
            <h1 className="text-xl font-black text-[#002147] tracking-tight mb-1 uppercase">
              Recuperar Contraseña
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {paso === 1 && 'Ingrese su usuario para iniciar la recuperación'}
              {paso === 2 && 'Responda sus preguntas de seguridad pre-configuradas'}
              {paso === 3 && 'Proceso completado exitosamente'}
            </p>
          </div>

          {paso === 1 && (
            <form onSubmit={handleBuscarPreguntas} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="usuario" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nombre de Usuario
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="usuario"
                    type="text"
                    required
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#002147] placeholder:text-slate-300 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    placeholder="Usuario"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider text-center border border-red-100 animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#002147] text-white py-4 px-4 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-[#003366] active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-white/50" />
                      BUSCANDO PREGUNTAS...
                    </>
                  ) : (
                    'CONTINUAR'
                  )}
                </button>

                <Link
                  href="/"
                  className="w-full border-2 border-slate-100 text-slate-500 hover:text-[#002147] hover:border-blue-100 py-3.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al Login
                </Link>
              </div>
            </form>
          )}

          {paso === 2 && (
            <form onSubmit={handleRestablecer} className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-4">
                <span className="text-[8px] font-black uppercase tracking-widest text-[#002147]">Usuario Identificado</span>
                <p className="text-sm font-black text-[#002147] uppercase mt-0.5">{usuario}</p>
              </div>

              <div className="space-y-4">
                {preguntas.map((pregunta, idx) => (
                  <div key={idx} className="space-y-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                      {pregunta}
                    </label>
                    <input
                      type="text"
                      required
                      value={respuestas[idx]}
                      onChange={(e) => handleRespuestaChange(e.target.value, idx)}
                      placeholder="Ingrese su respuesta"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-[#002147] placeholder:text-slate-300 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    />
                  </div>
                ))}
              </div>

              <div className="h-px bg-slate-100 my-4" />

              <div className="space-y-1.5">
                <label htmlFor="nuevaContrasena" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nueva Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="nuevaContrasena"
                    type={showPassword ? "text" : "password"}
                    required
                    value={nuevaContrasena}
                    onChange={(e) => setNuevaContrasena(e.target.value)}
                    className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#002147] placeholder:text-slate-300 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    placeholder="Mínimo 6 caracteres"
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

              <div className="space-y-1.5">
                <label htmlFor="confirmarContrasena" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Confirmar Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirmarContrasena"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmarContrasena}
                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                    className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#002147] placeholder:text-slate-300 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    placeholder="Repita la contraseña"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider text-center border border-red-100 animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#002147] text-white py-4 px-4 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-[#003366] active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-white/50" />
                      PROCESANDO...
                    </>
                  ) : (
                    'RESTABLECER CONTRASEÑA'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaso(1)
                    setPreguntas([])
                    setRespuestas(['', '', '', '', ''])
                    setError('')
                  }}
                  className="w-full border-2 border-slate-100 text-slate-500 hover:text-[#002147] hover:border-blue-100 py-3.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Cambiar Usuario
                </button>
              </div>
            </form>
          )}

          {paso === 3 && (
            <div className="text-center py-6 space-y-6 animate-in zoom-in-95 duration-500">
              <div className="inline-flex p-4 bg-emerald-50 rounded-full border border-emerald-100 animate-bounce">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-emerald-800 uppercase tracking-wide">
                  Restablecimiento Exitoso
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[320px] mx-auto">
                  {mensajeExito} <br />
                  Será redirigido a la pantalla de inicio de sesión automáticamente.
                </p>
              </div>
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-[#002147]/45" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
