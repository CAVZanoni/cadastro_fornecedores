import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const licitacoes = await prisma.licitacao.findMany({
            include: {
                propostas: true,
                municipio: true
            },
            orderBy: { id: 'desc' }
        })
        return NextResponse.json(licitacoes)
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar licitações' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json()

        if (!json.nome) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
        }
        if (!json.municipioId) {
            return NextResponse.json({ error: 'Município é obrigatório' }, { status: 400 })
        }

        const licitacao = await prisma.licitacao.create({
            data: {
                nome: json.nome,
                municipioId: Number(json.municipioId)
            }
        })
        return NextResponse.json(licitacao)
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao criar licitação' }, { status: 500 })
    }
}
