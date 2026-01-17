'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Trash2, Eye, Pencil, Paperclip } from 'lucide-react'
import Link from 'next/link'

type Proposta = {
    id: number
    numero: string
    licitacaoId: number
    fornecedorId: number
    licitacao: { nome: string }
    fornecedor: { nome: string }
    createdAt: string
    data: string // Manual date
    arquivoUrl?: string | null
    observacoes?: string | null
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
        fornecedorId: '',
        data: '',
        observacoes: ''
    })
    const [file, setFile] = useState<File | null>(null)

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
            let uploadedUrl = null

            // Upload File if selected
            if (file) {
                const formData = new FormData()
                formData.append('file', file)

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json()
                    uploadedUrl = uploadData.url
                } else {
                    alert('Erro ao fazer upload do arquivo')
                    return
                }
            }

            const payload = {
                ...form,
                arquivoUrl: uploadedUrl
            }

            // Keep existing file if editing and no new file upload
            if (editId && !uploadedUrl) {
                const existing = propostas.find(p => p.id === editId)
                if (existing?.arquivoUrl) {
                    payload.arquivoUrl = existing.arquivoUrl
                }
            }

            const url = editId ? `/api/propostas/${editId}` : '/api/propostas'
            const method = editId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                resetForm()
                refreshData()
            }
        } catch {
            alert('Erro ao salvar')
        } finally {
            setSubmitting(false)
        }
    }

    function resetForm() {
        setForm({ numero: '', licitacaoId: '', fornecedorId: '', data: '', observacoes: '' })
        setFile(null)
        setEditId(null)
    }

    function handleEdit(item: Proposta) {
        setEditId(item.id)
        setForm({
            numero: item.numero,
            licitacaoId: String(item.licitacaoId),
            fornecedorId: String(item.fornecedorId),
            data: item.data ? new Date(item.data).toISOString().split('T')[0] : '',
            observacoes: item.observacoes || ''
        })
        setFile(null)
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
        } catch {
            alert('Erro ao excluir')
        }
    }

    return (
        <div className="h-full overflow-auto p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-slate-800">Propostas</h1>

                <Card>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nº Proposta</label>
                                <input
                                    type="text"
                                    value={form.numero}
                                    onChange={e => setForm({ ...form, numero: e.target.value })}
                                    placeholder="123/2026"
                                    className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Licitação</label>
                                <select
                                    value={form.licitacaoId}
                                    onChange={e => setForm({ ...form, licitacaoId: e.target.value })}
                                    className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 bg-white outline-none"
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
                                    className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 bg-white outline-none"
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {fornecedores.map(f => (
                                        <option key={f.id} value={f.id}>{f.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                                <input
                                    type="date"
                                    value={form.data}
                                    onChange={e => setForm({ ...form, data: e.target.value })}
                                    className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 bg-white outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                            <textarea
                                value={form.observacoes}
                                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                                placeholder="Observações adicionais..."
                                className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Anexo (PDF, Imagem, Word)
                                    {editId && !file && <span className="text-xs text-slate-500 ml-2">(Deixe vazio para manter o atual)</span>}
                                </label>
                                <input
                                    type="file"
                                    onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
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
                                    {submitting ? 'Salvando...' : (editId ? 'Salvar' : 'Criar')}
                                </button>
                            </div>
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
                                <th className="p-4 font-semibold text-slate-600 w-32">Data</th>
                                <th className="p-4 font-semibold text-slate-600">Obs.</th>
                                <th className="p-4 font-semibold text-slate-600 text-right w-56">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Carregando...</td></tr>
                            ) : propostas.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma proposta cadastrada.</td></tr>
                            ) : (
                                propostas.map((item) => (
                                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${editId === item.id ? 'bg-blue-50' : ''}`}>
                                        <td className="p-4 font-medium text-slate-900">{item.numero}</td>
                                        <td className="p-4 text-slate-600">{item.licitacao?.nome}</td>
                                        <td className="p-4 text-slate-600">{item.fornecedor?.nome}</td>
                                        <td className="p-4 text-slate-600">
                                            {item.data
                                                ? new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                                                : new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-4 text-slate-600 text-sm max-w-[200px] truncate" title={item.observacoes || ''}>
                                            {item.observacoes}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-3">
                                                {item.arquivoUrl && (
                                                    <a
                                                        href={item.arquivoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                                        title="Ver Anexo"
                                                    >
                                                        <Paperclip size={18} />
                                                    </a>
                                                )}
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
        </div>
    )
}
