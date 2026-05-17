import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@millonesgang.com' }
  });
  console.log('Admin role is:', admin?.role);
}
main().finally(() => prisma.$disconnect());
