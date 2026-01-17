import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const json = await request.json()

        const updated = await prisma.licitacao.update({
            where: { id: Number(id) },
            data: {
                nome: json.nome,
                municipioId: json.municipioId ? Number(json.municipioId) : undefined,
                data: json.data ? new Date(json.data) : undefined
            }
        })
        return NextResponse.json(updated)
    } catch (_error) {
        return NextResponse.json({ error: 'Erro ao atualizar licitação' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.licitacao.delete({
            where: { id: Number(id) }
        })
        return NextResponse.json({ success: true })
    } catch (_error) {
        return NextResponse.json({ error: 'Erro ao deletar licitação. Verifique se há propostas vinculadas.' }, { status: 500 })
    }
}
