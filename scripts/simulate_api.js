const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.time('fetch');
    const facilities = await prisma.facility.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { priceCategories: true }
            }
        }
    });
    console.timeEnd('fetch');

    // _hasDetailedPrices 플래그 추가
    const formatted = facilities.map(f => ({
        ...f,
        minPrice: f.minPrice.toString(),
        maxPrice: f.maxPrice.toString(),
        _count: undefined,
        _hasDetailedPrices: f._count.priceCategories > 0
    }));

    console.log(`Fetched ${formatted.length} items.`);
    console.log('Sample:', JSON.stringify(formatted[0], null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
