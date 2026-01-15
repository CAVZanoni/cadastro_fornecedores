'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Gavel, Users, Package, FileText } from 'lucide-react'
import { clsx } from 'clsx'

const links = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Licitações', href: '/licitacoes', icon: Gavel },
    { name: 'Fornecedores', href: '/fornecedores', icon: Users },
    { name: 'Produtos', href: '/produtos', icon: Package },
    { name: 'Propostas', href: '/propostas', icon: FileText },
    { name: 'Relatórios', href: '/relatorios', icon: FileText },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="w-64 h-screen bg-slate-900 text-white flex flex-col p-4 fixed left-0 top-0 border-r border-slate-800">
            <h1 className="text-2xl font-bold mb-10 text-center tracking-tight text-blue-400">Propostas<span className="text-white">Manager</span></h1>
            <nav className="space-y-1 flex-1">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                                isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                            )}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{link.name}</span>
                        </Link>
                    )
                })}
            </nav>
            <div className="text-xs text-slate-600 mt-auto text-center">
                &copy; 2026 Sistema v1.0
            </div>
        </div>
    )
}
