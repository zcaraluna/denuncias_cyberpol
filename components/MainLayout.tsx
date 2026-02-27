'use client'

import { Sidebar } from './Sidebar'

interface MainLayoutProps {
    children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 transition-all md:ml-64">
                {children}
            </main>
        </div>
    )
}
