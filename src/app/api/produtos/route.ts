import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { recordLog } from '@/lib/audit'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const data = await prisma.produto.findMany({
            include: {
                categoria: true,
                unidade: true,
                unidades: {
                    orderBy: { sigla: 'asc' }
                }
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
        const { nome, categoriaId, unidadeId, unidadeIds, unidadeLegacy } = body

        if (!nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

        const data = await prisma.produto.create({
            data: {
                nome,
                categoriaId: categoriaId ? Number(categoriaId) : undefined,
                unidadeId: unidadeId ? Number(unidadeId) : undefined,
                unidadeTexto: unidadeLegacy || undefined,
                unidades: {
                    connect: (Array.isArray(unidadeIds) && unidadeIds.length > 0)
                        ? unidadeIds.map((id: number) => ({ id: Number(id) }))
                        : undefined
                }
            },
            include: {
                categoria: true,
                unidade: true,
                unidades: true
            }
        })

        const session = await getServerSession(authOptions)
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
    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
    }
}
