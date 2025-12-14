import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { name: 'Basic' },
    update: { amount: 10000, isActive: true },
    create: { name: 'Basic', amount: 10000, currency: 'KRW', isActive: true },
  });

  await prisma.plan.upsert({
    where: { name: 'Pro' },
    update: { amount: 30000, isActive: true },
    create: { name: 'Pro', amount: 30000, currency: 'KRW', isActive: true },
  });
}

main().finally(async () => prisma.$disconnect());
