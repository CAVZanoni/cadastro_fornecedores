'use client'
import { useState, useEffect, useCallback } from 'react'
import { Download, FileSpreadsheet, RefreshCw } from 'lucide-react'

type ReportItem = {
    id: number
    data: string
    municipio: string
    licitacao: string
    fornecedor: string
    produto: string
    unidade: string
    quantidade: number
    precoUnitario: number
    precoTotal: number
    numeroProposta: string
    arquivoUrl?: string
}

export default function RelatoriosPage() {
    const [items, setItems] = useState<ReportItem[]>([])
    const [loading, setLoading] = useState(true)

    // Filter States
    const [search, setSearch] = useState('')
    const [dateStart, setDateStart] = useState('')
    const [dateEnd, setDateEnd] = useState('')
    const [selectedMunicipio, setSelectedMunicipio] = useState('')
    const [selectedFornecedor, setSelectedFornecedor] = useState('')
    const [selectedLicitacao, setSelectedLicitacao] = useState('')

    const fetchData = useCallback(() => {
        setLoading(true)
        fetch('/api/relatorios/geral')
            .then(res => res.json())
            .then(data => {
                setItems(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        fetchData()

        const onFocus = () => fetchData()
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
    }, [fetchData])

    function formatCurrency(val: number) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    }

    function handleExport() {
        window.location.href = '/api/export'
    }

    // Unique values for dropdowns
    const municipios = Array.from(new Set(items.map(i => i.municipio))).sort()
    const fornecedores = Array.from(new Set(items.map(i => i.fornecedor))).sort()
    const licitacoes = Array.from(new Set(items.map(i => i.licitacao))).sort()

    // Filter Logic
    const filteredItems = items.filter(item => {
        const matchesSearch = search.toLowerCase().split(' ').every(term =>
            item.produto.toLowerCase().includes(term) ||
            item.numeroProposta.toLowerCase().includes(term) ||
            item.licitacao.toLowerCase().includes(term) ||
            item.fornecedor.toLowerCase().includes(term)
        )

        const itemDate = new Date(item.data).toISOString().split('T')[0]
        const matchesDateStart = dateStart ? itemDate >= dateStart : true
        const matchesDateEnd = dateEnd ? itemDate <= dateEnd : true

        const matchesMunicipio = selectedMunicipio ? item.municipio === selectedMunicipio : true
        const matchesFornecedor = selectedFornecedor ? item.fornecedor === selectedFornecedor : true
        const matchesLicitacao = selectedLicitacao ? item.licitacao === selectedLicitacao : true

        return matchesSearch && matchesDateStart && matchesDateEnd && matchesMunicipio && matchesFornecedor && matchesLicitacao
    })

    const clearFilters = () => {
        setSearch('')
        setDateStart('')
        setDateEnd('')
        setSelectedMunicipio('')
        setSelectedFornecedor('')
        setSelectedLicitacao('')
    }

    return (
        <div className="flex flex-col h-full gap-2 p-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-800">Relatório Geral</h1>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors text-sm"
                        title="Atualizar dados"
                    >
                        <RefreshCw size={16} />
                        Atualizar
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors text-sm shadow-sm"
                    >
                        <FileSpreadsheet size={16} />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-50 p-2 rounded-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2 items-end border border-slate-200">
                <div className="lg:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Buscar</label>
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full rounded border border-slate-300 p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Município</label>
                    <select
                        value={selectedMunicipio}
                        onChange={e => setSelectedMunicipio(e.target.value)}
                        className="w-full rounded border border-slate-300 p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="">Todos</option>
                        {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Fornecedor</label>
                    <select
                        value={selectedFornecedor}
                        onChange={e => setSelectedFornecedor(e.target.value)}
                        className="w-full rounded border border-slate-300 p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="">Todos</option>
                        {fornecedores.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Data Inicial</label>
                    <input
                        type="date"
                        value={dateStart}
                        onChange={e => setDateStart(e.target.value)}
                        className="w-full rounded border border-slate-300 p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Data Final</label>
                    <input
                        type="date"
                        value={dateEnd}
                        onChange={e => setDateEnd(e.target.value)}
                        className="w-full rounded border border-slate-300 p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>

                {(search || dateStart || dateEnd || selectedMunicipio || selectedFornecedor || selectedLicitacao) && (
                    <button
                        onClick={clearFilters}
                        className="text-xs text-red-600 hover:text-red-800 underline pb-1"
                    >
                        Limpar
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col border border-slate-200 rounded-md">
                <div className="overflow-auto flex-1 h-full">
                    <table className="w-full text-left text-xs table-fixed">
                        <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm font-semibold text-slate-700">
                            <tr>
                                <th className="p-2 w-20 bg-slate-100">Data</th>
                                <th className="p-2 w-24 bg-slate-100">Município</th>
                                <th className="p-2 w-32 bg-slate-100">Licitação</th>
                                <th className="p-2 w-24 bg-slate-100">Nº Proposta</th>
                                <th className="p-2 w-32 bg-slate-100">Fornecedor</th>
                                <th className="p-2 w-40 bg-slate-100">Produto</th>
                                <th className="p-2 w-12 bg-slate-100">Unid.</th>
                                <th className="p-2 w-16 text-right bg-slate-100">Qtd</th>
                                <th className="p-2 w-20 text-right bg-slate-100">Unitário</th>
                                <th className="p-2 w-24 text-right bg-slate-100">Total</th>
                                <th className="p-2 w-12 text-center bg-slate-100">Anexo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={11} className="p-8 text-center text-slate-500">Carregando relatório...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan={11} className="p-8 text-center text-slate-500">Nenhum dado encontrado.</td></tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50 transition-colors group">
                                        <td className="p-2 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                                            {new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                        </td>
                                        <td className="p-2 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis" title={item.municipio}>{item.municipio}</td>
                                        <td className="p-2 text-slate-900 font-medium whitespace-nowrap overflow-hidden text-ellipsis" title={item.licitacao}>{item.licitacao}</td>
                                        <td className="p-2 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">{item.numeroProposta}</td>
                                        <td className="p-2 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis" title={item.fornecedor}>{item.fornecedor}</td>
                                        <td className="p-2 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis" title={item.produto}>{item.produto}</td>
                                        <td className="p-2 text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">{item.unidade}</td>
                                        <td className="p-2 text-slate-600 text-right font-mono">{item.quantidade}</td>
                                        <td className="p-2 text-slate-600 text-right font-mono">{formatCurrency(item.precoUnitario)}</td>
                                        <td className="p-2 text-slate-900 text-right font-mono font-bold">{formatCurrency(item.precoTotal)}</td>
                                        <td className="p-2 text-center">
                                            {item.arquivoUrl ? (
                                                <a href={item.arquivoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors inline-block" title="Ver Anexo">
                                                    <Download size={14} />
                                                </a>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-50 border-t border-slate-200 p-1.5 text-[10px] text-slate-500 text-right">
                    Total: {filteredItems.length}
                </div>
            </div>
        </div>
    )
}
