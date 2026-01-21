import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { recordLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const data = await prisma.proposta.findMany({
            include: {
                licitacao: true,
                fornecedor: true,
                itens: {
                    include: {
                        produto: {
                            include: { unidade: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Erro ao buscar propostas' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { licitacaoId, fornecedorId } = body

        if (!licitacaoId || !fornecedorId) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
        }

        const data = await prisma.proposta.create({
            data: {
                licitacaoId: Number(licitacaoId),
                fornecedorId: Number(fornecedorId),
                data: body.data ? new Date(body.data) : undefined,
                arquivoUrl: body.arquivoUrl || undefined,
                observacoes: body.observacoes || undefined
            },
            include: {
                licitacao: true,
                fornecedor: true
            }
        })

        const session = await getServerSession()
        if (session?.user?.id) {
            await recordLog(
                Number(session.user.id),
                'CREATE',
                'PROPOSTA',
                data.id,
                `Criou proposta: ${data.licitacao.nome} - ${data.fornecedor.nome}`
            )
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Erro ao criar proposta' }, { status: 500 })
    }
}
