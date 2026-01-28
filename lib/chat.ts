import { ResumeContent } from './types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  skipAnimation?: boolean;
}

export function buildSystemPrompt(content: ResumeContent): string {
  const { header, experience, education, skills, projects, contact } = content;

  const experienceText = experience
    .map((exp) => {
      const bulletList = (exp.bullets || []).map((b) => `  • ${b}`).join('\n');
      const desc = exp.description ? `\n  ${exp.description}` : '';
      return `- ${exp.jobTitle} at ${exp.company} (${exp.startDate} - ${exp.endDate}):${desc}${bulletList ? '\n' + bulletList : ''}`;
    })
    .join('\n\n');

  const educationText = education
    .map((edu) => {
      const bulletList = (edu.bullets || []).map((b) => `  • ${b}`).join('\n');
      const desc = edu.description ? `\n  ${edu.description}` : '';
      return `- ${edu.degree} from ${edu.institution} (${edu.startDate} - ${edu.endDate}):${desc}${bulletList ? '\n' + bulletList : ''}`;
    })
    .join('\n\n');

  const skillsText = skills.categories
    .map((cat) => `- ${cat.name}: ${cat.items.join(', ')}`)
    .join('\n');

  const projectsText = projects
    .map((proj) => {
      const links = [];
      if (proj.links.github) links.push(`GitHub: ${proj.links.github}`);
      if (proj.links.live) links.push(`Live: ${proj.links.live}`);
      const bulletList = (proj.bullets || []).map((b) => `  • ${b}`).join('\n');
      const desc = proj.description ? `\n  ${proj.description}` : '';
      const linksText = links.length ? ` [${links.join(', ')}]` : '';
      return `- ${proj.name}${linksText}:${desc}${bulletList ? '\n' + bulletList : ''}`;
    })
    .join('\n\n');

  const contactText = [
    contact.email && `Email: ${contact.email}`,
    contact.linkedin && `LinkedIn: ${contact.linkedin}`,
    contact.github && `GitHub: ${contact.github}`,
    contact.twitter && `Twitter: ${contact.twitter}`,
    contact.website && `Website: ${contact.website}`,
  ]
    .filter(Boolean)
    .join('\n');

  return `You are a helpful assistant representing ${header.name}, a ${header.title}. You answer questions about their resume, experience, and background in a friendly, professional manner. Speak as if you are representing this person to potential employers or collaborators.

Here is their resume information:

## About
${header.bio}

## Experience
${experienceText}

## Education
${educationText}

## Skills
${skillsText}

## Projects
${projectsText}

## Contact
${contactText}

Guidelines:
- Be conversational and helpful
- Answer questions based on the resume information provided
- If asked about something not in the resume, politely say you don't have that information
- Keep responses concise but informative
- You can elaborate on resume details when relevant`;
}
