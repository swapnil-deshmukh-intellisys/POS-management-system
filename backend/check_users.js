const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, businessType: u.businessType })));
  const restaurants = await prisma.restaurant.findMany();
  console.log('Restaurants:', restaurants);
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
