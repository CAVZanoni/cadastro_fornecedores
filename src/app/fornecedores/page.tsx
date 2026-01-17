'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Plus, Pencil, Trash2 } from 'lucide-react'

type Fornecedor = {
    id: number
    nome: string
    contato: string | null
    whatsapp: string | null
    email: string | null
    cnpj: string | null
    createdAt: string
}

export default function FornecedoresPage() {
    const [data, setData] = useState<Fornecedor[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)

    // Form State
    const [form, setForm] = useState({
        nome: '',
        contato: '',
        whatsapp: '',
        email: '',
        cnpj: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    // Mask Helpers
    const maskCNPJ = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1')
    }

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1')
    }

    async function fetchData() {
        try {
            const res = await fetch('/api/fornecedores')
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
            const url = editId ? `/api/fornecedores/${editId}` : '/api/fornecedores'
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
        setForm({ nome: '', contato: '', whatsapp: '', email: '', cnpj: '' })
        setEditId(null)
    }

    function handleEdit(item: Fornecedor) {
        setEditId(item.id)
        setForm({
            nome: item.nome,
            contato: item.contato || '',
            whatsapp: item.whatsapp || '',
            email: item.email || '',
            cnpj: item.cnpj || ''
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function handleDelete(id: number) {
        if (!confirm('Excluir este fornecedor?')) return
        try {
            const res = await fetch(`/api/fornecedores/${id}`, { method: 'DELETE' })
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
                <h1 className="text-3xl font-bold text-slate-800">Fornecedores</h1>

                <Card>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1 lg:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Fornecedor *</label>
                            <input
                                type="text"
                                value={form.nome}
                                onChange={e => setForm({ ...form, nome: e.target.value })}
                                className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contato (Pessoa)</label>
                            <input
                                type="text"
                                value={form.contato}
                                onChange={e => setForm({ ...form, contato: e.target.value })}
                                className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                            <input
                                type="text"
                                placeholder="(00) 00000-0000"
                                value={form.whatsapp}
                                onChange={e => setForm({ ...form, whatsapp: maskPhone(e.target.value) })}
                                className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                            <input
                                type="email"
                                placeholder="exemplo@email.com"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value.toLowerCase().trim() })}
                                className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                            <input
                                type="text"
                                placeholder="00.000.000/0000-00"
                                value={form.cnpj}
                                onChange={e => setForm({ ...form, cnpj: maskCNPJ(e.target.value) })}
                                className="w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex gap-2">
                            {editId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors h-10"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                disabled={submitting}
                                className={`flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 h-10 shadow-sm`}
                            >
                                {editId ? <Pencil size={18} /> : <Plus size={18} />}
                                {editId ? 'Salvar' : 'Cadastrar'}
                            </button>
                        </div>
                    </form>
                </Card>

                <Card className="overflow-hidden p-0 shadow-sm border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left bg-white">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 font-semibold text-slate-600">Nome</th>
                                    <th className="p-4 font-semibold text-slate-600">Contato</th>
                                    <th className="p-4 font-semibold text-slate-600">WhatsApp</th>
                                    <th className="p-4 font-semibold text-slate-600">CNPJ</th>
                                    <th className="p-4 font-semibold text-slate-600 text-right w-24">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">Carregando...</td></tr>
                                ) : data.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum fornecedor cadastrado.</td></tr>
                                ) : (
                                    data.map((item) => (
                                        <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${editId === item.id ? 'bg-blue-50' : ''}`}>
                                            <td className="p-4 font-medium text-slate-900">
                                                {item.nome}
                                                {item.email && <div className="text-xs text-slate-400 font-normal">{item.email}</div>}
                                            </td>
                                            <td className="p-4 text-slate-600">{item.contato || '-'}</td>
                                            <td className="p-4 text-slate-600">{item.whatsapp ? maskPhone(item.whatsapp) : '-'}</td>
                                            <td className="p-4 text-slate-600">{item.cnpj ? maskCNPJ(item.cnpj) : '-'}</td>
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
                    </div>
                </Card>
            </div>
        </div>
    )
}
