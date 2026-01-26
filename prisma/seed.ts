import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ContentJson {
  header: {
    name: string;
    title: string;
    bio: string;
    imageUrl: string;
  };
  experience: Array<{
    id: string;
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string;
    description?: string;
    bullets?: string[];
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    startDate: string;
    endDate: string;
    description?: string;
    bullets?: string[];
  }>;
  skills: {
    categories: Array<{
      id: string;
      name: string;
      items: string[];
    }>;
  };
  projects: Array<{
    id: string;
    name: string;
    description?: string;
    bullets?: string[];
    techStack: string[];
    links: {
      github?: string;
      live?: string;
    };
  }>;
  contact: {
    email: string;
    linkedin: string;
    github: string;
    twitter: string;
    website: string;
  };
}

async function main() {
  console.log('Starting seed...');

  // Read content.json
  const contentPath = path.join(process.cwd(), 'data', 'content.json');
  const contentJson: ContentJson = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));

  // Seed Header
  console.log('Seeding header...');
  await prisma.header.upsert({
    where: { id: 'singleton' },
    update: {
      name: contentJson.header.name,
      title: contentJson.header.title,
      bio: contentJson.header.bio,
      imageUrl: contentJson.header.imageUrl || '',
    },
    create: {
      id: 'singleton',
      name: contentJson.header.name,
      title: contentJson.header.title,
      bio: contentJson.header.bio,
      imageUrl: contentJson.header.imageUrl || '',
    },
  });

  // Seed Experience
  console.log('Seeding experience...');
  // Clear existing experience entries
  await prisma.experience.deleteMany({});
  for (let i = 0; i < contentJson.experience.length; i++) {
    const exp = contentJson.experience[i];
    await prisma.experience.create({
      data: {
        jobTitle: exp.jobTitle,
        company: exp.company,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description || null,
        bullets: exp.bullets || [],
        sortOrder: i,
      },
    });
  }

  // Seed Education
  console.log('Seeding education...');
  await prisma.education.deleteMany({});
  for (let i = 0; i < contentJson.education.length; i++) {
    const edu = contentJson.education[i];
    await prisma.education.create({
      data: {
        degree: edu.degree,
        institution: edu.institution,
        startDate: edu.startDate,
        endDate: edu.endDate,
        description: edu.description || null,
        bullets: edu.bullets || [],
        sortOrder: i,
      },
    });
  }

  // Seed Skill Categories
  console.log('Seeding skills...');
  await prisma.skillCategory.deleteMany({});
  for (let i = 0; i < contentJson.skills.categories.length; i++) {
    const cat = contentJson.skills.categories[i];
    await prisma.skillCategory.create({
      data: {
        name: cat.name,
        items: cat.items,
        sortOrder: i,
      },
    });
  }

  // Seed Projects
  console.log('Seeding projects...');
  await prisma.project.deleteMany({});
  for (let i = 0; i < contentJson.projects.length; i++) {
    const proj = contentJson.projects[i];
    await prisma.project.create({
      data: {
        name: proj.name,
        description: proj.description || null,
        bullets: proj.bullets || [],
        techStack: proj.techStack,
        githubUrl: proj.links.github || null,
        liveUrl: proj.links.live || null,
        sortOrder: i,
      },
    });
  }

  // Seed Contact
  console.log('Seeding contact...');
  await prisma.contact.upsert({
    where: { id: 'singleton' },
    update: {
      email: contentJson.contact.email || '',
      linkedin: contentJson.contact.linkedin || '',
      github: contentJson.contact.github || '',
      twitter: contentJson.contact.twitter || '',
      website: contentJson.contact.website || '',
    },
    create: {
      id: 'singleton',
      email: contentJson.contact.email || '',
      linkedin: contentJson.contact.linkedin || '',
      github: contentJson.contact.github || '',
      twitter: contentJson.contact.twitter || '',
      website: contentJson.contact.website || '',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
