import path from 'path';
import { ResumeContent } from './types';
import { prisma } from './db';

async function getContentFromStructuredTables(): Promise<ResumeContent | null> {
  const [header, experiences, educations, skillCategories, projects, contact] =
    await Promise.all([
      prisma.header.findUnique({ where: { id: 'singleton' } }),
      prisma.experience.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.education.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.skillCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.project.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.contact.findUnique({ where: { id: 'singleton' } }),
    ]);

  // If no header exists, structured tables are not seeded
  if (!header) {
    return null;
  }

  return {
    header: {
      name: header.name,
      title: header.title,
      bio: header.bio,
      imageUrl: header.imageUrl,
    },
    experience: experiences.map((exp) => ({
      id: exp.id,
      jobTitle: exp.jobTitle,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate,
      description: exp.description || undefined,
      bullets: exp.bullets,
    })),
    education: educations.map((edu) => ({
      id: edu.id,
      degree: edu.degree,
      institution: edu.institution,
      startDate: edu.startDate,
      endDate: edu.endDate,
      description: edu.description || undefined,
      bullets: edu.bullets,
    })),
    skills: {
      categories: skillCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        items: cat.items,
      })),
    },
    projects: projects.map((proj) => ({
      id: proj.id,
      name: proj.name,
      description: proj.description || undefined,
      bullets: proj.bullets,
      techStack: proj.techStack,
      links: {
        github: proj.githubUrl || undefined,
        live: proj.liveUrl || undefined,
      },
    })),
    contact: contact
      ? {
          email: contact.email,
          linkedin: contact.linkedin,
          github: contact.github,
          twitter: contact.twitter,
          website: contact.website,
        }
      : {
          email: '',
          linkedin: '',
          github: '',
          twitter: '',
          website: '',
        },
  };
}

export async function getContent(): Promise<ResumeContent> {
  try {
    // Try to get content from structured tables first
    const structuredContent = await getContentFromStructuredTables();
    return structuredContent as ResumeContent;
  } catch (error) {
    console.error('Error getting content:', error);
    throw error;
  }
}

export async function saveContent(content: ResumeContent): Promise<void> {
  try {
    // Save to structured tables
    await prisma.$transaction(async (tx) => {
      // Update header
      await tx.header.upsert({
        where: { id: 'singleton' },
        update: {
          name: content.header.name,
          title: content.header.title,
          bio: content.header.bio,
          imageUrl: content.header.imageUrl || '',
        },
        create: {
          id: 'singleton',
          name: content.header.name,
          title: content.header.title,
          bio: content.header.bio,
          imageUrl: content.header.imageUrl || '',
        },
      });

      // Update experience - delete all and recreate
      await tx.experience.deleteMany({});
      for (let i = 0; i < content.experience.length; i++) {
        const exp = content.experience[i];
        await tx.experience.create({
          data: {
            id: exp.id,
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

      // Update education - delete all and recreate
      await tx.education.deleteMany({});
      for (let i = 0; i < content.education.length; i++) {
        const edu = content.education[i];
        await tx.education.create({
          data: {
            id: edu.id,
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

      // Update skill categories - delete all and recreate
      await tx.skillCategory.deleteMany({});
      for (let i = 0; i < content.skills.categories.length; i++) {
        const cat = content.skills.categories[i];
        await tx.skillCategory.create({
          data: {
            id: cat.id,
            name: cat.name,
            items: cat.items,
            sortOrder: i,
          },
        });
      }

      // Update projects - delete all and recreate
      await tx.project.deleteMany({});
      for (let i = 0; i < content.projects.length; i++) {
        const proj = content.projects[i];
        await tx.project.create({
          data: {
            id: proj.id,
            name: proj.name,
            description: proj.description || null,
            bullets: proj.bullets || [],
            techStack: proj.techStack,
            githubUrl: proj.links?.github || null,
            liveUrl: proj.links?.live || null,
            sortOrder: i,
          },
        });
      }

      // Update contact
      await tx.contact.upsert({
        where: { id: 'singleton' },
        update: {
          email: content.contact.email || '',
          linkedin: content.contact.linkedin || '',
          github: content.contact.github || '',
          twitter: content.contact.twitter || '',
          website: content.contact.website || '',
        },
        create: {
          id: 'singleton',
          email: content.contact.email || '',
          linkedin: content.contact.linkedin || '',
          github: content.contact.github || '',
          twitter: content.contact.twitter || '',
          website: content.contact.website || '',
        },
      });
    });
  } catch (error) {
    console.error('Error saving to structured tables:', error);
    throw error;
  }
}
