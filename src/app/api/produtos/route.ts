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
            orderBy: { nome: 'asc' }
        })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { nome, categoriaId, unidadeIds, unidadeLegacy } = body

        if (!nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

        // Sync with legacy columns for better visibility
        let unitIdToSave = undefined
        let unitTextToSave = undefined

        if (Array.isArray(unidadeIds) && unidadeIds.length > 0) {
            const units = await prisma.unidadeMedida.findMany({
                where: { id: { in: unidadeIds.map(Number) } }
            })
            if (units.length > 0) {
                unitIdToSave = Number(unidadeIds[0])
                unitTextToSave = units.map(u => u.sigla).join(', ')
            }
        }

        const data = await prisma.produto.create({
            data: {
                nome,
                categoriaId: categoriaId ? Number(categoriaId) : undefined,
                unidadeId: unitIdToSave,
                unidadeTexto: unitTextToSave || unidadeLegacy || undefined,
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
