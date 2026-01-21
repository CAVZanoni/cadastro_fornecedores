import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await getServerSession()
        if (!session || session.user?.email !== 'admin@sistema.com') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
        }

        const logs = await prisma.auditLog.findMany({
            include: {
                user: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 500 // Limit for performance
        })
        return NextResponse.json(logs)
    } catch (error) {
        console.error('Error fetching logs:', error)
        return NextResponse.json({ error: 'Erro ao buscar logs' }, { status: 500 })
    }
}
