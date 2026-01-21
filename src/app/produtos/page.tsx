'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Plus, Pencil, Trash2 } from 'lucide-react'

type Categoria = { id: number; nome: string }
type Unidade = { id: number; sigla: string; nome: string | null }

type Produto = {
    id: number
    nome: string
    categoriaId: number | null
    categoria?: Categoria | null
    unidadeId: number | null
    unidade?: Unidade | null
    unidadeTexto?: string | null // Legacy
    createdAt: string
}

export default function ProdutosPage() {
    const [data, setData] = useState<Produto[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [unidades, setUnidades] = useState<Unidade[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)

    const [form, setForm] = useState({
        nome: '',
        categoriaId: '',
        unidadeId: ''
    })

    useEffect(() => {
        fetchData()
        fetchAuxiliaryData()
    }, [])

    async function fetchAuxiliaryData() {
        try {
            const [catRes, uniRes] = await Promise.all([
                fetch('/api/categorias'),
                fetch('/api/unidades')
            ])
            if (catRes.ok) setCategorias(await catRes.json())
            if (uniRes.ok) setUnidades(await uniRes.json())
        } catch {
            console.error('Erro ao buscar dados auxiliares')
        }
    }

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
        if (!form.nome) return
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
        setForm({ nome: '', categoriaId: '', unidadeId: '' })
        setEditId(null)
    }

    function handleEdit(item: Produto) {
        setEditId(item.id)
        setForm({
            nome: item.nome,
            categoriaId: item.categoriaId?.toString() || '',
            unidadeId: item.unidadeId?.toString() || ''
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
        } catch {
            alert('Erro ao excluir')
        }
    }

    return (
        <div className="h-full overflow-auto p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-slate-800">Produtos</h1>

                <Card>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                            <select
                                value={form.categoriaId}
                                onChange={e => setForm({ ...form, categoriaId: e.target.value })}
                                className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Selecione...</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
                            <input
                                type="text"
                                value={form.nome}
                                onChange={e => setForm({ ...form, nome: e.target.value.toUpperCase() })}
                                style={{ textTransform: 'uppercase' }}
                                placeholder="Ex: Cimento CP-II"
                                className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                            <select
                                value={form.unidadeId}
                                onChange={e => setForm({ ...form, unidadeId: e.target.value })}
                                className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Selecione...</option>
                                {unidades.map(uni => (
                                    <option key={uni.id} value={uni.id}>{uni.sigla} - {uni.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
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
                                className={`flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap h-[42px] px-6 shadow-sm`}
                            >
                                {editId ? <Pencil size={18} /> : <Plus size={18} />}
                                {editId ? 'Salvar' : 'Cadastrar'}
                            </button>
                        </div>
                    </form>
                </Card>

                <Card className="overflow-hidden p-0 shadow-sm border border-slate-200">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 w-20">ID</th>
                                <th className="p-4 font-semibold text-slate-600">Categoria</th>
                                <th className="p-4 font-semibold text-slate-600">Nome</th>
                                <th className="p-4 font-semibold text-slate-600">Unidade</th>
                                <th className="p-4 font-semibold text-slate-600 text-right w-24">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Carregando...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum produto cadastrado.</td></tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${editId === item.id ? 'bg-blue-50' : ''}`}>
                                        <td className="p-4 text-slate-400 text-xs font-mono">#{item.id}</td>
                                        <td className="p-4">
                                            {item.categoria ? (
                                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                    {item.categoria.nome}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-medium text-slate-900">{item.nome}</td>
                                        <td className="p-4 text-slate-600">
                                            {item.unidade ? (
                                                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-700 border border-slate-200" title={item.unidade.nome || ''}>
                                                    {item.unidade.sigla}
                                                </span>
                                            ) : item.unidadeTexto ? (
                                                <span className="px-2 py-1 bg-amber-50 rounded text-xs font-semibold text-amber-700 border border-amber-100 italic" title="Legacy">
                                                    {item.unidadeTexto}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
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
