import { promises as fs } from 'fs';
import path from 'path';
import { ResumeContent } from './types';

const contentPath = path.join(process.cwd(), 'data', 'content.json');

export async function getContent(): Promise<ResumeContent> {
  const fileContents = await fs.readFile(contentPath, 'utf8');
  return JSON.parse(fileContents) as ResumeContent;
}

export async function saveContent(content: ResumeContent): Promise<void> {
  await fs.writeFile(contentPath, JSON.stringify(content, null, 2), 'utf8');
}
