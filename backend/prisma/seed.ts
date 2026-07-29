import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Real ERP CSV imports (usuarios/representantes, clientes, produtos) land
// here once the export column format is agreed — see docs/PLAN.md Phase 8.
// Until then, this only guarantees a working admin login for local dev.
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@goedert.com.br'
  const senha = process.env.SEED_ADMIN_PASSWORD ?? 'trocar-esta-senha'
  const passwordHash = await bcrypt.hash(senha, 12)

  await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: {
      nome: 'Admin',
      email,
      passwordHash,
      isAdmin: true,
    },
  })

  console.log(`[seed] usuário admin garantido: ${email}`)
}

main()
  .catch((erro) => {
    console.error('[seed] erro:', erro)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
