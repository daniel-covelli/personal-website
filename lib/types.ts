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
