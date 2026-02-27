'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    PlusCircle,
    FileText,
    Users,
    History,
    ShieldCheck,
    Search,
    BarChart3,
    LogOut,
    User as UserIcon
} from 'lucide-react'

const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/nueva-denuncia', label: 'Nueva Denuncia', icon: PlusCircle },
    { href: '/mis-denuncias', label: 'Mis Denuncias', icon: FileText },
    { href: '/denuncias', label: 'Consultar', icon: Search },
    { href: '/reportes', label: 'Reportes', icon: BarChart3 },
]

const adminItems = [
    { href: '/gestion-usuarios', label: 'Usuarios', icon: Users, roles: ['admin', 'superadmin'] },
    { href: '/log-visitas', label: 'Auditoría', icon: History, roles: ['admin', 'superadmin'] },
    { href: '/gestion-dispositivos', label: 'Dispositivos', icon: ShieldCheck, roles: ['superadmin'] },
]

export function Sidebar() {
    const pathname = usePathname()
    const { usuario, logout } = useAuth()

    if (!usuario) return null

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card shadow-lg transition-transform md:translate-x-0">
            <div className="flex h-full flex-col px-4 py-6">
                {/* Header */}
                <div className="mb-10 flex items-center gap-2 px-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                        <ShieldCheck className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold tracking-tight text-foreground">CYBERPOL</span>
                        <span className="text-[10px] font-medium uppercase text-muted-foreground tracking-wider">Sistema de Denuncias</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("h-4.5 w-4.5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                                {item.label}
                            </Link>
                        )
                    })}

                    {/* Admin Items Section */}
                    {(usuario.rol === 'admin' || usuario.rol === 'superadmin') && (
                        <div className="pt-6">
                            <span className="mb-2 block px-3 text-[10px] font-semibold uppercase text-muted-foreground tracking-widest">
                                Administración
                            </span>
                            <div className="space-y-1">
                                {adminItems
                                    .filter(item => item.roles.includes(usuario.rol))
                                    .map((item) => {
                                        const Icon = item.icon
                                        const isActive = pathname === item.href
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                                )}
                                            >
                                                <Icon className={cn("h-4.5 w-4.5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                                                {item.label}
                                            </Link>
                                        )
                                    })}
                            </div>
                        </div>
                    )}
                </nav>

                {/* Footer / User Info */}
                <div className="mt-auto border-t pt-4">
                    <div className="mb-4 flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UserIcon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-xs font-semibold text-foreground">
                                {usuario.grado} {usuario.apellido}
                            </span>
                            <span className="truncate text-[10px] text-muted-foreground">
                                {usuario.oficina}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                        <LogOut className="h-4.5 w-4.5" />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </aside>
    )
}
