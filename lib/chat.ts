import { ResumeContent } from './types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  skipAnimation?: boolean;
}

/**
 * The chat assistant's system prompt is built from a *template* that can be
 * edited from /admin (see lib/chat-config.ts: getSystemPromptTemplate). This
 * constant is the built-in default used whenever no custom template has been
 * saved — it reproduces the assistant's original prompt exactly.
 *
 * Placeholders are filled in by buildSystemPrompt at request time:
 *   {{NAME}}   -> the resume owner's name
 *   {{TITLE}}  -> their title
 *   {{RESUME}} -> the full resume, rendered live from the current Resume-tab
 *                 content (About / Experience / Education / Skills / Projects /
 *                 Contact). Keep this placeholder so the assistant always
 *                 answers from up-to-date resume data.
 */
export const DEFAULT_SYSTEM_PROMPT_TEMPLATE = `You are a helpful assistant representing {{NAME}}, a {{TITLE}}. You answer questions about their resume, experience, and background in a friendly, professional manner. Speak as if you are representing this person to potential employers or collaborators.

Here is their resume information:

{{RESUME}}

Guidelines:
- Be conversational and helpful
- Answer questions based on the resume information provided
- If asked about something not in the resume, politely say you don't have that information
- Keep responses concise but informative
- You can elaborate on resume details when relevant`;

/** Placeholder tokens an admin can use inside a custom system-prompt template. */
export const SYSTEM_PROMPT_PLACEHOLDERS = [
  { token: '{{NAME}}', description: "The resume owner's name" },
  { token: '{{TITLE}}', description: 'Their professional title' },
  {
    token: '{{RESUME}}',
    description: 'Full resume, injected live from the Resume tab',
  },
] as const;

// Fill every {{KEY}} token with its value in a single pass. A replacer function
// is used (rather than a string replacement) so values containing `$` — e.g.
// "$120k" in a resume bullet — are inserted verbatim instead of being treated
// as replacement patterns. Unknown tokens are left untouched.
function fillTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match
  );
}

/** Renders the resume content into the markdown block used by {{RESUME}}. */
function buildResumeBlock(content: ResumeContent): string {
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

  return `## About
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
${contactText}`;
}

/**
 * Builds the assistant's system prompt by filling `template` with the live
 * resume content. `template` defaults to DEFAULT_SYSTEM_PROMPT_TEMPLATE; the
 * chat route passes the admin-configured template from getSystemPromptTemplate().
 *
 * With the default template and an unchanged resume this returns exactly the
 * same string the assistant used before the prompt became editable.
 */
export function buildSystemPrompt(
  content: ResumeContent,
  template: string = DEFAULT_SYSTEM_PROMPT_TEMPLATE
): string {
  return fillTemplate(template, {
    NAME: content.header.name,
    TITLE: content.header.title,
    RESUME: buildResumeBlock(content),
  });
}
