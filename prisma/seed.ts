import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface IBGEMunicipio {
    id: number
    nome: string
    microrregiao: {
        mesorregiao: {
            UF: {
                sigla: string
            }
        }
    }
}

async function main() {
    console.log('Fetching municipalities from IBGE API...')

    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios')
    const municipios: IBGEMunicipio[] = await response.json()

    console.log(`Found ${municipios.length} municipalities. Seeding database...`)

    // Clear existing data
    await prisma.municipio.deleteMany()

    // Prepare data for bulk insert
    const data = municipios.map(m => {
        // Some municipalities might have null microrregiao, use regiao-imediata as fallback
        const uf = m.microrregiao?.mesorregiao?.UF?.sigla ||
            (m as any)['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla ||
            'XX'
        return {
            codigoIBGE: String(m.id),
            nome: m.nome,
            uf: uf,
            nomeCompleto: `${m.nome}/${uf}`
        }
    })

    // Batch insert (SQLite has a limit of ~999 variables, so we chunk)
    const BATCH_SIZE = 100
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE)
        await prisma.municipio.createMany({ data: batch })
        console.log(`Inserted ${Math.min(i + BATCH_SIZE, data.length)} of ${data.length}`)
    }

    console.log('Seeding complete!')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
