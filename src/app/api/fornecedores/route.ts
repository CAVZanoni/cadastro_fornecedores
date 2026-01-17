import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const data = await prisma.fornecedor.findMany({ orderBy: { createdAt: 'desc' } })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Erro ao buscar fornecedores' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { nome, contato, whatsapp, email, cnpj } = body
        if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

        const data = await prisma.fornecedor.create({
            data: { nome, contato, whatsapp, email, cnpj }
        })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Erro ao criar fornecedor' }, { status: 500 })
    }
}
