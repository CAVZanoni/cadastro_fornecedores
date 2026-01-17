import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const json = await request.json()

        const updated = await prisma.fornecedor.update({
            where: { id: Number(id) },
            data: {
                nome: json.nome,
                contato: json.contato,
                whatsapp: json.whatsapp,
                email: json.email,
                cnpj: json.cnpj
            }
        })
        return NextResponse.json(updated)
    } catch (_error) {
        return NextResponse.json({ error: 'Erro ao atualizar fornecedor' }, { status: 500 })
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.fornecedor.delete({
            where: { id: parseInt(id) }
        })
        return NextResponse.json({ message: 'Fornecedor excluído com sucesso' })
    } catch (_error) {
        return NextResponse.json({ error: 'Erro ao excluir fornecedor' }, { status: 500 })
    }
}
