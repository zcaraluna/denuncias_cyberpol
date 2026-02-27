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
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[#1a2e4c] bg-[#051124] shadow-2xl transition-transform md:translate-x-0">
            <div className="flex h-full flex-col px-4 py-6">
                {/* Header */}
                <div className="mb-10 flex items-center gap-3 px-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-black/20 ring-1 ring-white/10">
                        <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-tight text-white">CYBERPOL</span>
                        <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Sistema de Denuncias</span>
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
                                        ? "bg-primary text-white shadow-lg shadow-black/20"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <Icon className={cn("h-4.5 w-4.5", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                                {item.label}
                            </Link>
                        )
                    })}

                    {/* Admin Items Section */}
                    {(usuario.rol === 'admin' || usuario.rol === 'superadmin') && (
                        <div className="pt-6">
                            <span className="mb-3 block px-3 text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em]">
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
                                                        ? "bg-primary text-white shadow-lg shadow-black/20"
                                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                                )}
                                            >
                                                <Icon className={cn("h-4.5 w-4.5", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                                                {item.label}
                                            </Link>
                                        )
                                    })}
                            </div>
                        </div>
                    )}
                </nav>

                {/* Footer / User Info */}
                <div className="mt-auto border-t border-[#1a2e4c] pt-6">
                    <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-blue-400">
                            <UserIcon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-xs font-bold text-white">
                                {usuario.grado} {usuario.apellido}
                            </span>
                            <span className="truncate text-[10px] font-medium text-slate-400">
                                {usuario.oficina}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
                    >
                        <LogOut className="h-4.5 w-4.5" />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </aside>
    )
}
