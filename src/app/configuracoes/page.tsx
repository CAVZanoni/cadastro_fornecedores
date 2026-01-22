'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Plus, Trash2, Tag, Scale } from 'lucide-react'

type Categoria = {
    id: number
    nome: string
}

type Unidade = {
    id: number
    sigla: string
    nome: string | null
}

export default function ConfiguracoesPage() {
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [unidades, setUnidades] = useState<Unidade[]>([])
    const [loadingCat, setLoadingCat] = useState(true)
    const [loadingUni, setLoadingUni] = useState(true)

    // Form states
    const [catForm, setCatForm] = useState({ nome: '' })
    const [uniForm, setUniForm] = useState({ sigla: '', nome: '' })

    useEffect(() => {
        fetchCategorias()
        fetchUnidades()
    }, [])

    async function fetchCategorias() {
        try {
            const res = await fetch('/api/categorias')
            if (res.ok) setCategorias(await res.json())
        } finally {
            setLoadingCat(false)
        }
    }

    async function fetchUnidades() {
        try {
            const res = await fetch('/api/unidades')
            if (res.ok) setUnidades(await res.json())
        } finally {
            setLoadingUni(false)
        }
    }

    async function handleCatSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!catForm.nome) return
        try {
            const res = await fetch('/api/categorias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(catForm)
            })
            if (res.ok) {
                setCatForm({ nome: '' })
                fetchCategorias()
            }
        } catch (error) {
            console.error(error)
        }
    }

    async function handleUniSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!uniForm.sigla) return
        try {
            const res = await fetch('/api/unidades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(uniForm)
            })
            if (res.ok) {
                setUniForm({ sigla: '', nome: '' })
                fetchUnidades()
            }
        } catch (error) {
            console.error(error)
        }
    }

    async function handleDeleteCat(id: number) {
        if (!confirm('Excluir esta categoria?')) return
        try {
            const res = await fetch(`/api/categorias/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchCategorias()
            } else {
                const data = await res.json()
                alert(data.error || 'Erro ao excluir')
            }
        } catch { alert('Erro ao excluir') }
    }

    async function handleDeleteUni(id: number) {
        if (!confirm('Excluir esta unidade?')) return
        try {
            const res = await fetch(`/api/unidades/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchUnidades()
            } else {
                const data = await res.json()
                alert(data.error || 'Erro ao excluir')
            }
        } catch { alert('Erro ao excluir') }
    }

    return (
        <div className="h-full overflow-auto p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-slate-800">Configurações do Sistema</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Categorias */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xl font-semibold text-slate-700">
                            <Tag className="text-blue-600" />
                            <h2>Categorias de Produtos</h2>
                        </div>
                        <Card>
                            <form onSubmit={handleCatSubmit} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Nova categoria (ex: Informática)"
                                    value={catForm.nome}
                                    onChange={e => setCatForm({ nome: e.target.value.toUpperCase() })}
                                    style={{ textTransform: 'uppercase' }}
                                    className="flex-1 rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                                    <Plus size={18} /> Cadastrar
                                </button>
                            </form>
                        </Card>
                        <Card className="p-0 overflow-hidden shadow-sm border border-slate-200">
                            <table className="w-full text-left bg-white">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600">Nome</th>
                                        <th className="p-4 font-semibold text-slate-600 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingCat ? (
                                        <tr><td colSpan={2} className="p-4 text-center">Carregando...</td></tr>
                                    ) : categorias.length === 0 ? (
                                        <tr><td colSpan={2} className="p-4 text-center text-slate-500">Nenhuma categoria.</td></tr>
                                    ) : (
                                        categorias.map(cat => (
                                            <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4">{cat.nome}</td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteCat(cat.id)}
                                                        className="text-slate-400 hover:text-red-500 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </Card>
                    </div>

                    {/* Unidades */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xl font-semibold text-slate-700">
                            <Scale className="text-blue-600" />
                            <h2>Unidades de Medida</h2>
                        </div>
                        <Card>
                            <form onSubmit={handleUniSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Sigla (ex: kg)"
                                    value={uniForm.sigla}
                                    onChange={e => setUniForm({ ...uniForm, sigla: e.target.value.toUpperCase() })}
                                    style={{ textTransform: 'uppercase' }}
                                    className="rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Nome (ex: Kilograma)"
                                    value={uniForm.nome}
                                    onChange={e => setUniForm({ ...uniForm, nome: e.target.value.toUpperCase() })}
                                    style={{ textTransform: 'uppercase' }}
                                    className="rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button className="sm:col-span-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2">
                                    <Plus size={18} /> Cadastrar
                                </button>
                            </form>
                        </Card>
                        <Card className="p-0 overflow-hidden shadow-sm border border-slate-200">
                            <table className="w-full text-left bg-white">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600 w-24">Sigla</th>
                                        <th className="p-4 font-semibold text-slate-600">Descrição</th>
                                        <th className="p-4 font-semibold text-slate-600 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingUni ? (
                                        <tr><td colSpan={3} className="p-4 text-center">Carregando...</td></tr>
                                    ) : unidades.length === 0 ? (
                                        <tr><td colSpan={3} className="p-4 text-center text-slate-500">Nenhuma unidade.</td></tr>
                                    ) : (
                                        unidades.map(uni => (
                                            <tr key={uni.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-bold">{uni.sigla}</td>
                                                <td className="p-4 text-slate-600">{uni.nome || '-'}</td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteUni(uni.id)}
                                                        className="text-slate-400 hover:text-red-500 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
