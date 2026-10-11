import type { PrismaClient } from "./prisma.ts"

export type DatabaseHealthCheck = () => Promise<boolean>

export function createDatabaseHealthCheck(prisma: PrismaClient): DatabaseHealthCheck {
  return async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
}
