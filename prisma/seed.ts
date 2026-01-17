const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const adminPassword = await bcrypt.hash('admin123', 10)
    const cesarPassword = await bcrypt.hash('Cesar@0011', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@sistema.com' },
        update: {},
        create: {
            email: 'admin@sistema.com',
            name: 'Administrador',
            password: adminPassword,
        },
    })

    const cesar = await prisma.user.upsert({
        where: { email: 'cesar.zanoni@compasa.com.br' },
        update: {},
        create: {
            email: 'cesar.zanoni@compasa.com.br',
            name: 'Cesar Zanoni',
            password: cesarPassword,
        },
    })

    console.log({ admin, cesar })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
