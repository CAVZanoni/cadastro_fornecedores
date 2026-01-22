import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { recordLog } from '@/lib/audit'
import { authOptions } from '@/lib/auth'

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

        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
            await recordLog(
                Number(session.user.id),
                'UPDATE',
                'LICITACAO',
                updated.id,
                `Atualizou licitação: ${updated.nome}`
            )
        }

        return NextResponse.json(updated)
    } catch {
        return NextResponse.json({ error: 'Erro ao atualizar licitação' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const item = await prisma.licitacao.findUnique({ where: { id: Number(id) } })

        await prisma.licitacao.delete({
            where: { id: Number(id) }
        })

        const session = await getServerSession(authOptions)
        if (session?.user?.id && item) {
            await recordLog(
                Number(session.user.id),
                'DELETE',
                'LICITACAO',
                Number(id),
                `Excluiu licitação: ${item.nome}`
            )
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Erro ao deletar licitação. Verifique se há propostas vinculadas.' }, { status: 500 })
    }
}
