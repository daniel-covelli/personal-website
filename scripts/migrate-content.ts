import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting content migration...');

  const contentPath = path.join(process.cwd(), 'data', 'content.json');

  try {
    const fileContents = await fs.readFile(contentPath, 'utf8');
    const content = JSON.parse(fileContents);

    await prisma.resumeContent.upsert({
      where: { id: 'singleton' },
      update: { content },
      create: { id: 'singleton', content },
    });

    console.log('Content migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
