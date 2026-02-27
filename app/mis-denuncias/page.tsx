'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatearFechaSinTimezone } from '@/lib/utils/fecha'
import { MainLayout } from '@/components/MainLayout'
import { cn } from '@/lib/utils'

interface Denuncia {
  id: number
  nombre_denunciante: string
  cedula_denunciante: string
  fecha_denuncia: string
  hora_denuncia: string
  numero_orden: number
  tipo_hecho: string
  hash_denuncia: string
  estado: string
}

export default function MisDenunciasPage() {
  const router = useRouter()
  const { usuario, loading: authLoading, logout } = useAuth()
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'borrador' | 'completada'>('todos')

  const cargarDenuncias = async () => {
    if (!usuario) return

    try {
      const response = await fetch(`/api/denuncias/mias?usuario_id=${usuario.id}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Error al cargar denuncias')

      const data = await response.json()
      setDenuncias(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (usuario) {
      cargarDenuncias()
    }
  }, [usuario, filtroEstado])


  const verDenuncia = (id: number) => {
    router.push(`/ver-denuncia/${id}`)
  }

  const denunciasFiltradas = filtroEstado === 'todos'
    ? denuncias
    : denuncias.filter(d => d.estado === filtroEstado)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis Denuncias</h1>
            <p className="text-muted-foreground mt-1">Historial y seguimiento de tus diligencias</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">Filtrar por:</span>
            <button
              onClick={() => setFiltroEstado('todos')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                filtroEstado === 'todos'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltroEstado('completada')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                filtroEstado === 'completada'
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Completadas
            </button>
            <button
              onClick={() => setFiltroEstado('borrador')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                filtroEstado === 'borrador'
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Borradores
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Orden
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Denunciante
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Hecho Punible
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {denunciasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No se encontraron denuncias en esta categoría.
                    </td>
                  </tr>
                ) : (
                  denunciasFiltradas.map((denuncia) => (
                    <tr key={denuncia.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground">
                        #{denuncia.numero_orden}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground font-medium">
                        {denuncia.nombre_denunciante}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {denuncia.cedula_denunciante}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {denuncia.tipo_hecho}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatearFechaSinTimezone(denuncia.fecha_denuncia)} {denuncia.hora_denuncia}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full",
                            denuncia.estado === 'completada'
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {denuncia.estado === 'completada' ? 'Completada' : 'Borrador'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => verDenuncia(denuncia.id)}
                          className="text-primary hover:text-primary/80 font-semibold"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
