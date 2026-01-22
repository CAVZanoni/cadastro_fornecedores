'use client'
import { useState, useEffect, use, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Plus, Trash2, ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'

type ItemProposta = {
    id: number
    produtoId: number
    produto: {
        nome: string
        unidade?: { sigla: string } | null
        unidadeTexto?: string | null
    }
    unidadeId?: number | null
    unidade?: { sigla: string; nome: string } | null
    quantidade: number
    precoUnitario: number
    precoTotal: number
    observacoes?: string | null
}

type PropostaDetalhe = {
    id: number
    licitacaoId: number
    licitacao: { nome: string }
    fornecedor: { nome: string }
    itens: ItemProposta[]
    arquivoUrl?: string | null
    observacoes?: string | null
}

type ProdutoOption = {
    id: number
    nome: string
    unidade?: { sigla: string; nome: string } | null
    unidades?: { id: number; sigla: string; nome: string }[] | null
    unidadeTexto?: string | null
}

export default function PropostaDetalhe({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [proposta, setProposta] = useState<PropostaDetalhe | null>(null)
    const [produtos, setProdutos] = useState<ProdutoOption[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [uploading, setUploading] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)

    // Item Form
    const [form, setForm] = useState({
        produtoId: '',
        unidadeId: '',
        quantidade: '',
        precoUnitario: '',
        observacoes: ''
    })

    const fetchData = useCallback(async () => {
        try {
            const propRes = await fetch('/api/propostas')
            const allProps = await propRes.json()
            const current = allProps.find((p: PropostaDetalhe) => p.id === Number(id))
            setProposta(current)

            const prodRes = await fetch('/api/produtos')
            setProdutos(await prodRes.json())
        } catch {
            console.error('Error fetching data')
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Derived state: allowed units for selected product
    const selectedProduct = produtos.find(p => p.id === Number(form.produtoId))
    const allowedUnits = selectedProduct?.unidades || []

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.produtoId || !form.quantidade || !form.precoUnitario) return
        setSubmitting(true)
        try {
            const url = editId ? `/api/itens/${editId}` : '/api/itens'
            const method = editId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propostaId: id,
                    produtoId: form.produtoId,
                    unidadeId: form.unidadeId || null,
                    quantidade: form.quantidade,
                    precoUnitario: form.precoUnitario,
                    observacoes: form.observacoes
                })
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
        setForm({ produtoId: '', unidadeId: '', quantidade: '', precoUnitario: '', observacoes: '' })
        setEditId(null)
    }

    function handleEditItem(item: ItemProposta) {
        setEditId(item.id)
        setForm({
            produtoId: String(item.produtoId),
            unidadeId: item.unidadeId ? String(item.unidadeId) : '',
            quantidade: String(item.quantidade),
            precoUnitario: String(item.precoUnitario),
            observacoes: item.observacoes || ''
        })
    }

    async function handleDeleteItem(itemId: number) {
        if (!confirm('Remover este item?')) return;
        try {
            await fetch(`/api/itens/${itemId}`, { method: 'DELETE' })
            fetchData()
        } catch { console.error('Error deleting item') }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.[0]) return

        const file = e.target.files[0]
        setUploading(true)

        try {
            // 1. Upload file
            const formData = new FormData()
            formData.append('file', file)

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!uploadRes.ok) throw new Error('Falha no upload')

            const { url } = await uploadRes.json()

            // 2. Update proposal
            const updateRes = await fetch(`/api/propostas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...proposta,
                    licitacaoId: proposta?.licitacaoId,
                    arquivoUrl: url
                })
            })

            if (updateRes.ok) {
                alert('Arquivo anexado com sucesso!')
                fetchData()
            }
        } catch (err) {
            console.error(err)
            alert('Erro ao enviar arquivo.')
        } finally {
            setUploading(false)
            // Reset input
            e.target.value = ''
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando...</div>
    if (!proposta) return <div className="p-8 text-center">Proposta não encontrada</div>

    const totalGeral = proposta.itens?.reduce((acc, item) => acc + (item.precoTotal || 0), 0) || 0

    return (
        <div className="h-full overflow-auto p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/propostas" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-slate-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Detalhes da Proposta</h1>
                            <p className="text-slate-500 text-sm">
                                {proposta.licitacao?.nome} • {proposta.fornecedor?.nome}
                            </p>
                            {proposta.observacoes && (
                                <div className="text-slate-600 text-sm mt-1 bg-blue-50 p-2 rounded border border-blue-100 italic">
                                    <strong>Obs:</strong> {proposta.observacoes}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {proposta.arquivoUrl && (
                            <a
                                href={proposta.arquivoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-1 mr-2"
                            >
                                Ver Anexo
                            </a>
                        )}
                        <label className={`cursor-pointer bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-md hover:bg-slate-50 text-sm flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploading ? 'Enviando...' : 'Anexar Arquivo'}
                            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                        </label>
                    </div>
                </div>

                <Card>
                    <h3 className="font-semibold text-slate-700 mb-4 border-b pb-2">
                        {editId ? 'Editar Item' : 'Adicionar Item'}
                    </h3>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Produto</label>
                                <select
                                    value={form.produtoId}
                                    onChange={e => {
                                        const prodId = e.target.value
                                        const prod = produtos.find(p => p.id === Number(prodId))
                                        setForm({
                                            ...form,
                                            produtoId: prodId,
                                            unidadeId: prod?.unidades?.[0]?.id.toString() || ''
                                        })
                                    }}
                                    className="w-full rounded-md border border-slate-300 p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {produtos.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                                <select
                                    value={form.unidadeId}
                                    onChange={e => setForm({ ...form, unidadeId: e.target.value })}
                                    className="w-full rounded-md border border-slate-300 p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                    required
                                    disabled={!form.produtoId}
                                >
                                    <option value="">Selecione...</option>
                                    {allowedUnits.map(u => (
                                        <option key={u.id} value={u.id}>{u.sigla}</option>
                                    ))}
                                    {form.produtoId && allowedUnits.length === 0 && (
                                        <option value="" disabled>Nenhuma unidade vinculada</option>
                                    )}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Qtd.</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.quantidade}
                                    onChange={e => setForm({ ...form, quantidade: e.target.value })}
                                    className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Preço Unit. (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.precoUnitario}
                                    onChange={e => setForm({ ...form, precoUnitario: e.target.value })}
                                    className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2 flex gap-2">
                                {editId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 border border-slate-300 text-slate-700 px-3 py-2 rounded-md hover:bg-slate-50 text-sm h-[38px]"
                                    >
                                        <Plus size={16} className="rotate-45" />
                                    </button>
                                )}
                                <button
                                    disabled={submitting}
                                    className={`flex-[2] bg-slate-900 text-white px-3 py-2 rounded-md hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 text-sm h-[38px]`}
                                >
                                    {editId ? <Pencil size={16} /> : <Plus size={16} />}
                                    {editId ? 'Salvar' : 'Adicionar'}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Observações do Item</label>
                            <input
                                type="text"
                                value={form.observacoes}
                                onChange={e => setForm({ ...form, observacoes: e.target.value.toUpperCase() })}
                                style={{ textTransform: 'uppercase' }}
                                placeholder="Observações específicas para este item..."
                                className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </form>
                </Card>

                <Card className="overflow-hidden p-0 shadow-sm border border-slate-200">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-sm">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Produto</th>
                                <th className="p-4 font-semibold text-slate-600 text-right">Qtd</th>
                                <th className="p-4 font-semibold text-slate-600 text-right">Unitário</th>
                                <th className="p-4 font-semibold text-slate-600 text-right">Total</th>
                                <th className="p-4 font-semibold text-slate-600">Observações</th>
                                <th className="p-4 font-semibold text-slate-600 w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {proposta.itens?.length === 0 && (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhum item adicionado.</td></tr>
                            )}
                            {proposta.itens?.map((item) => (
                                <tr key={item.id} className={`hover:bg-slate-50 ${editId === item.id ? 'bg-blue-50' : ''}`}>
                                    <td className="p-4 font-medium text-slate-800">
                                        {item.produto?.nome}
                                        <span className="text-slate-400 font-normal ml-1">({item.unidade?.sigla || item.produto?.unidade?.sigla || item.produto?.unidadeTexto || '-'})</span>
                                    </td>
                                    <td className="p-4 text-right text-slate-600">
                                        {item.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                                    </td>
                                    <td className="p-4 text-right text-slate-600">
                                        {item.precoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="p-4 text-right font-medium text-slate-900">
                                        {(item.precoTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="p-4 text-slate-600 text-xs italic">{item.observacoes}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditItem(item)}
                                                className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                                title="Editar"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-semibold border-t border-slate-300">
                            <tr>
                                <td colSpan={3} className="p-4 text-right text-slate-600">TOTAL GERAL</td>
                                <td className="p-4 text-right text-slate-900 text-lg">
                                    {totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </Card>
            </div>
        </div>
    )
}
