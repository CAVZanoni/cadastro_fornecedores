import { prisma } from './prisma'

export async function recordLog(
    userId: number,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: 'LICITACAO' | 'FORNECEDOR' | 'PRODUTO' | 'PROPOSTA' | 'ITEM' | 'USER' | 'CATEGORIA' | 'UNIDADE',
    entityId?: number,
    details?: string
) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                details
            }
        })
    } catch (error) {
        console.error('Failed to record audit log:', error)
    }
}
