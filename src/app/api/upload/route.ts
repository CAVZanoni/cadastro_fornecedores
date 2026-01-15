import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
        return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Try Vercel Blob (Production)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
            const blob = await put(file.name, file, { access: 'public' })
            return NextResponse.json({ url: blob.url })
        } catch (error) {
            console.error('Vercel Blob error:', error)
            return NextResponse.json({ error: 'Erro no upload para Vercel Blob' }, { status: 500 })
        }
    }

    // Fallback to Local Storage (Development)
    try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads')
        await mkdir(uploadDir, { recursive: true })

        // Unique filename to prevent overwrite
        const filename = `${Date.now()}-${file.name.replace(/\s/g, '-')}`
        const filepath = path.join(uploadDir, filename)

        await writeFile(filepath, buffer)

        // Return local URL
        const url = `/uploads/${filename}`
        return NextResponse.json({ url })

    } catch (error) {
        console.error('Local upload error:', error)
        return NextResponse.json({ error: 'Erro no upload local' }, { status: 500 })
    }
}
