'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLoginPage = pathname === '/login'

    if (isLoginPage) {
        return <>{children}</>
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 overflow-hidden h-screen bg-slate-50">
                {children}
            </main>
        </div>
    )
}
