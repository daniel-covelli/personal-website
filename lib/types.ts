export interface Header {
  name: string;
  title: string;
  bio: string;
  imageUrl: string;
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description?: string;
  bullets: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  startDate: string;
  endDate: string;
  description?: string;
  bullets: string[];
}

export interface SkillCategory {
  id: string;
  name: string;
  items: string[];
}

export interface Skills {
  categories: SkillCategory[];
}

export interface ProjectLinks {
  github?: string;
  live?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  bullets: string[];
  links: ProjectLinks;
}

export interface Contact {
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  twitter: string;
  website: string;
}

export interface ResumeContent {
  header: Header;
  experience: Experience[];
  education: Education[];
  skills: Skills;
  projects: Project[];
  contact: Contact;
}

/**
 * A long-form article. `body` is Markdown (GFM + fenced code + ```mermaid
 * diagrams). Date fields are ISO strings (Prisma Dates serialized at the data
 * layer) so the type is safe to pass from Server to Client Components.
 */
export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  headerImageUrl: string;
  tags: string[];
  placement: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * The lightweight per-article record the chat assistant always carries in its
 * system prompt. The full `body` is fetched on demand via the read_article
 * tool — see lib/chat.ts and app/api/chat/route.ts.
 */
export interface ArticleIndexEntry {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  publishedAt: string | null;
}

/** Payload the admin editor sends to create/update an article. */
export interface ArticleInput {
  slug?: string;
  title: string;
  summary: string;
  body: string;
  headerImageUrl: string;
  tags: string[];
  placement?: string;
  published: boolean;
  publishedAt: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  skipAnimation?: boolean;
}
