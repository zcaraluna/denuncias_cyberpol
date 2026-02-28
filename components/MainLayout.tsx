'use client'

import { Sidebar } from './Sidebar'

interface MainLayoutProps {
    children: React.ReactNode
    hideSidebar?: boolean
}

export function MainLayout({ children, hideSidebar = false }: MainLayoutProps) {
    return (
        <div className="flex min-h-screen bg-background">
            {!hideSidebar && <Sidebar />}
            <div className={`flex-1 flex flex-col ${hideSidebar ? '' : 'md:ml-64'}`}>
                {!hideSidebar && <header className="h-1 bg-primary w-full" />}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}
