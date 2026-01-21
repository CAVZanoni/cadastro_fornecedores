'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { UserPlus, Trash2, Mail, User as UserIcon, Shield } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type User = {
    id: number
    name: string | null
    email: string | null
    createdAt: string
}

export default function UsuariosPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated' && session.user?.email !== 'admin@sistema.com') {
            router.push('/')
        }
    }, [status, session, router])

    useEffect(() => {
        if (status === 'authenticated' && session.user?.email === 'admin@sistema.com') {
            fetchUsers()
        }
    }, [status, session])

    async function fetchUsers() {
        try {
            const res = await fetch('/api/users')
            const data = await res.json()
            setUsers(data)
        } catch {
            console.error('Erro ao buscar usuários')
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })

            if (res.ok) {
                setForm({ name: '', email: '', password: '' })
                fetchUsers()
                alert('Usuário criado com sucesso!')
            } else {
                const err = await res.json()
                alert(err.error || 'Erro ao criar usuário')
            }
        } catch {
            alert('Erro ao criar usuário')
        } finally {
            setSubmitting(false)
        }
    }

    if (status === 'loading' || (status === 'authenticated' && session.user?.email !== 'admin@sistema.com')) {
        return <div className="p-8 text-center text-slate-500 uppercase">Verificando permissões...</div>
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                    Gerenciamento de Usuários
                </h1>
                <p className="text-slate-500">Cadastre e gerencie quem pode acessar o sistema.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulário */}
                <Card className="lg:col-span-1 p-6 h-fit sticky top-6">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-blue-500" />
                        Novo Usuário
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    required
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    placeholder="Ex: AMANDA ALIATI"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    required
                                    type="email"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    placeholder="nome@compasa.com.br"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Senha Temporária</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-blue-500/25 mt-4"
                        >
                            {submitting ? 'Criando...' : 'Criar Usuário'}
                        </button>
                    </form>
                </Card>

                {/* Lista de Usuários */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold px-2">Usuários Cadastrados</h2>
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-slate-100 rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {users.map(user => (
                                <div
                                    key={user.id}
                                    className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between hover:border-slate-200 hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors border border-slate-100">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{user.name}</h3>
                                            <p className="text-sm text-slate-500 flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5" />
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Membro desde</p>
                                            <p className="text-xs text-slate-600">{new Date(user.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
