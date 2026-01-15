import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Fetch all data
        const [licitacoes, fornecedores, produtos, propostas] = await Promise.all([
            prisma.licitacao.findMany({ orderBy: { id: 'asc' } }),
            prisma.fornecedor.findMany({ orderBy: { id: 'asc' } }),
            prisma.produto.findMany({ orderBy: { id: 'asc' } }),
            prisma.proposta.findMany({
                include: {
                    licitacao: true,
                    fornecedor: true,
                    itens: { include: { produto: true } }
                },
                orderBy: { id: 'asc' }
            })
        ])

        // Create workbook
        const wb = XLSX.utils.book_new()

        // Sheet 1: Licitações
        const licitacoesData = licitacoes.map(l => ({
            ID: l.id,
            Nome: l.nome,
            'Criado em': l.createdAt.toISOString().split('T')[0]
        }))
        const wsLicitacoes = XLSX.utils.json_to_sheet(licitacoesData)
        XLSX.utils.book_append_sheet(wb, wsLicitacoes, 'Licitações')

        // Sheet 2: Fornecedores
        const fornecedoresData = fornecedores.map(f => ({
            ID: f.id,
            Nome: f.nome,
            Contato: f.contato || '',
            WhatsApp: f.whatsapp || '',
            Email: f.email || '',
            CNPJ: f.cnpj || ''
        }))
        const wsFornecedores = XLSX.utils.json_to_sheet(fornecedoresData)
        XLSX.utils.book_append_sheet(wb, wsFornecedores, 'Fornecedores')

        // Sheet 3: Produtos
        const produtosData = produtos.map(p => ({
            ID: p.id,
            Nome: p.nome,
            Unidade: p.unidade
        }))
        const wsProdutos = XLSX.utils.json_to_sheet(produtosData)
        XLSX.utils.book_append_sheet(wb, wsProdutos, 'Produtos')

        // Sheet 4: Propostas
        const propostasData = propostas.map(p => ({
            ID: p.id,
            Número: p.numero,
            Licitação: p.licitacao?.nome || '',
            Fornecedor: p.fornecedor?.nome || '',
            'Total Itens': p.itens?.length || 0,
            'Valor Total': p.itens?.reduce((acc, item) => acc + (item.precoTotal || 0), 0) || 0
        }))
        const wsPropostas = XLSX.utils.json_to_sheet(propostasData)
        XLSX.utils.book_append_sheet(wb, wsPropostas, 'Propostas')

        // Sheet 5: Itens de Propostas (detalhado)
        const itensData: any[] = []
        propostas.forEach(p => {
            p.itens?.forEach(item => {
                itensData.push({
                    'Proposta': p.numero,
                    'Produto': item.produto?.nome || '',
                    'Unidade': item.produto?.unidade || '',
                    'Quantidade': item.quantidade,
                    'Preço Unitário': item.precoUnitario,
                    'Preço Total': item.precoTotal || 0
                })
            })
        })
        if (itensData.length > 0) {
            const wsItens = XLSX.utils.json_to_sheet(itensData)
            XLSX.utils.book_append_sheet(wb, wsItens, 'Detalhamento')
        }

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        // Return file
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="propostas_export_${new Date().toISOString().split('T')[0]}.xlsx"`
            }
        })
    } catch (error) {
        console.error('Export error:', error)
        return NextResponse.json({ error: 'Erro ao exportar dados' }, { status: 500 })
    }
}
