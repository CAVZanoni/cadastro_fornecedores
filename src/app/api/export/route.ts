import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Fetch all data
        const [licitacoes, fornecedores, produtos, propostas] = await Promise.all([
            prisma.licitacao.findMany({
                include: { municipio: true },
                orderBy: { id: 'asc' }
            }),
            prisma.fornecedor.findMany({ orderBy: { id: 'asc' } }),
            prisma.produto.findMany({
                include: { categoria: true, unidade: true },
                orderBy: { id: 'asc' }
            }),
            prisma.proposta.findMany({
                include: {
                    licitacao: { include: { municipio: true } },
                    fornecedor: true,
                    itens: {
                        include: {
                            produto: {
                                include: { categoria: true, unidade: true }
                            }
                        }
                    }
                },
                orderBy: { id: 'asc' }
            })
        ])

        // Create workbook
        const wb = XLSX.utils.book_new()

        // Sheet 1: Relatório Geral (Flattened)
        const relatorioData: any[] = []
        propostas.forEach(p => {
            p.itens?.forEach(item => {
                relatorioData.push({
                    'Data': p.data ? p.data.toISOString().split('T')[0] : '',
                    'Município': p.licitacao?.municipio?.nomeCompleto || '-',
                    'Licitação': p.licitacao?.nome || '',
                    'Nº Proposta': p.numero,
                    'Fornecedor': p.fornecedor?.nome || '',
                    'Produto': item.produto?.nome || '',
                    'Categoria': item.produto?.categoria?.nome || '-',
                    'Unidade': item.produto?.unidade?.sigla || item.produto?.unidadeTexto || '-',
                    'Quantidade': item.quantidade,
                    'Preço Unitário': item.precoUnitario,
                    'Preço Total': item.precoTotal || 0,
                    'Obs Proposta': p.observacoes || '',
                    'Obs Item': item.observacoes || ''
                })
            })
        })
        const wsRelatorio = XLSX.utils.json_to_sheet(relatorioData)
        XLSX.utils.book_append_sheet(wb, wsRelatorio, 'Relatório Geral')

        // Sheet 2: Licitações
        const licitacoesData = licitacoes.map(l => ({
            ID: l.id,
            Nome: l.nome,
            'Município': l.municipio?.nomeCompleto || '-',
            'Data': l.data ? l.data.toISOString().split('T')[0] : '',
            'Criado em': l.createdAt.toISOString().split('T')[0]
        }))
        const wsLicitacoes = XLSX.utils.json_to_sheet(licitacoesData)
        XLSX.utils.book_append_sheet(wb, wsLicitacoes, 'Licitações')

        // Sheet 3: Fornecedores
        const maskCNPJ = (v: string | null) => {
            if (!v) return ''
            const n = v.replace(/\D/g, '')
            return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
        }
        const maskPhone = (v: string | null) => {
            if (!v) return ''
            const n = v.replace(/\D/g, '')
            if (n.length === 11) return n.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
            return n.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
        }

        const fornecedoresData = fornecedores.map(f => ({
            ID: f.id,
            Nome: f.nome,
            Contato: f.contato || '',
            WhatsApp: maskPhone(f.whatsapp),
            Email: f.email || '',
            CNPJ: maskCNPJ(f.cnpj)
        }))
        const wsFornecedores = XLSX.utils.json_to_sheet(fornecedoresData)
        XLSX.utils.book_append_sheet(wb, wsFornecedores, 'Fornecedores')

        // Sheet 4: Produtos
        const produtosData = produtos.map(p => ({
            ID: p.id,
            Nome: p.nome,
            Categoria: p.categoria?.nome || '-',
            Unidade: p.unidade?.sigla || p.unidadeTexto || '-'
        }))
        const wsProdutos = XLSX.utils.json_to_sheet(produtosData)
        XLSX.utils.book_append_sheet(wb, wsProdutos, 'Produtos')

        // Sheet 5: Propostas
        const propostasData = propostas.map(p => ({
            ID: p.id,
            Número: p.numero,
            'Data': p.data ? p.data.toISOString().split('T')[0] : '',
            Licitação: p.licitacao?.nome || '',
            Fornecedor: p.fornecedor?.nome || '',
            'Total Itens': p.itens?.length || 0,
            'Valor Total': p.itens?.reduce((acc, item) => acc + (item.precoTotal || 0), 0) || 0,
            'Obs': p.observacoes || ''
        }))
        const wsPropostas = XLSX.utils.json_to_sheet(propostasData)
        XLSX.utils.book_append_sheet(wb, wsPropostas, 'Propostas')

        // Sheet 6: Itens de Propostas (detalhado)
        const itensData: any[] = []
        propostas.forEach(p => {
            p.itens?.forEach(item => {
                itensData.push({
                    'Proposta': p.numero,
                    'Data': p.data ? p.data.toISOString().split('T')[0] : '',
                    'Produto': item.produto?.nome || '',
                    'Categoria': item.produto?.categoria?.nome || '-',
                    'Unidade': item.produto?.unidade?.sigla || item.produto?.unidadeTexto || '-',
                    'Quantidade': item.quantidade,
                    'Preço Unitário': item.precoUnitario,
                    'Preço Total': item.precoTotal || 0,
                    'Obs Proposta': p.observacoes || '',
                    'Obs Item': item.observacoes || ''
                })
            })
        })
        if (itensData.length > 0) {
            const wsItens = XLSX.utils.json_to_sheet(itensData)
            XLSX.utils.book_append_sheet(wb, wsItens, 'Detalhamento (Itens)')
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
