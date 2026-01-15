import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const data = await prisma.produto.findMany({ orderBy: { createdAt: 'desc' } })
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { nome, unidade } = body
        if (!nome || !unidade) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })

        const data = await prisma.produto.create({
            data: { nome, unidade }
        })
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
    }
}
