'use client'

import { Sidebar } from './Sidebar'

interface MainLayoutProps {
    children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col md:ml-64">
                <header className="h-1 bg-primary w-full" />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}
