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
        const categoryId = Number(id)

        // Check if category is in use
        const inUse = await prisma.produto.findFirst({
            where: { categoriaId: categoryId }
        })

        if (inUse) {
            return NextResponse.json({ error: 'Categoria em uso por produtos' }, { status: 400 })
        }

        const data = await prisma.categoriaProduto.delete({
            where: { id: categoryId }
        })

        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
            await recordLog(
                Number(session.user.id),
                'DELETE',
                'CATEGORIA',
                data.id,
                `Excluiu categoria: ${data.nome}`
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 })
    }
}
