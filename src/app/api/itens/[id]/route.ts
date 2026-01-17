import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
            }
        })
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
        await prisma.itemProposta.delete({
            where: { id: Number(id) }
        })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Erro ao deletar item' }, { status: 500 })
    }
}
