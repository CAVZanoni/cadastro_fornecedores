/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')
        const dateStart = searchParams.get('dateStart')
        const dateEnd = searchParams.get('dateEnd')
        const municipio = searchParams.get('municipio')
        const fornecedor = searchParams.get('fornecedor')
        const licitacao = searchParams.get('licitacao')

        // Build filter where clause
        const where: any = {}

        if (municipio) {
            where.licitacao = { municipio: { nomeCompleto: municipio } }
        }
        if (fornecedor) {
            where.fornecedor = { nome: fornecedor }
        }
        if (licitacao) {
            where.licitacao = { ...where.licitacao, nome: licitacao }
        }
        if (dateStart || dateEnd) {
            where.data = {}
            if (dateStart) where.data.gte = new Date(dateStart)
            if (dateEnd) where.data.lte = new Date(dateEnd)
        }

        // Fetch propostas with filtering
        const propostas = await prisma.proposta.findMany({
            where,
            include: {
                licitacao: { include: { municipio: true } },
                fornecedor: true,
                itens: {
                    include: {
                        unidade: true,
                        produto: {
                            include: { categoria: true, unidades: true }
                        }
                    }
                }
            },
            orderBy: { id: 'asc' }
        })

        // Apply search filter manually as it's complex for Prisma across relations
        let filteredPropostas = propostas
        if (search) {
            const terms = search.toLowerCase().split(' ')
            filteredPropostas = propostas.filter(p => {
                return p.itens.some(item => {
                    return terms.every(term =>
                        item.produto.nome.toLowerCase().includes(term) ||
                        p.licitacao.nome.toLowerCase().includes(term) ||
                        p.fornecedor.nome.toLowerCase().includes(term) ||
                        (p.observacoes?.toLowerCase().includes(term)) ||
                        (item.observacoes?.toLowerCase().includes(term))
                    )
                })
            })
        }

        // Fetch auxiliary data for other sheets (unfiltered by user search for reference)
        const licitacoes = await prisma.licitacao.findMany({
            include: { municipio: true },
            orderBy: { id: 'asc' }
        })
        const fornecedores = await prisma.fornecedor.findMany({ orderBy: { id: 'asc' } })
        const produtos = await prisma.produto.findMany({
            include: { categoria: true, unidades: true },
            orderBy: { id: 'asc' }
        })

        // Create workbook
        const wb = XLSX.utils.book_new()

        // Helper masks
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

        // Sheet 1: Relatório Geral (Filtered)
        const relatorioData: Record<string, string | number | null>[] = []
        filteredPropostas.forEach((p: any) => {
            p.itens?.forEach((item: any) => {
                relatorioData.push({
                    'Data': p.data ? new Date(p.data).toISOString().split('T')[0] : '',
                    'Município': p.licitacao?.municipio?.nomeCompleto || '-',
                    'Licitação': p.licitacao?.nome || '',
                    'Fornecedor': p.fornecedor?.nome || '',
                    'Forn. Contato': p.fornecedor?.contato || '',
                    'Forn. WhatsApp': maskPhone(p.fornecedor?.whatsapp),
                    'Forn. Email': p.fornecedor?.email || '',
                    'Forn. CNPJ': maskCNPJ(p.fornecedor?.cnpj),
                    'Produto': item.produto?.nome || '',
                    'Categoria': item.produto?.categoria?.nome || '-',
                    'Unidade': item.unidade?.sigla || item.produto?.unidades?.[0]?.sigla || item.produto?.unidadeTexto || '-',
                    'Quantidade': item.quantidade,
                    'Preço Unitário': item.precoUnitario,
                    'Preço Total': item.precoTotal || 0,
                    'Obs Fornecedor': p.fornecedor?.observacoes || '',
                    'Obs Proposta': p.observacoes || '',
                    'Obs Item': item.observacoes || '',
                    'Link Anexo': p.arquivoUrl || '-'
                })
            })
        })
        const wsRelatorio = XLSX.utils.json_to_sheet(relatorioData)
        XLSX.utils.book_append_sheet(wb, wsRelatorio, 'Relatório Geral')

        // Sheet 2: Licitações
        const licitacoesData = licitacoes.map((l: any) => ({
            ID: l.id,
            Nome: l.nome,
            'Município': l.municipio?.nomeCompleto || '-',
            'Data': l.data ? new Date(l.data).toISOString().split('T')[0] : '',
            'Criado em': l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : ''
        }))
        const wsLicitacoes = XLSX.utils.json_to_sheet(licitacoesData)
        XLSX.utils.book_append_sheet(wb, wsLicitacoes, 'Licitações')

        // Sheet 3: Fornecedores
        const fornecedoresData = fornecedores.map((f: any) => ({
            ID: f.id,
            Nome: f.nome,
            Contato: f.contato || '',
            WhatsApp: maskPhone(f.whatsapp),
            Email: f.email || '',
            CNPJ: maskCNPJ(f.cnpj),
            'Observações': f.observacoes || ''
        }))
        const wsFornecedores = XLSX.utils.json_to_sheet(fornecedoresData)
        XLSX.utils.book_append_sheet(wb, wsFornecedores, 'Fornecedores')

        // Sheet 4: Produtos
        const produtosData = produtos.map((p: any) => ({
            ID: p.id,
            Nome: p.nome,
            Categoria: p.categoria?.nome || '-',
            Unidades: p.unidades?.map((u: any) => u.sigla).join(', ') || '-'
        }))
        const wsProdutos = XLSX.utils.json_to_sheet(produtosData)
        XLSX.utils.book_append_sheet(wb, wsProdutos, 'Produtos')

        // Sheet 5: Propostas
        const propostasData = filteredPropostas.map((p: any) => ({
            ID: p.id,
            'Data': p.data ? new Date(p.data).toISOString().split('T')[0] : '',
            Licitação: p.licitacao?.nome || '',
            Fornecedor: p.fornecedor?.nome || '',
            'Forn. Contato': p.fornecedor?.contato || '',
            'Forn. WhatsApp': maskPhone(p.fornecedor?.whatsapp),
            'Forn. Email': p.fornecedor?.email || '',
            'Forn. CNPJ': maskCNPJ(p.fornecedor?.cnpj),
            'Total Itens': p.itens?.length || 0,
            'Valor Total': p.itens?.reduce((acc: number, item: any) => acc + (item.precoTotal || 0), 0) || 0,
            'Obs Fornecedor': p.fornecedor?.observacoes || '',
            'Obs': p.observacoes || '',
            'Link Anexo': p.arquivoUrl || '-'
        }))
        const wsPropostas = XLSX.utils.json_to_sheet(propostasData)
        XLSX.utils.book_append_sheet(wb, wsPropostas, 'Propostas')

        // Sheet 6: Itens de Propostas (detalhado)
        const itensData: Record<string, string | number | null>[] = []
        filteredPropostas.forEach((p: any) => {
            p.itens?.forEach((item: any) => {
                itensData.push({
                    'Data': p.data ? new Date(p.data).toISOString().split('T')[0] : '',
                    'Licitação': p.licitacao?.nome || '',
                    'Fornecedor': p.fornecedor?.nome || '',
                    'Forn. Contato': p.fornecedor?.contato || '',
                    'Forn. WhatsApp': maskPhone(p.fornecedor?.whatsapp),
                    'Forn. Email': p.fornecedor?.email || '',
                    'Forn. CNPJ': maskCNPJ(p.fornecedor?.cnpj),
                    'Produto': item.produto?.nome || '',
                    'Categoria': item.produto?.categoria?.nome || '-',
                    'Unidade': item.unidade?.sigla || item.produto?.unidades?.[0]?.sigla || item.produto?.unidadeTexto || '-',
                    'Quantidade': item.quantidade,
                    'Preço Unitário': item.precoUnitario,
                    'Preço Total': item.precoTotal || 0,
                    'Obs Fornecedor': p.fornecedor?.observacoes || '',
                    'Obs Proposta': p.observacoes || '',
                    'Obs Item': item.observacoes || '',
                    'Link Anexo': p.arquivoUrl || '-'
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
    } catch (_error) {
        console.error('Export error:', _error)
        return NextResponse.json({ error: 'Erro ao exportar dados' }, { status: 500 })
    }
}
