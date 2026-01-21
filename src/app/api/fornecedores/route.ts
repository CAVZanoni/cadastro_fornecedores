import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { recordLog } from '@/lib/audit'

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
        const { nome, contato, whatsapp, email, cnpj, observacoes } = body
        if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

        // Check for duplicate name (case-insensitive)
        const existing = await prisma.fornecedor.findFirst({
            where: { nome: { equals: nome, mode: 'insensitive' } }
        })
        if (existing) {
            return NextResponse.json({ error: 'Já existe um fornecedor com este nome' }, { status: 400 })
        }

        const data = await prisma.fornecedor.create({
            data: { nome, contato, whatsapp, email, cnpj, observacoes }
        })

        const session = await getServerSession()
        if (session?.user?.id) {
            await recordLog(
                Number(session.user.id),
                'CREATE',
                'FORNECEDOR',
                data.id,
                `Criou fornecedor: ${data.nome}`
            )
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Erro ao criar fornecedor' }, { status: 500 })
    }
}
