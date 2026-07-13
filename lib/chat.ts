import { Liquid } from 'liquidjs';
import { ResumeContent } from './types';
import {
  DEFAULT_SYSTEM_PROMPT_TEMPLATE,
  SYSTEM_PROMPT_VARIABLES,
  DEFAULT_GREETING_PROMPT_TEMPLATE,
  GREETING_PROMPT_VARIABLES,
} from './chat-template';

// Re-exported so existing importers of `@/lib/chat` keep working. ChatMessage
// lives in ./types (a dependency-free module) so client components can import it
// without pulling this file's `liquidjs` dependency into the browser bundle; the
// template constants likewise live in the dependency-free chat-template module.
export type { ChatMessage } from './types';
export {
  DEFAULT_SYSTEM_PROMPT_TEMPLATE,
  SYSTEM_PROMPT_VARIABLES,
  DEFAULT_GREETING_PROMPT_TEMPLATE,
  GREETING_PROMPT_VARIABLES,
};

// A single shared Liquid engine. Templates come from admin config or the built-in
// default and are rendered against in-memory data only (no file includes / async
// filters), so synchronous rendering is safe and keeps buildSystemPrompt sync.
const engine = new Liquid();

/**
 * Renders the resume content into a single markdown block. Exposed to templates
 * as the `{{ resume }}` variable so a custom prompt can drop the whole resume in
 * one place instead of looping over each section. The built-in default template
 * renders the sections itself (see chat-template.ts) rather than using this.
 */
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
 * Builds the Liquid render context from the live resume content. Exposes the
 * full structured resume (so a template can loop over experience/projects/etc.)
 * plus a few conveniences:
 *   - `resume`: the whole resume pre-rendered as one block
 *   - NAME/TITLE/RESUME: uppercase aliases kept for backward compatibility with
 *     any prompt saved under the previous {{NAME}}/{{TITLE}}/{{RESUME}} scheme.
 */
function buildTemplateContext(content: ResumeContent): Record<string, unknown> {
  const { header, experience, education, skills, projects, contact } = content;
  const resume = buildResumeBlock(content);
  return {
    name: header.name,
    title: header.title,
    bio: header.bio,
    header,
    experience,
    education,
    skills,
    projects,
    contact,
    resume,
    // Backward-compatible aliases for the old token scheme.
    NAME: header.name,
    TITLE: header.title,
    RESUME: resume,
  };
}

/**
 * Renders `template` against the resume `context`, falling back to `fallback` if
 * a custom template fails to render (e.g. a malformed tag slipped past validation,
 * or references a field in an unexpected way) — rather than let a bad saved
 * template take the chat down. Consistent with the defensive fallbacks in
 * lib/chat-config.ts. If the fallback itself is what failed, the error propagates.
 */
function renderWithFallback(
  context: Record<string, unknown>,
  template: string,
  fallback: string
): string {
  try {
    return engine.parseAndRenderSync(template, context);
  } catch (error) {
    if (template !== fallback) {
      console.error('Failed to render custom template, using default:', error);
      return engine.parseAndRenderSync(fallback, context);
    }
    throw error;
  }
}

/** Renders the system-prompt `template` (default when omitted) against the live
 * resume content. */
export function buildSystemPrompt(
  content: ResumeContent,
  template: string = DEFAULT_SYSTEM_PROMPT_TEMPLATE
): string {
  return renderWithFallback(
    buildTemplateContext(content),
    template,
    DEFAULT_SYSTEM_PROMPT_TEMPLATE
  );
}

/** Renders the opening-message instruction `template` used to generate the chat's
 * first message. */
export function buildGreetingPrompt(
  content: ResumeContent,
  template: string = DEFAULT_GREETING_PROMPT_TEMPLATE
): string {
  return renderWithFallback(
    buildTemplateContext(content),
    template,
    DEFAULT_GREETING_PROMPT_TEMPLATE
  );
}

/** Renders `template` WITHOUT the build*Prompt fallback, so the admin editors'
 * live preview shows the real output — or the real parse/render error — for what
 * was typed. Throws on failure; the caller surfaces the message. */
export function renderTemplatePreview(
  content: ResumeContent,
  template: string
): string {
  return engine.parseAndRenderSync(template, buildTemplateContext(content));
}

/**
 * Validates that a template parses as Liquid. Returns an error message describing
 * the syntax problem, or null if it is valid. Used by the admin config API to
 * reject a broken template at save time instead of at chat time. Note this only
 * catches *syntax* errors (parse); a template can still fail at render if it uses
 * data in an unsupported way — buildSystemPrompt's fallback covers that.
 */
export function validateTemplate(template: string): string | null {
  try {
    engine.parse(template);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid template';
  }
}
