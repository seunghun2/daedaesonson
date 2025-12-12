const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('🌱 Seeding database...');

    // 1. seeds.json 파일 읽기
    const seedPath = path.join(__dirname, '../seeds.json');
    if (!fs.existsSync(seedPath)) {
        console.error('❌ seeds.json not found! Run fetchFullData.js first.');
        return;
    }

    const rawData = fs.readFileSync(seedPath, 'utf8');
    const SEED_DATA = JSON.parse(rawData);

    console.log(`📦 Loaded ${SEED_DATA.length} items from seeds.json`);

    // 2. 기존 데이터 삭제 (중복 방지)
    await prisma.facility.deleteMany();
    console.log('🗑️  Cleared existing data.');

    // 3. 트랜잭션으로 배치 처리 (SQLite createMany 이슈 우회)
    const BATCH_SIZE = 50; // 트랜잭션 크기 조절
    for (let i = 0; i < SEED_DATA.length; i += BATCH_SIZE) {
        const batch = SEED_DATA.slice(i, i + BATCH_SIZE);

        // 트랜잭션으로 묶어서 실행
        await prisma.$transaction(
            batch.map(item => prisma.facility.create({ data: item }))
        );

        process.stdout.write(`\r✅ Inserted ${Math.min(i + BATCH_SIZE, SEED_DATA.length)} / ${SEED_DATA.length}`);
    }

    console.log('\n✨ Seeding finished successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
