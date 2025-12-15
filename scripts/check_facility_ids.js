// scripts/check_facility_ids.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.facility.count();
    console.log(`Total Facilities: ${count}`);

    if (count > 0) {
        const samples = await prisma.facility.findMany({ take: 5 });
        console.log('Sample IDs:', samples.map(f => ({ id: f.id, name: f.name })));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
