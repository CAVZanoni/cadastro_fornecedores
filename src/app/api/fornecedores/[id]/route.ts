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

        // Check for duplicate name (case-insensitive), excluding current record
        if (json.nome) {
            const existing = await prisma.fornecedor.findFirst({
                where: {
                    nome: { equals: json.nome, mode: 'insensitive' },
                    id: { not: Number(id) }
                }
            })
            if (existing) {
                return NextResponse.json({ error: 'Já existe um fornecedor com este nome' }, { status: 400 })
            }
        }

        const updated = await prisma.fornecedor.update({
            where: { id: Number(id) },
            data: {
                nome: json.nome,
                contato: json.contato,
                whatsapp: json.whatsapp,
                email: json.email,
                cnpj: json.cnpj,
                observacoes: json.observacoes
            }
        })

        const session = await getServerSession()
        if (session?.user?.id) {
            await recordLog(
                Number(session.user.id),
                'UPDATE',
                'FORNECEDOR',
                updated.id,
                `Atualizou fornecedor: ${updated.nome}`
            )
        }

        return NextResponse.json(updated)
    } catch {
        return NextResponse.json({ error: 'Erro ao atualizar fornecedor' }, { status: 500 })
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Fetch to get the name before deleting
        const item = await prisma.fornecedor.findUnique({ where: { id: Number(id) } })

        await prisma.fornecedor.delete({
            where: { id: parseInt(id) }
        })

        const session = await getServerSession()
        if (session?.user?.id && item) {
            await recordLog(
                Number(session.user.id),
                'DELETE',
                'FORNECEDOR',
                Number(id),
                `Excluiu fornecedor: ${item.nome}`
            )
        }

        return NextResponse.json({ message: 'Fornecedor excluído com sucesso' })
    } catch {
        return NextResponse.json({ error: 'Erro ao excluir fornecedor' }, { status: 500 })
    }
}
