'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Download, FileSpreadsheet, RefreshCw, ArrowUpDown } from 'lucide-react'

type ReportItem = {
    id: number
    data: string
    municipio: string
    licitacao: string
    fornecedor: string
    produto: string
    categoria: string
    unidade: string
    quantidade: number
    precoUnitario: number
    precoTotal: number
    arquivoUrl?: string
    obsProp?: string
    obsItem?: string
}

const SortIcon = ({ column, sortConfig }: { column: any, sortConfig: { key: keyof ReportItem | null, direction: 'asc' | 'desc' } }) => {
    if (sortConfig.key !== column) return <div className="w-4 h-4 opacity-0 group-hover:opacity-30 transition-opacity"><ArrowUpDown size={14} /></div>
    return <div className={`w-4 h-4 transition-transform ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`}><ArrowUpDown size={14} /></div>
}

const ThSort = ({
    column,
    label,
    align = 'left',
    width,
    sortConfig,
    onSort,
    onResize
}: {
    column: string,
    label: string,
    align?: 'left' | 'right' | 'center',
    width: number,
    sortConfig?: { key: keyof ReportItem | null, direction: 'asc' | 'desc' },
    onSort?: (key: keyof ReportItem) => void,
    onResize: (width: number) => void
}) => {
    const isResizing = useRef(false)

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        isResizing.current = true
        const startX = e.pageX
        const startWidth = width

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isResizing.current) return
            const delta = moveEvent.pageX - startX
            onResize(Math.max(30, startWidth + delta))
        }

        const handleMouseUp = () => {
            isResizing.current = false
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    return (
        <th
            className={`p-2 bg-slate-100 relative group text-${align} border-r border-slate-200 select-none font-semibold`}
            style={{ width: `${width}px` }}
        >
            <div
                className={`flex items-center gap-1 ${onSort ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''} ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}
                onClick={() => onSort && onSort(column as keyof ReportItem)}
            >
                {label}
                {sortConfig && <SortIcon column={column as keyof ReportItem} sortConfig={sortConfig} />}
            </div>
            <div
                onMouseDown={handleMouseDown}
                className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 z-10 transition-colors"
                title="Arraste para redimensionar"
            />
        </th>
    )
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

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        data: 85,
        municipio: 100,
        licitacao: 160,
        fornecedor: 160,
        produto: 200,
        categoria: 100,
        unidade: 60,
        quantidade: 80,
        precoUnitario: 100,
        precoTotal: 120,
        obs: 150,
        anexo: 60
    })

    const handleResize = (column: string, newWidth: number) => {
        setColumnWidths(prev => ({ ...prev, [column]: newWidth }))
    }

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
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (dateStart) params.append('dateStart', dateStart)
        if (dateEnd) params.append('dateEnd', dateEnd)
        if (selectedMunicipio) params.append('municipio', selectedMunicipio)
        if (selectedFornecedor) params.append('fornecedor', selectedFornecedor)
        if (selectedLicitacao) params.append('licitacao', selectedLicitacao)

        window.location.href = `/api/export?${params.toString()}`
    }

    // Unique values for dropdowns
    const municipios = Array.from(new Set(items.map(i => i.municipio))).sort()
    const fornecedores = Array.from(new Set(items.map(i => i.fornecedor))).sort()

    // Filter Logic
    const filteredItems = items.filter(item => {
        const matchesSearch = search.toLowerCase().split(' ').every(term =>
            item.produto.toLowerCase().includes(term) ||
            item.licitacao.toLowerCase().includes(term) ||
            item.fornecedor.toLowerCase().includes(term) ||
            (item.obsProp?.toLowerCase().includes(term)) ||
            (item.obsItem?.toLowerCase().includes(term))
        )

        const itemDate = new Date(item.data).toISOString().split('T')[0]
        const matchesDateStart = dateStart ? itemDate >= dateStart : true
        const matchesDateEnd = dateEnd ? itemDate <= dateEnd : true

        const matchesMunicipio = selectedMunicipio ? item.municipio === selectedMunicipio : true
        const matchesFornecedor = selectedFornecedor ? item.fornecedor === selectedFornecedor : true
        const matchesLicitacao = selectedLicitacao ? item.licitacao === selectedLicitacao : true

        return matchesSearch && matchesDateStart && matchesDateEnd && matchesMunicipio && matchesFornecedor && matchesLicitacao
    })

    const [sortConfig, setSortConfig] = useState<{ key: keyof ReportItem | null, direction: 'asc' | 'desc' }>({ key: 'data', direction: 'desc' })

    const handleSort = (key: keyof ReportItem) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const sortedItems = [...filteredItems].sort((a, b) => {
        if (!sortConfig.key) return 0
        const aVal = a[sortConfig.key as keyof ReportItem]
        const bVal = b[sortConfig.key as keyof ReportItem]

        if (aVal === undefined && bVal === undefined) return 0
        if (aVal === undefined) return 1
        if (bVal === undefined) return -1

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    })

    const clearFilters = () => {
        setSearch('')
        setDateStart('')
        setDateEnd('')
        setSelectedMunicipio('')
        setSelectedFornecedor('')
        setSelectedLicitacao('')
        setSortConfig({ key: 'data', direction: 'desc' })
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
                                <ThSort column="data" label="Data" width={columnWidths.data} sortConfig={sortConfig} onSort={handleSort} onResize={(w) => handleResize('data', w)} />
                                <ThSort column="municipio" label="Município" width={columnWidths.municipio} sortConfig={sortConfig} onSort={handleSort} onResize={(w) => handleResize('municipio', w)} />
                                <ThSort column="licitacao" label="Licitação" width={columnWidths.licitacao} sortConfig={sortConfig} onSort={handleSort} onResize={(w) => handleResize('licitacao', w)} />
                                <ThSort column="fornecedor" label="Fornecedor" width={columnWidths.fornecedor} sortConfig={sortConfig} onSort={handleSort} onResize={(w) => handleResize('fornecedor', w)} />
                                <ThSort column="produto" label="Produto" width={columnWidths.produto} sortConfig={sortConfig} onSort={handleSort} onResize={(w) => handleResize('produto', w)} />
                                <ThSort column="categoria" label="Categoria" width={columnWidths.categoria} sortConfig={sortConfig} onSort={handleSort} onResize={(w) => handleResize('categoria', w)} />
                                <ThSort column="unidade" label="Unid." width={columnWidths.unidade} sortConfig={sortConfig} onSort={handleSort} onResize={(w) => handleResize('unidade', w)} />
                                <ThSort column="quantidade" label="Qtd" align="right" width={columnWidths.quantidade} sortConfig={sortConfig} onSort={handleSort} onResize={(w) => handleResize('quantidade', w)} />
                                <ThSort column="precoUnitario" label="Unitário" align="right" width={columnWidths.precoUnitario} sortConfig={sortConfig} onSort={handleSort} onResize={(w) => handleResize('precoUnitario', w)} />
                                <ThSort column="precoTotal" label="Total" align="right" width={columnWidths.precoTotal} sortConfig={sortConfig} onSort={handleSort} onResize={(w) => handleResize('precoTotal', w)} />
                                <ThSort column="obs" label="Obs." width={columnWidths.obs} onResize={(w) => handleResize('obs', w)} />
                                <ThSort column="anexo" label="Anexo" align="center" width={columnWidths.anexo} onResize={(w) => handleResize('anexo', w)} />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={12} className="p-8 text-center text-slate-500">Carregando relatório...</td></tr>
                            ) : sortedItems.length === 0 ? (
                                <tr><td colSpan={12} className="p-8 text-center text-slate-500">Nenhum dado encontrado.</td></tr>
                            ) : (
                                sortedItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50 transition-colors group">
                                        <td className="p-2 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                                            {new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                        </td>
                                        <td className="p-2 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis" title={item.municipio}>{item.municipio}</td>
                                        <td className="p-2 text-slate-900 font-medium whitespace-nowrap overflow-hidden text-ellipsis" title={item.licitacao}>{item.licitacao}</td>
                                        <td className="p-2 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis" title={item.fornecedor}>{item.fornecedor}</td>
                                        <td className="p-2 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis" title={item.produto}>{item.produto}</td>
                                        <td className="p-2 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis" title={item.categoria}>{item.categoria}</td>
                                        <td className="p-2 text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">{item.unidade}</td>
                                        <td className="p-2 text-slate-600 text-right font-mono">
                                            {item.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                                        </td>
                                        <td className="p-2 text-slate-900 text-right font-mono font-bold">{formatCurrency(item.precoUnitario)}</td>
                                        <td className="p-2 text-slate-900 text-right font-mono font-bold">{formatCurrency(item.precoTotal)}</td>
                                        <td className="p-2 text-slate-500 text-[10px] italic space-y-0.5 overflow-hidden" style={{ maxWidth: `${columnWidths.obs}px` }}>
                                            {item.obsProp && <div className="truncate" title={`Proposta: ${item.obsProp}`}>P: {item.obsProp}</div>}
                                            {item.obsItem && <div className="truncate" title={`Item: ${item.obsItem}`}>I: {item.obsItem}</div>}
                                        </td>
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
                    Total: {sortedItems.length}
                </div>
            </div>
        </div>
    )
}
