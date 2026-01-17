import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { propostaId, produtoId, quantidade, precoUnitario } = body

        if (!propostaId || !produtoId || quantidade === undefined || precoUnitario === undefined) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
        }

        const qtd = Number(quantidade)
        const price = Number(precoUnitario)
        const total = qtd * price

        const data = await prisma.itemProposta.create({
            data: {
                propostaId: Number(propostaId),
                produtoId: Number(produtoId),
                quantidade: qtd,
                precoUnitario: price,
                precoTotal: total,
                observacoes: body.observacoes || undefined
            },
            include: { produto: true }
        })
        return NextResponse.json(data)
    } catch (_error) {
        console.error(error)
        return NextResponse.json({ error: 'Erro ao adicionar item' }, { status: 500 })
    }
}
