import { ResumeContent, ArticleIndexEntry } from './types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  skipAnimation?: boolean;
}

export function buildSystemPrompt(
  content: ResumeContent,
  articles: ArticleIndexEntry[] = []
): string {
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

  // Lightweight article index. The full body of any post is fetched on demand
  // via the read_article tool (see app/api/chat/route.ts) — keeping the prompt
  // small no matter how many articles exist.
  const articlesText = articles.length
    ? articles
        .map((a) => {
          const date = a.publishedAt ? a.publishedAt.slice(0, 10) : 'undated';
          const tags = a.tags.length ? ` [${a.tags.join(', ')}]` : '';
          return `- "${a.title}" (${date}) — slug: ${a.slug}${tags}\n  ${a.summary}`;
        })
        .join('\n')
    : 'No articles have been published yet.';

  const articlesSection = `## Articles
${header.name} has written the articles below. Only these summaries are in your context. When a visitor wants to go deeper on an article — its details, code, diagrams, or claims — call the \`read_article\` tool with the article's slug to load the full text, then answer from what you read. Do not invent or infer an article's contents from its summary alone.

${articlesText}`;

  return `You are a helpful assistant representing ${header.name}, a ${header.title}. You answer questions about their resume, experience, background, and written articles in a friendly, professional manner. Speak as if you are representing this person to potential employers or collaborators.

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

${articlesSection}

Guidelines:
- Be conversational and helpful
- Answer questions based on the resume information provided
- When a question is about a specific article, read it first with the read_article tool rather than guessing from the summary
- If asked about something not in the resume or the articles, politely say you don't have that information
- Keep responses concise but informative
- You can elaborate on resume details when relevant`;
}
