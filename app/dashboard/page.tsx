'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEffect } from 'react'
import { MainLayout } from '@/components/MainLayout'
import {
  PlusCircle,
  FileText,
  Search,
  BarChart3,
  Users,
  ShieldCheck
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { usuario, loading, logout } = useAuth()

  useEffect(() => {
    // Si el usuario debe cambiar la contraseña, redirigir
    if (!loading && usuario && usuario.debe_cambiar_contraseña) {
      router.push('/cambiar-password')
    }
  }, [usuario, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  // Si debe cambiar contraseña, no mostrar nada (se está redirigiendo)
  if (usuario.debe_cambiar_contraseña) {
    return null
  }

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Panel de Control
          </h2>
          <p className="text-muted-foreground">
            Gestión centralizada de denuncias policiales
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/nueva-denuncia"
            className="group bg-card rounded-xl border p-6 hover:border-primary/50 hover:shadow-md transition-all duration-300 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                Nueva Denuncia
              </h3>
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <PlusCircle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Crear una nueva denuncia policial detallada
            </p>
          </Link>

          <Link
            href="/mis-denuncias"
            className="group bg-card rounded-xl border p-6 hover:border-primary/50 hover:shadow-md transition-all duration-300 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                Mis Denuncias
              </h3>
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Administrar tus borradores y denuncias enviadas
            </p>
          </Link>

          <Link
            href="/denuncias"
            className="group bg-card rounded-xl border p-6 hover:border-primary/50 hover:shadow-md transition-all duration-300 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                Consultar
              </h3>
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Search className="w-6 h-6" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              {usuario.rol === 'admin' || usuario.rol === 'superadmin'
                ? 'Explorar todas las denuncias en el sistema'
                : 'Buscar denuncia específica por código o hash'}
            </p>
          </Link>

          <Link
            href="/reportes"
            className="group bg-card rounded-xl border p-6 hover:border-primary/50 hover:shadow-md transition-all duration-300 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                Estadísticas
              </h3>
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Visualizar métricas y generar reportes mensuales
            </p>
          </Link>

          {(usuario.rol === 'admin' || usuario.rol === 'superadmin') && (
            <>
              <Link
                href="/gestion-usuarios"
                className="group bg-card rounded-xl border p-6 hover:border-primary/50 hover:shadow-md transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    Usuarios
                  </h3>
                  <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Administrar personal y permisos de acceso
                </p>
              </Link>
            </>
          )}

          {usuario.rol === 'superadmin' && (
            <Link
              href="/gestion-dispositivos"
              className="group bg-card rounded-xl border p-6 hover:border-primary/50 hover:shadow-md transition-all duration-300 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  Dispositivos
                </h3>
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                Control de terminales y seguridad de red
              </p>
            </Link>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

