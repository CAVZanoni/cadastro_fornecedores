import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { recordLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const data = await prisma.produto.findMany({
            include: {
                categoria: true,
                unidade: true
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { nome, categoriaId, unidadeId, unidadeLegacy } = body

        if (!nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

        const data = await prisma.produto.create({
            data: {
                nome,
                categoriaId: categoriaId ? Number(categoriaId) : undefined,
                unidadeId: unidadeId ? Number(unidadeId) : undefined,
                unidadeTexto: unidadeLegacy || undefined
            },
            include: {
                categoria: true,
                unidade: true
            }
        })

        const session = await getServerSession()
        if (session?.user?.id) {
            await recordLog(
                Number(session.user.id),
                'CREATE',
                'PRODUTO',
                data.id,
                `Criou produto: ${data.nome}`
            )
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
    }
}
