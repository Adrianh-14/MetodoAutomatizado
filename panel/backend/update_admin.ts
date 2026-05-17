import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.user.update({
    where: { email: 'admin@millonesgang.com' },
    data: { role: 'superadmin' }
  });
  console.log('Successfully updated to superadmin');
}
main().finally(() => prisma.$disconnect());
