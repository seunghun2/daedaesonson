const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const facilities = await prisma.facility.count();
    const categories = await prisma.priceCategory.count();
    const items = await prisma.priceItem.count();

    console.log(`DB Stats:`);
    console.log(`Facilities: ${facilities}`);
    console.log(`Categories: ${categories}`);
    console.log(`PriceItems: ${items}`); // Should be ~9,455

    // Check one sample
    const sample = await prisma.priceItem.findFirst({
        include: { facility: true, category: true }
    });
    console.log('Sample Item:', sample ? `${sample.facility.name} - ${sample.category.name} - ${sample.itemName} (${sample.price})` : 'None');
    console.log('Sample Images:', sample ? sample.facility.images : 'None');
}

main()
    .finally(async () => await prisma.$disconnect());
