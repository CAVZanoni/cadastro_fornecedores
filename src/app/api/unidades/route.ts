import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { recordLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const data = await prisma.unidadeMedida.findMany({
            orderBy: { sigla: 'asc' }
        })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Erro ao buscar unidades' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { sigla, nome } = body

        if (!sigla) {
            return NextResponse.json({ error: 'Sigla é obrigatória' }, { status: 400 })
        }

        const data = await prisma.unidadeMedida.create({
            data: { sigla, nome }
        })

        const session = await getServerSession()
        if (session?.user?.id) {
            await recordLog(
                Number(session.user.id),
                'CREATE',
                'UNIDADE',
                data.id,
                `Criou unidade: ${data.sigla}`
            )
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Erro ao criar unidade de medida' }, { status: 500 })
    }
}
