'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Plus, Pencil, Trash2, ArrowUpDown, Search } from 'lucide-react'

type Categoria = { id: number; nome: string }
type Unidade = { id: number; sigla: string; nome: string | null }

type Produto = {
    id: number
    nome: string
    categoriaId: number | null
    categoria?: Categoria | null
    unidadeId: number | null
    unidade?: Unidade | null
    unidades?: Unidade[] // New field
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
    const [search, setSearch] = useState('')
    const [sortConfig, setSortConfig] = useState<{ key: keyof Produto | 'categoria_nome' | 'unidade_sigla', direction: 'asc' | 'desc' }>({ key: 'nome', direction: 'asc' })

    const [form, setForm] = useState<{
        nome: string;
        categoriaId: string;
        unidadeId: string;
        unidadeIds: number[];
    }>({
        nome: '',
        categoriaId: '',
        unidadeId: '',
        unidadeIds: []
    })

    const ThSort = ({ column, label, align = 'left', width }: {
        column: keyof Produto | 'categoria_nome' | 'unidade_sigla',
        label: string,
        align?: 'left' | 'right' | 'center',
        width?: string
    }) => (
        <th
            className={`p-4 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors select-none group ${width} text-${align}`}
            onClick={() => handleSort(column)}
        >
            <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
                {label}
                {sortConfig.key === column ? (
                    <ArrowUpDown size={14} className={`transition-transform ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                ) : (
                    <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-30" />
                )}
            </div>
        </th>
    )

    const handleSort = (key: keyof Produto | 'categoria_nome' | 'unidade_sigla') => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

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
        setForm({ nome: '', categoriaId: '', unidadeId: '', unidadeIds: [] })
        setEditId(null)
    }

    function handleEdit(item: Produto) {
        setEditId(item.id)
        setForm({
            nome: item.nome,
            categoriaId: item.categoriaId?.toString() || '',
            unidadeId: item.unidadeId?.toString() || '',
            unidadeIds: item.unidades?.map(u => u.id) || []
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

    const toggleUnidade = (id: number) => {
        setForm(prev => {
            const units = prev.unidadeIds.includes(id)
                ? prev.unidadeIds.filter(uid => uid !== id)
                : [...prev.unidadeIds, id]
            return { ...prev, unidadeIds: units }
        })
    }

    const filteredData = data.filter(item => {
        const matchesSearch = search.toLowerCase().split(' ').every(term =>
            item.nome.toLowerCase().includes(term) ||
            item.categoria?.nome.toLowerCase().includes(term)
        )
        return matchesSearch
    })

    const sortedData = [...filteredData].sort((a, b) => {
        let aVal: string | number | null | undefined = ''
        let bVal: string | number | null | undefined = ''

        if (sortConfig.key === 'categoria_nome') {
            aVal = a.categoria?.nome || ''
            bVal = b.categoria?.nome || ''
        } else if (sortConfig.key === 'unidade_sigla') {
            aVal = (a.unidades?.map(u => u.sigla).join(',') || a.unidade?.sigla || a.unidadeTexto || '')
            bVal = (b.unidades?.map(u => u.sigla).join(',') || b.unidade?.sigla || b.unidadeTexto || '')
        } else {
            const rawA = a[sortConfig.key as keyof Produto]
            const rawB = b[sortConfig.key as keyof Produto]
            aVal = (typeof rawA === 'string' || typeof rawA === 'number') ? rawA : String(rawA ?? '')
            bVal = (typeof rawB === 'string' || typeof rawB === 'number') ? rawB : String(rawB ?? '')
        }

        if (aVal === bVal) return 0
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        return sortConfig.direction === 'asc' ? 1 : -1
    })

    return (
        <div className="h-full overflow-auto p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-slate-800">Produtos</h1>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar produtos..."
                            value={search}
                            onChange={e => setSearch(e.target.value.toUpperCase())}
                            className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                            <div>
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
                            <div className="md:col-span-1 lg:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
                                <input
                                    type="text"
                                    value={form.nome}
                                    onChange={e => setForm({ ...form, nome: e.target.value.toUpperCase() })}
                                    style={{ textTransform: 'uppercase' }}
                                    placeholder="Ex: CIMENTO CP-II"
                                    className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500"
                                    required
                                />
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
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Unidades de Medida Permitidas</label>
                            <div className="flex flex-wrap gap-2">
                                {unidades.map(uni => (
                                    <button
                                        key={uni.id}
                                        type="button"
                                        onClick={() => toggleUnidade(uni.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.unidadeIds.includes(uni.id)
                                            ? 'bg-blue-100 border-blue-300 text-blue-700 ring-2 ring-blue-500/20'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                    >
                                        {uni.sigla} - {uni.nome}
                                    </button>
                                ))}
                                {unidades.length === 0 && <span className="text-sm text-slate-400 italic">Carregando unidades...</span>}
                            </div>
                        </div>
                    </form>
                </Card>

                <Card className="overflow-hidden p-0 shadow-sm border border-slate-200">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <ThSort column="id" label="ID" width="w-20" />
                                <ThSort column="categoria_nome" label="Categoria" />
                                <ThSort column="nome" label="Nome" />
                                <ThSort column="unidade_sigla" label="Unidade(s)" />
                                <th className="p-4 font-semibold text-slate-600 text-right w-24">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Carregando...</td></tr>
                            ) : sortedData.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum produto encontrado.</td></tr>
                            ) : (
                                sortedData.map((item) => (
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
                                            <div className="flex flex-wrap gap-1">
                                                {item.unidades && item.unidades.length > 0 ? (
                                                    item.unidades.map(u => (
                                                        <span key={u.id} className="px-2 py-1 bg-blue-50 rounded text-[10px] font-bold text-blue-700 border border-blue-100" title={u.nome || ''}>
                                                            {u.sigla}
                                                        </span>
                                                    ))
                                                ) : item.unidade ? (
                                                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-700 border border-slate-200" title={item.unidade.nome || ''}>
                                                        {item.unidade.sigla}
                                                    </span>
                                                ) : item.unidadeTexto ? (
                                                    <span className="px-2 py-1 bg-amber-50 rounded text-[10px] font-bold text-amber-700 border border-amber-100 italic" title="Legacy">
                                                        {item.unidadeTexto}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </div>
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
