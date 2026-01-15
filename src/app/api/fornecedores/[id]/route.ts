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
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao atualizar fornecedor' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.fornecedor.delete({
            where: { id: Number(id) }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao deletar fornecedor. Verifique se há propostas vinculadas.' }, { status: 500 })
    }
}
