'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    FileText,
    Search,
    ShieldCheck,
    LogOut,
    User as UserIcon
} from 'lucide-react'

export function MiniHeader() {
    const pathname = usePathname()
    const { usuario, logout } = useAuth()

    if (!usuario) return null

    const navItems = [
        { href: '/inicio', label: 'Inicio', icon: LayoutDashboard },
        { href: '/mis-denuncias', label: 'Mis Denuncias', icon: FileText },
        { href: '/denuncias', label: 'Buscar Denuncia', icon: Search },
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo Section */}
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#002147] shadow-lg shadow-blue-900/10">
                        <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <div className="hidden flex-col sm:flex">
                        <span className="text-lg font-black tracking-tight text-[#002147] leading-none uppercase">CYBERPOL</span>
                        <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest mt-0.5">Sistema de Denuncias</span>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex items-center gap-1 sm:gap-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200",
                                    isActive
                                        ? "bg-[#002147]/10 text-[#002147]"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-[#002147]"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden md:inline">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* User & Logout Section */}
                <div className="flex items-center gap-4 border-l border-slate-100 pl-4 ml-2">
                    <div className="hidden lg:flex flex-col items-end">
                        <span className="text-[10px] font-black text-[#002147] uppercase leading-none mb-0.5">
                            {usuario.grado} {usuario.apellido}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                            {usuario.oficina}
                        </span>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200 group"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </header>
    )
}
