import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tenantId = '9dda8017-32f9-45a1-8567-82b5a976758f';
  const users = await prisma.user.findMany({
    where: { tenantId, role: { not: 'superadmin' } }
  });
  console.log('Filtered users count:', users.length);
  console.log(users.map(u => u.name));
}
main().finally(() => prisma.$disconnect());
