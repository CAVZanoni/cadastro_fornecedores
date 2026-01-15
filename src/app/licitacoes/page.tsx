'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Plus, X, Pencil, Trash2 } from 'lucide-react'

type Municipio = {
    id: number
    nome: string
    uf: string
    nomeCompleto: string
}

type Licitacao = {
    id: number
    nome: string
    createdAt: string
    data: string // Manual date
    municipioId?: number | null
    municipio?: Municipio | null
}

export default function LicitacoesPage() {
    const [licitacoes, setLicitacoes] = useState<Licitacao[]>([])
    const [loading, setLoading] = useState(true)
    const [nome, setNome] = useState('')
    const [data, setData] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)

    // Municipality search states
    const [municipioSearch, setMunicipioSearch] = useState('')
    const [municipioResults, setMunicipioResults] = useState<Municipio[]>([])
    const [selectedMunicipio, setSelectedMunicipio] = useState<Municipio | null>(null)
    const [showResults, setShowResults] = useState(false)

    useEffect(() => {
        fetchLicitacoes()
    }, [])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (municipioSearch.length >= 3 && !selectedMunicipio) {
                fetchMunicipios(municipioSearch)
            } else {
                setMunicipioResults([])
                setShowResults(false)
            }
        }, 300)
        return () => clearTimeout(timeoutId)
    }, [municipioSearch, selectedMunicipio])

    async function fetchMunicipios(query: string) {
        try {
            const res = await fetch(`/api/municipios?search=${query}`)
            if (res.ok) {
                const data = await res.json()
                setMunicipioResults(data)
                setShowResults(true)
            }
        } catch (error) {
            console.error('Failed to search municipios', error)
        }
    }

    async function fetchLicitacoes() {
        try {
            const res = await fetch('/api/licitacoes')
            if (res.ok) {
                const data = await res.json()
                setLicitacoes(data)
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!nome || !selectedMunicipio) return
        setSubmitting(true)
        try {
            const payload = {
                nome,
                municipioId: selectedMunicipio.id,
                data: data || undefined
            }

            const url = editId ? `/api/licitacoes/${editId}` : '/api/licitacoes'
            const method = editId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                resetForm()
                fetchLicitacoes()
            }
        } finally {
            setSubmitting(false)
        }
    }

    function resetForm() {
        setNome('')
        setData('')
        setMunicipioSearch('')
        setSelectedMunicipio(null)
        setEditId(null)
    }

    function handleEdit(lic: Licitacao) {
        setEditId(lic.id)
        setNome(lic.nome)
        // Format date to YYYY-MM-DD for input
        if (lic.data) {
            setData(new Date(lic.data).toISOString().split('T')[0])
        } else {
            setData('')
        }
        if (lic.municipio) {
            setSelectedMunicipio(lic.municipio)
            setMunicipioSearch(lic.municipio.nomeCompleto)
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function handleDelete(id: number) {
        if (!confirm('Excluir esta licitação?')) return
        try {
            const res = await fetch(`/api/licitacoes/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchLicitacoes()
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
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-slate-800">Licitações</h1>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full space-y-4 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-4">
                            <div className="col-span-12 sm:col-span-5">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Licitação <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={e => setNome(e.target.value)}
                                    placeholder="Ex: Pregão Eletrônico 01/2026"
                                    className="w-full rounded-md border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="col-span-12 sm:col-span-4 relative">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Município <span className="text-red-500">*</span></label>
                                {selectedMunicipio ? (
                                    <div className="flex items-center justify-between w-full rounded-md border border-slate-300 p-2 bg-slate-50">
                                        <span className="text-slate-900 truncate">{selectedMunicipio.nomeCompleto}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedMunicipio(null)
                                                setMunicipioSearch('')
                                            }}
                                            className="text-slate-400 hover:text-red-500 ml-2"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={municipioSearch}
                                            onChange={e => {
                                                setMunicipioSearch(e.target.value)
                                                if (selectedMunicipio) setSelectedMunicipio(null)
                                            }}
                                            placeholder="Digite 3 letras..."
                                            className="w-full rounded-md border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {showResults && municipioResults.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto text-sm">
                                                {municipioResults.map(mun => (
                                                    <button
                                                        type="button"
                                                        key={mun.id}
                                                        onClick={() => {
                                                            setSelectedMunicipio(mun)
                                                            setMunicipioSearch(mun.nomeCompleto)
                                                            setShowResults(false)
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700"
                                                    >
                                                        {mun.nomeCompleto}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="col-span-12 sm:col-span-3">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                                <input
                                    type="date"
                                    value={data}
                                    onChange={e => setData(e.target.value)}
                                    className="w-full rounded-md border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            {editId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 sm:flex-none border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors h-[42px]"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                disabled={submitting || !selectedMunicipio}
                                className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap h-[42px]"
                            >
                                {editId ? <Pencil size={18} /> : <Plus size={18} />}
                                {editId ? 'Salvar' : 'Adicionar'}
                            </button>
                        </div>
                    </form>
                </Card>

                <Card className="overflow-hidden p-0 shadow-sm border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 font-semibold text-slate-600 w-20">ID</th>
                                    <th className="p-4 font-semibold text-slate-600">Nome</th>
                                    <th className="p-4 font-semibold text-slate-600">Município</th>
                                    <th className="p-4 font-semibold text-slate-600 w-40">Data</th>
                                    <th className="p-4 font-semibold text-slate-600 text-right w-24">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">Carregando...</td></tr>
                                ) : licitacoes.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhuma licitação cadastrada.</td></tr>
                                ) : (
                                    licitacoes.map((lic) => (
                                        <tr key={lic.id} className={`hover:bg-slate-50 transition-colors ${editId === lic.id ? 'bg-blue-50' : ''}`}>
                                            <td className="p-4 text-slate-500">#{lic.id}</td>
                                            <td className="p-4 font-medium text-slate-900">{lic.nome}</td>
                                            <td className="p-4 text-slate-600">
                                                {lic.municipio ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {lic.municipio.nomeCompleto}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {lic.data
                                                    ? new Date(lic.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                                                    : new Date(lic.createdAt).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(lic)}
                                                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(lic.id)}
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
