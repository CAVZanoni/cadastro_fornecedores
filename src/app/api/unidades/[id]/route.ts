import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { recordLog } from '@/lib/audit'
import { authOptions } from '@/lib/auth'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const unidadeId = Number(id)

        // Check if unit is in use
        const inUse = await prisma.itemProposta.findFirst({
            where: { unidadeId: unidadeId }
        })

        const inUseProd = await prisma.produto.findFirst({
            where: {
                OR: [
                    { unidadeId: unidadeId },
                    { unidades: { some: { id: unidadeId } } }
                ]
            }
        })

        if (inUse || inUseProd) {
            return NextResponse.json({ error: 'Unidade em uso' }, { status: 400 })
        }

        const data = await prisma.unidadeMedida.delete({
            where: { id: unidadeId }
        })

        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
            await recordLog(
                Number(session.user.id),
                'DELETE',
                'UNIDADE',
                data.id,
                `Excluiu unidade: ${data.sigla}`
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Erro ao excluir unidade' }, { status: 500 })
    }
}
