import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'ES', name: 'Spain' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'IT', name: 'Italy' },
];

function generateFakeCookie(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const length = 80 + Math.floor(Math.random() * 200);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function main() {
  console.log('🌱 Seeding MillonesGang database...');

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'millonesgang' },
    update: {},
    create: {
      name: 'MillonesGang',
      slug: 'millonesgang',
      isActive: true,
    },
  });
  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@millonesgang.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@millonesgang.com',
      passwordHash: hashedPassword,
      name: 'Admin MillonesGang',
      role: 'admin',
      isActive: true,
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // Create sample cookies
  const existingCount = await prisma.cookie.count({ where: { tenantId: tenant.id } });
  
  if (existingCount === 0) {
    const cookies = [];
    const totalCookies = 500;

    for (let i = 0; i < totalCookies; i++) {
      const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      cookies.push({
        tenantId: tenant.id,
        cookieData: generateFakeCookie(),
        countryCode: country.code,
        countryName: country.name,
        status: 'available',
        isDownloaded: false,
        createdAt,
      });
    }

    await prisma.cookie.createMany({ data: cookies });
    console.log(`✅ ${totalCookies} sample cookies created`);
  } else {
    console.log(`⏭️ Cookies already exist (${existingCount}), skipping...`);
  }

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
