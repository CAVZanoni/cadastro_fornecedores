import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordLog } from '@/lib/audit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params
        const session = await getServerSession(authOptions)
        if (!session || session.user?.email !== 'admin@sistema.com') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
        }

        const userId = parseInt(id)

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Prevent admin from deleting themselves
        if (user.email === 'admin@sistema.com') {
            return NextResponse.json({ error: 'Não é possível deletar o usuário administrador' }, { status: 400 })
        }

        // Delete logs first to avoid constraint issues if not cascaded
        await prisma.auditLog.deleteMany({
            where: { userId: userId }
        })

        await prisma.user.delete({
            where: { id: userId }
        })

        if (session?.user?.id) {
            await recordLog(
                Number(session.user.id),
                'DELETE',
                'USER',
                userId,
                `Deletou usuário: ${user.email}`
            )
        }

        return NextResponse.json({ message: 'Usuário deletado com sucesso' })
    } catch (error) {
        console.error('Erro ao deletar usuário:', error)
        return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 })
    }
}
