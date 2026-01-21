import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { recordLog } from '@/lib/audit'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const json = await request.json()

        const updated = await prisma.itemProposta.update({
            where: { id: Number(id) },
            data: {
                produtoId: Number(json.produtoId),
                quantidade: Number(json.quantidade),
                precoUnitario: Number(json.precoUnitario),
                observacoes: json.observacoes || undefined
            },
            include: { produto: true }
        })

        const session = await getServerSession()
        if (session?.user?.id) {
            await recordLog(
                Number(session.user.id),
                'UPDATE',
                'ITEM',
                updated.id,
                `Atualizou item ${id} da proposta ${updated.propostaId}: ${updated.produto.nome}`
            )
        }

        return NextResponse.json(updated)
    } catch {
        return NextResponse.json({ error: 'Erro ao atualizar item' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const item = await prisma.itemProposta.findUnique({
            where: { id: Number(id) },
            include: { produto: true }
        })

        await prisma.itemProposta.delete({
            where: { id: Number(id) }
        })

        const session = await getServerSession()
        if (session?.user?.id && item) {
            await recordLog(
                Number(session.user.id),
                'DELETE',
                'ITEM',
                Number(id),
                `Removeu item ${id} da proposta ${item.propostaId}: ${item.produto.nome}`
            )
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Erro ao deletar item' }, { status: 500 })
    }
}
