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

        // Sync with legacy columns for better visibility
        let unitIdToSave = undefined
        let unitTextToSave = undefined

        if (Array.isArray(json.unidadeIds) && json.unidadeIds.length > 0) {
            const units = await prisma.unidadeMedida.findMany({
                where: { id: { in: json.unidadeIds.map(Number) } }
            })
            if (units.length > 0) {
                // Find index of first selected unit ID in the units array to get its sigla if needed
                // but we just need the first ID from the input and joined siglas
                unitIdToSave = Number(json.unidadeIds[0])
                unitTextToSave = units.map(u => u.sigla).join(', ')
            }
        }

        const updated = await prisma.produto.update({
            where: { id: Number(id) },
            data: {
                nome: json.nome,
                categoriaId: json.categoriaId ? Number(json.categoriaId) : undefined,
                unidadeId: unitIdToSave,
                unidadeTexto: unitTextToSave || json.unidadeLegacy || undefined,
                unidades: {
                    set: Array.isArray(json.unidadeIds)
                        ? json.unidadeIds.map((uid: number) => ({ id: Number(uid) }))
                        : []
                }
            },
            include: {
                categoria: true,
                unidade: true,
                unidades: {
                    orderBy: { sigla: 'asc' }
                }
            }
        })

        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
            await recordLog(
                Number(session.user.id),
                'UPDATE',
                'PRODUTO',
                updated.id,
                `Atualizou produto: ${updated.nome}`
            )
        }

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const item = await prisma.produto.findUnique({ where: { id: Number(id) } })

        await prisma.produto.delete({
            where: { id: Number(id) }
        })

        const session = await getServerSession()
        if (session?.user?.id && item) {
            await recordLog(
                Number(session.user.id),
                'DELETE',
                'PRODUTO',
                Number(id),
                `Excluiu produto: ${item.nome}`
            )
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Erro ao deletar produto. Verifique se há propostas vinculadas.' }, { status: 500 })
    }
}
