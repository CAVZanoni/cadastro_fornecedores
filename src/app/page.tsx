'use client'
import { Card } from "@/components/ui/Card";
import { Download } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `propostas_export_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <Download size={18} />
          {exporting ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-slate-500 text-sm font-medium">Licitações Ativas</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </Card>
        <Card>
          <h3 className="text-slate-500 text-sm font-medium">Propostas Enviadas</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </Card>
        <Card>
          <h3 className="text-slate-500 text-sm font-medium">Fornecedores</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </Card>
      </div>

      <Card className="h-96 flex items-center justify-center text-slate-400">
        <p>Gráfico de desempenho (em breve)</p>
      </Card>
    </div>
  );
}
