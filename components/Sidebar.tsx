'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useDeviceDetection } from '@/lib/hooks/useDeviceDetection'
import { cn, formatNombrePolicial } from '@/lib/utils'
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

// Items visibles en la barra de navegación móvil
const mobileNavItems = [
    { href: '/denuncias', label: 'Consultar', icon: Search },
    { href: '/reportes', label: 'Reportes', icon: BarChart3 },
]

const navItems = [
    { href: '/inicio', label: 'Inicio', icon: LayoutDashboard },
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
    const { esMovilReal, isLoaded } = useDeviceDetection()

    if (!usuario || !isLoaded) return null
    if (esMovilReal) return null // No mostrar sidebar en móviles reales, incluso en modo escritorio

    return (
        <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 border-r border-[#e2e8f0] bg-white shadow-sm flex-col transition-transform">
            <div className="flex h-full flex-col px-4 py-8">
                {/* Header */}
                <div className="mb-10 flex items-center gap-3 px-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#002147] shadow-lg shadow-blue-900/10">
                        <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-extrabold tracking-tight text-[#002147] leading-none">CYBERPOL</span>
                        <span className="mt-1 text-[10px] font-bold uppercase text-slate-500 tracking-widest">Sistema de Denuncias</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-7">
                    {/* General Items */}
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                                        isActive
                                            ? "bg-[#002147] text-white shadow-md shadow-blue-900/20"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-[#002147]"
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-[#002147]")} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Admin Items Section */}
                    {(usuario.rol === 'admin' || usuario.rol === 'superadmin') && (
                        <div className="pt-2">
                            <span className="mb-3 block px-3 text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">
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
                                                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                                                    isActive
                                                        ? "bg-[#002147] text-white shadow-md shadow-blue-900/20"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-[#002147]"
                                                )}
                                            >
                                                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-[#002147]")} />
                                                {item.label}
                                            </Link>
                                        )
                                    })}
                            </div>
                        </div>
                    )}
                </nav>

                {/* Footer / User Info */}
                <div className="mt-auto border-t border-slate-100 pt-6">
                    <div className="mb-6 flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm text-[#002147]">
                            <UserIcon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-xs font-bold text-slate-900">
                                {formatNombrePolicial(usuario.grado, usuario.nombre, usuario.apellido)}
                            </span>
                            <span className="truncate text-[10px] font-medium text-slate-500">
                                {usuario.oficina}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-red-600 transition-all hover:bg-red-50"
                    >
                        <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </aside>
    )
}

// Barra de navegación inferior para dispositivos móviles
export function MobileBottomNav() {
    const pathname = usePathname()
    const { usuario } = useAuth()
    const { esMovilReal, isLoaded } = useDeviceDetection()

    if (!usuario || !isLoaded) return null

    const esAdmin = usuario.rol === 'admin' || usuario.rol === 'superadmin'

    return (
        <nav className={cn(
            "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,33,71,0.08)]",
            esMovilReal ? "flex" : "md:hidden" // Forzar flex en móviles reales
        )}>
            <div className={`grid ${esAdmin ? 'grid-cols-3' : 'grid-cols-2'} h-16`}>
                {mobileNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 relative',
                                isActive
                                    ? 'text-[#002147]'
                                    : 'text-slate-400 hover:text-[#002147]'
                            )}
                        >
                            {isActive && (
                                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-[#002147] rounded-b-full" />
                            )}
                            <Icon className={cn('h-5 w-5', isActive ? 'text-[#002147]' : 'text-slate-400')} />
                            {item.label}
                        </Link>
                    )
                })}

                {/* Usuarios — solo para admin/superadmin */}
                {esAdmin && (() => {
                    const href = '/gestion-usuarios'
                    const isActive = pathname === href
                    return (
                        <Link
                            href={href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 relative',
                                isActive
                                    ? 'text-[#002147]'
                                    : 'text-slate-400 hover:text-[#002147]'
                            )}
                        >
                            {isActive && (
                                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-[#002147] rounded-b-full" />
                            )}
                            <Users className={cn('h-5 w-5', isActive ? 'text-[#002147]' : 'text-slate-400')} />
                            Usuarios
                        </Link>
                    )
                })()}
            </div>
        </nav>
    )
}
