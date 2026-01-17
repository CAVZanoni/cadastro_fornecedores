import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const json = await request.json()

        const updated = await prisma.produto.update({
            where: { id: Number(id) },
            data: {
                nome: json.nome,
                categoriaId: json.categoriaId ? Number(json.categoriaId) : undefined,
                unidadeId: json.unidadeId ? Number(json.unidadeId) : undefined,
                unidadeTexto: json.unidadeLegacy || undefined
            },
            include: {
                categoria: true,
                unidade: true
            }
        })
        return NextResponse.json(updated)
    } catch (_error) {
        return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.produto.delete({
            where: { id: Number(id) }
        })
        return NextResponse.json({ success: true })
    } catch (_error) {
        return NextResponse.json({ error: 'Erro ao deletar produto. Verifique se há propostas vinculadas.' }, { status: 500 })
    }
}
