import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    if (!search || search.length < 3) {
        return NextResponse.json([])
    }

    try {
        const municipios = await prisma.municipio.findMany({
            where: {
                OR: [
                    { nome: { contains: search, mode: 'insensitive' } },
                    { nomeCompleto: { contains: search, mode: 'insensitive' } }
                ]
            },
            take: 20,
            orderBy: { nome: 'asc' }
        })
        return NextResponse.json(municipios)
    } catch (_error) {
        return NextResponse.json({ error: 'Erro ao buscar municípios' }, { status: 500 })
    }
}
