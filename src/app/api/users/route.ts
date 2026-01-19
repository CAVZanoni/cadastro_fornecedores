import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'

export async function GET() {
    try {
        const session = await getServerSession()
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(users)
    } catch {
        return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession()
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await request.json()
        const { name, email, password } = body

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
        }

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json({ error: 'Este e-mail já está cadastrado' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        })

        return NextResponse.json({ id: user.id, name: user.name, email: user.email })
    } catch {
        return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
    }
}
