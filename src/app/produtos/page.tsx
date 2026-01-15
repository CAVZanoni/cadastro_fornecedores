'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Plus, Pencil, Trash2 } from 'lucide-react'

type Produto = {
    id: number
    nome: string
    unidade: string
    createdAt: string
}

export default function ProdutosPage() {
    const [data, setData] = useState<Produto[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)

    const [form, setForm] = useState({
        nome: '',
        unidade: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const res = await fetch('/api/produtos')
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.nome || !form.unidade) return
        setSubmitting(true)
        try {
            const url = editId ? `/api/produtos/${editId}` : '/api/produtos'
            const method = editId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            if (res.ok) {
                resetForm()
                fetchData()
            }
        } finally {
            setSubmitting(false)
        }
    }

    function resetForm() {
        setForm({ nome: '', unidade: '' })
        setEditId(null)
    }

    function handleEdit(item: Produto) {
        setEditId(item.id)
        setForm({
            nome: item.nome,
            unidade: item.unidade
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function handleDelete(id: number) {
        if (!confirm('Excluir este produto?')) return
        try {
            const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchData()
            } else {
                const err = await res.json()
                alert(err.error || 'Erro ao excluir')
            }
        } catch (error) {
            alert('Erro ao excluir')
        }
    }

    return (
        <div className="h-full overflow-auto p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-slate-800">Produtos</h1>

                <Card>
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-[2] w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
                            <input
                                type="text"
                                value={form.nome}
                                onChange={e => setForm({ ...form, nome: e.target.value })}
                                placeholder="Ex: Cimento CP-II"
                                className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                            <input
                                type="text"
                                value={form.unidade}
                                onChange={e => setForm({ ...form, unidade: e.target.value })}
                                placeholder="Ex: SC, KG, UN"
                                className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            {editId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors h-[42px]"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                disabled={submitting}
                                className={`flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap h-[42px] px-6`}
                            >
                                {editId ? <Pencil size={18} /> : <Plus size={18} />}
                                {editId ? 'Salvar' : 'Cadastrar'}
                            </button>
                        </div>
                    </form>
                </Card>

                <Card className="overflow-hidden p-0 shadow-sm border border-slate-200">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 w-20">ID</th>
                                <th className="p-4 font-semibold text-slate-600">Nome</th>
                                <th className="p-4 font-semibold text-slate-600">Unidade</th>
                                <th className="p-4 font-semibold text-slate-600 text-right w-24">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Carregando...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Nenhum produto cadastrado.</td></tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${editId === item.id ? 'bg-blue-50' : ''}`}>
                                        <td className="p-4 text-slate-500">#{item.id}</td>
                                        <td className="p-4 font-medium text-slate-900">{item.nome}</td>
                                        <td className="p-4 text-slate-600">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-700 border border-slate-200">
                                                {item.unidade}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    )
}
