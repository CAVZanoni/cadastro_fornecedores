import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const json = await request.json()

        const updated = await prisma.proposta.update({
            where: { id: Number(id) },
            data: {
                licitacaoId: Number(json.licitacaoId),
                fornecedorId: Number(json.fornecedorId),
                data: json.data ? new Date(json.data) : undefined,
                arquivoUrl: json.arquivoUrl || undefined,
                observacoes: json.observacoes || undefined
            }
        })
        return NextResponse.json(updated)
    } catch {
        return NextResponse.json({ error: 'Erro ao atualizar proposta' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.proposta.delete({
            where: { id: Number(id) }
        })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Erro ao deletar proposta' }, { status: 500 })
    }
}
