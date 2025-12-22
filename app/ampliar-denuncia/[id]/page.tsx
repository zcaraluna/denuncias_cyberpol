'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Usuario {
  id: number
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
}

interface Denuncia {
  id: number
  orden: number
  fecha_denuncia: string
  tipo_denuncia: string
  otro_tipo: string | null
}

export default function AmpliarDenunciaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [denuncia, setDenuncia] = useState<Denuncia | null>(null)
  const [loading, setLoading] = useState(true)
  const [relato, setRelato] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [denunciaId, setDenunciaId] = useState<string>('')

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setDenunciaId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    const usuarioStr = sessionStorage.getItem('usuario')
    if (!usuarioStr) {
      router.push('/')
      return
    }

    try {
      const usuarioData = JSON.parse(usuarioStr)
      setUsuario(usuarioData)
    } catch (error) {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    if (denunciaId && usuario) {
      cargarDenuncia()
    }
  }, [denunciaId, usuario])

  const cargarDenuncia = async () => {
    if (!denunciaId || !usuario) return
    
    try {
      const response = await fetch(`/api/denuncias/ver/${denunciaId}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Error al cargar denuncia')
      
      const data = await response.json()
      
      // Verificar que la denuncia esté completada
      if (data.estado !== 'completada') {
        alert('Solo se pueden crear ampliaciones para denuncias completadas')
        router.push(`/ver-denuncia/${denunciaId}`)
        return
      }

      setDenuncia({
        id: data.id,
        orden: data.orden,
        fecha_denuncia: data.fecha_denuncia,
        tipo_denuncia: data.tipo_denuncia,
        otro_tipo: data.otro_tipo
      })
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar la denuncia')
      router.push('/mis-denuncias')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!relato.trim()) {
      alert('Por favor ingrese el relato de la ampliación')
      return
    }

    if (!usuario || !denuncia) return

    setGuardando(true)

    try {
      const response = await fetch('/api/denuncias/ampliacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          denuncia_id: denuncia.id,
          relato: relato.trim(),
          usuario_id: usuario.id,
          operador_grado: usuario.grado,
          operador_nombre: usuario.nombre,
          operador_apellido: usuario.apellido
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar ampliación')
      }

      alert('Ampliación creada exitosamente')
      router.push(`/ver-denuncia/${denunciaId}`)
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar la ampliación')
    } finally {
      setGuardando(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('usuario')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!usuario || !denuncia) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">No se encontró la denuncia</div>
      </div>
    )
  }

  const año = denuncia.fecha_denuncia.split('-')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={`/ver-denuncia/${denunciaId}`} className="text-gray-600 hover:text-gray-900">
              ← Volver a Ver Denuncia
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Ampliación de Denuncia</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Nueva Ampliación
              </h2>
              <p className="text-gray-600">
                Denuncia Nº {denuncia.orden}/{año} - {denuncia.tipo_denuncia === 'OTRO' && denuncia.otro_tipo ? denuncia.otro_tipo : denuncia.tipo_denuncia}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="relato" className="block text-sm font-medium text-gray-700 mb-2">
                  Relato de la Ampliación *
                </label>
                <textarea
                  id="relato"
                  value={relato}
                  onChange={(e) => setRelato(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Ingrese el relato de la ampliación..."
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Este texto aparecerá en el PDF de la ampliación después del segundo párrafo.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Link
                  href={`/ver-denuncia/${denunciaId}`}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium text-center"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={guardando || !relato.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardando ? 'Guardando...' : 'Guardar Ampliación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}





