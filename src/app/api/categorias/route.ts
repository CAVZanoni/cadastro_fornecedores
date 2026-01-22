import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { recordLog } from '@/lib/audit'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const data = await prisma.categoriaProduto.findMany({
            orderBy: { nome: 'asc' }
        })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { nome } = body

        if (!nome) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
        }

        const data = await prisma.categoriaProduto.create({
            data: { nome }
        })

        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
            await recordLog(
                Number(session.user.id),
                'CREATE',
                'CATEGORIA',
                data.id,
                `Criou categoria: ${data.nome}`
            )
        }

        return NextResponse.json(data)
    } catch (_error) {
        console.error(_error)
        return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 })
    }
}
