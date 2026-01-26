import { promises as fs } from 'fs';
import path from 'path';
import { ResumeContent } from './types';
import { prisma } from './db';

const contentPath = path.join(process.cwd(), 'data', 'content.json');

async function getContentFromFile(): Promise<ResumeContent> {
  const fileContents = await fs.readFile(contentPath, 'utf8');
  return JSON.parse(fileContents) as ResumeContent;
}

export async function getContent(): Promise<ResumeContent> {
  try {
    // Try to get content from database first
    const dbContent = await prisma.resumeContent.findUnique({
      where: { id: 'singleton' },
    });

    if (dbContent) {
      return dbContent.content as unknown as ResumeContent;
    }
  } catch {
    // Database not available, fall back to file
  }

  // Fall back to file-based content
  return getContentFromFile();
}

export async function saveContent(content: ResumeContent): Promise<void> {
  try {
    // Save to database
    await prisma.resumeContent.upsert({
      where: { id: 'singleton' },
      update: { content: content as object },
      create: { id: 'singleton', content: content as object },
    });
  } catch {
    // If database fails, fall back to file
    await fs.writeFile(contentPath, JSON.stringify(content, null, 2), 'utf8');
  }
}
