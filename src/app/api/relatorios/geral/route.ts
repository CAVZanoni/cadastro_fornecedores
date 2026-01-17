import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const itens = await prisma.itemProposta.findMany({
            include: {
                produto: {
                    include: {
                        categoria: true,
                        unidade: true
                    }
                },
                proposta: {
                    include: {
                        licitacao: {
                            include: { municipio: true }
                        },
                        fornecedor: true
                    }
                }
            },
            orderBy: {
                proposta: {
                    data: 'desc'
                }
            }
        })

        // Flatten data for grid
        const flatData = itens.map(item => ({
            id: item.id,
            data: item.proposta.data, // Manual date
            municipio: item.proposta.licitacao.municipio?.nomeCompleto || '-',
            licitacao: item.proposta.licitacao.nome,
            fornecedor: item.proposta.fornecedor.nome,
            produto: item.produto.nome,
            categoria: item.produto.categoria?.nome || '-',
            unidade: item.produto.unidade?.sigla || item.produto.unidadeTexto || '-',
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            precoTotal: item.precoTotal || 0,
            numeroProposta: item.proposta.numero,
            arquivoUrl: item.proposta.arquivoUrl,
            obsProp: item.proposta.observacoes,
            obsItem: item.observacoes
        }))

        return NextResponse.json(flatData)
    } catch (error) {
        console.error('Relatorio error:', error)
        return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
    }
}
