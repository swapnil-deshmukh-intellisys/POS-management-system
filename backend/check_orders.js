const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.kitchenOrder.findMany({
    include: {
      items: {
        include: {
          menuItem: true
        }
      },
      table: true,
      waiter: true
    }
  });
  console.log("=== DB KITCHEN ORDERS ===");
  console.log("Count:", orders.length);
  console.log(JSON.stringify(orders.map(o => ({
    id: o.id,
    status: o.status,
    table: o.table?.tableNumber,
    waiter: o.waiter?.name,
    items: o.items.map(it => `${it.menuItem?.name} Qty ${it.quantity}`)
  })), null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
