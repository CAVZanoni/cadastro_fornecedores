import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Senha", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Dados de login necessários")
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user) {
                    throw new Error("Usuário não encontrado")
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    throw new Error("Senha incorreta")
                }

                return {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.name,
                }
            }
        })
    ],
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
        maxAge: 13 * 60 * 60, // 13 horas
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
            }
            return session
        }
    }
}
