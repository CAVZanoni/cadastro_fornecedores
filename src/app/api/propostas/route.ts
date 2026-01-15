import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const data = await prisma.proposta.findMany({
            include: { licitacao: true, fornecedor: true, itens: { include: { produto: true } } },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar propostas' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { numero, licitacaoId, fornecedorId } = body

        if (!numero || !licitacaoId || !fornecedorId) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
        }

        const data = await prisma.proposta.create({
            data: {
                numero,
                licitacaoId: Number(licitacaoId),
                fornecedorId: Number(fornecedorId),
                data: body.data ? new Date(body.data) : undefined,
                arquivoUrl: body.arquivoUrl || undefined
            }
        })
        return NextResponse.json(data)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Erro ao criar proposta' }, { status: 500 })
    }
}
