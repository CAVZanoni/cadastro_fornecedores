'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
    Clock,
    User as UserIcon,
    Activity,
    Search,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    AlertCircle,
    Trash2,
    FileEdit,
    PlusCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface LogEntry {
    id: number
    userId: number
    action: string
    entity: string
    entityId: number | null
    details: string | null
    createdAt: string
    user: {
        name: string | null
        email: string
    }
}

export default function LogsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterAction, setFilterAction] = useState('ALL')
    const [filterEntity, setFilterEntity] = useState('ALL')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
        if (session && session.user?.email !== 'admin@sistema.com') {
            router.push('/')
        }
    }, [session, status, router])

    useEffect(() => {
        if (session?.user?.email === 'admin@sistema.com') {
            fetchLogs()
        }
    }, [session])

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/audit')
            const data = await res.json()
            setLogs(data)
        } catch (error) {
            console.error('Error fetching logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.user.name?.toLowerCase().includes(search.toLowerCase()) ||
            log.user.email.toLowerCase().includes(search.toLowerCase()) ||
            log.details?.toLowerCase().includes(search.toLowerCase()) ||
            log.entity.toLowerCase().includes(search.toLowerCase())

        const matchesAction = filterAction === 'ALL' || log.action === filterAction
        const matchesEntity = filterEntity === 'ALL' || log.entity === filterEntity

        return matchesSearch && matchesAction && matchesEntity
    })

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE': return <PlusCircle className="text-emerald-500" size={18} />
            case 'UPDATE': return <FileEdit className="text-blue-500" size={18} />
            case 'DELETE': return <Trash2 className="text-red-500" size={18} />
            default: return <Activity className="text-slate-400" size={18} />
        }
    }

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'CREATE': return 'Criação'
            case 'UPDATE': return 'Edição'
            case 'DELETE': return 'Exclusão'
            default: return action
        }
    }

    if (status === 'loading' || loading) {
        return <div className="p-8 text-center text-slate-500">Carregando logs...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="text-blue-600" />
                        Logs do Sistema
                    </h1>
                    <p className="text-slate-500 text-sm">Registro histórico de todas as alterações feitas na plataforma.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por usuário, ação ou detalhes..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-sm"
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                    >
                        <option value="ALL">Todas Ações</option>
                        <option value="CREATE">Criação</option>
                        <option value="UPDATE">Edição</option>
                        <option value="DELETE">Exclusão</option>
                    </select>
                    <select
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-sm"
                        value={filterEntity}
                        onChange={(e) => setFilterEntity(e.target.value)}
                    >
                        <option value="ALL">Todas Entidades</option>
                        <option value="LICITACAO">Licitação</option>
                        <option value="FORNECEDOR">Fornecedor</option>
                        <option value="PRODUTO">Produto</option>
                        <option value="PROPOSTA">Proposta</option>
                        <option value="ITEM">Item</option>
                        <option value="CATEGORIA">Categoria</option>
                        <option value="UNIDADE">Unidade</option>
                        <option value="USER">Usuário</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider w-40">Data/Hora</th>
                                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider w-48">Usuário</th>
                                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">Ação</th>
                                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">Entidade</th>
                                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500">
                                        Nenhum registro encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                <Clock size={14} className="text-slate-400" />
                                                {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-900">{log.user.name || 'Sem Nome'}</span>
                                                <span className="text-xs text-slate-500">{log.user.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getActionIcon(log.action)}
                                                <span className="text-sm font-medium text-slate-700">{getActionLabel(log.action)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                {log.entity}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-3">
                                                {log.details || <span className="text-slate-400">Sem detalhes registrados</span>}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
