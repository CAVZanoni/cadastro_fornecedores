'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'

type Proposta = {
    id: number
    numero: string
    licitacaoId: number
    fornecedorId: number
    licitacao: { nome: string }
    fornecedor: { nome: string }
    createdAt: string
}

type Option = { id: number, nome: string }

export default function PropostasPage() {
    const [propostas, setPropostas] = useState<Proposta[]>([])
    const [licitacoes, setLicitacoes] = useState<Option[]>([])
    const [fornecedores, setFornecedores] = useState<Option[]>([])

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)

    const [form, setForm] = useState({
        numero: '',
        licitacaoId: '',
        fornecedorId: ''
    })

    useEffect(() => {
        refreshData()
    }, [])

    async function refreshData() {
        Promise.all([
            fetch('/api/propostas').then(r => r.json()),
            fetch('/api/licitacoes').then(r => r.json()),
            fetch('/api/fornecedores').then(r => r.json())
        ]).then(([props, lics, forns]) => {
            setPropostas(props)
            setLicitacoes(lics)
            setFornecedores(forns)
            setLoading(false)
        })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.numero || !form.licitacaoId || !form.fornecedorId) return
        setSubmitting(true)
        try {
            const url = editId ? `/api/propostas/${editId}` : '/api/propostas'
            const method = editId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            if (res.ok) {
                resetForm()
                refreshData()
            }
        } finally {
            setSubmitting(false)
        }
    }

    function resetForm() {
        setForm({ numero: '', licitacaoId: '', fornecedorId: '' })
        setEditId(null)
    }

    function handleEdit(item: Proposta) {
        setEditId(item.id)
        setForm({
            numero: item.numero,
            licitacaoId: String(item.licitacaoId),
            fornecedorId: String(item.fornecedorId)
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function handleDelete(id: number) {
        if (!confirm('Excluir esta proposta e todos os seus itens?')) return
        try {
            const res = await fetch(`/api/propostas/${id}`, { method: 'DELETE' })
            if (res.ok) {
                refreshData()
            } else {
                alert('Erro ao excluir')
            }
        } catch (error) {
            alert('Erro ao excluir')
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Propostas</h1>

            <Card>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nº Proposta</label>
                        <input
                            type="text"
                            value={form.numero}
                            onChange={e => setForm({ ...form, numero: e.target.value })}
                            placeholder="123/2026"
                            className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Licitação</label>
                        <select
                            value={form.licitacaoId}
                            onChange={e => setForm({ ...form, licitacaoId: e.target.value })}
                            className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 bg-white"
                            required
                        >
                            <option value="">Selecione...</option>
                            {licitacoes.map(l => (
                                <option key={l.id} value={l.id}>{l.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fornecedor</label>
                        <select
                            value={form.fornecedorId}
                            onChange={e => setForm({ ...form, fornecedorId: e.target.value })}
                            className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 bg-white"
                            required
                        >
                            <option value="">Selecione...</option>
                            {fornecedores.map(f => (
                                <option key={f.id} value={f.id}>{f.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        {editId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors h-10"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            disabled={submitting}
                            className={`flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 h-10`}
                        >
                            {editId ? <Pencil size={18} /> : <Plus size={18} />}
                            {editId ? 'Salvar' : 'Criar'}
                        </button>
                    </div>
                </form>
            </Card>

            <Card className="overflow-hidden p-0 shadow-sm border border-slate-200">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600 w-24">Número</th>
                            <th className="p-4 font-semibold text-slate-600">Licitação</th>
                            <th className="p-4 font-semibold text-slate-600">Fornecedor</th>
                            <th className="p-4 font-semibold text-slate-600 text-right w-44">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">Carregando...</td></tr>
                        ) : propostas.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">Nenhuma proposta cadastrada.</td></tr>
                        ) : (
                            propostas.map((item) => (
                                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${editId === item.id ? 'bg-blue-50' : ''}`}>
                                    <td className="p-4 font-medium text-slate-900">{item.numero}</td>
                                    <td className="p-4 text-slate-600">{item.licitacao?.nome}</td>
                                    <td className="p-4 text-slate-600">{item.fornecedor?.nome}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center gap-3">
                                            <Link
                                                href={`/propostas/${item.id}`}
                                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                title="Ver Detalhes"
                                            >
                                                <Eye size={16} /> Detalhes
                                            </Link>
                                            <div className="w-[1px] h-4 bg-slate-200"></div>
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
    )
}
