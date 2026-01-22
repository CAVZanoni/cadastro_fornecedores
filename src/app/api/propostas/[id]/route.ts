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

        const updated = await prisma.proposta.update({
            where: { id: Number(id) },
            data: {
                licitacaoId: Number(json.licitacaoId),
                fornecedorId: Number(json.fornecedorId),
                data: json.data ? new Date(json.data) : undefined,
                arquivoUrl: json.arquivoUrl || undefined,
                observacoes: json.observacoes || undefined
            },
            include: {
                licitacao: true,
                fornecedor: true
            }
        })

        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
            await recordLog(
                Number(session.user.id),
                'UPDATE',
                'PROPOSTA',
                updated.id,
                `Atualizou proposta: ${updated.licitacao.nome} - ${updated.fornecedor.nome}`
            )
        }

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
        const item = await prisma.proposta.findUnique({
            where: { id: Number(id) },
            include: { licitacao: true, fornecedor: true }
        })

        await prisma.proposta.delete({
            where: { id: Number(id) }
        })

        const session = await getServerSession()
        if (session?.user?.id && item) {
            await recordLog(
                Number(session.user.id),
                'DELETE',
                'PROPOSTA',
                Number(id),
                `Excluiu proposta: ${item.licitacao.nome} - ${item.fornecedor.nome}`
            )
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Erro ao deletar proposta' }, { status: 500 })
    }
}
