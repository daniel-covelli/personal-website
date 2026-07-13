/**
 * The chat assistant's system prompt is a *Liquid* template (https://liquidjs.com)
 * that can be edited from /admin (see lib/chat-config.ts: getChatConfig).
 * This module holds the built-in default and the list of variables an admin may
 * reference — it is intentionally dependency-free (no liquidjs import) so it can
 * be shared by both server code and the client-side admin editor without pulling
 * the template engine into the browser bundle. The actual rendering lives in
 * lib/chat.ts (buildSystemPrompt).
 *
 * Unlike the old implementation — where only a thin wrapper was editable and the
 * resume itself was assembled in JS — the whole prompt now lives in the template.
 * The default below reproduces the assistant's original prompt while exposing
 * every piece (role framing, resume sections, guidelines) for editing.
 *
 * Variables available while rendering (filled by buildSystemPrompt at request
 * time from the live Resume-tab content, so the assistant always answers from
 * up-to-date data):
 *   name, title, bio            -> header fields
 *   experience[]                -> { jobTitle, company, startDate, endDate, description, bullets[] }
 *   education[]                 -> { degree, institution, startDate, endDate, description, bullets[] }
 *   skills.categories[]         -> { name, items[] }
 *   projects[]                  -> { name, description, bullets[], links.github, links.live }
 *   contact                     -> { email, linkedin, github, twitter, website }
 *   resume                      -> the full resume pre-rendered as one markdown block
 *   header                      -> the raw header object (name, title, bio, imageUrl)
 *   articles[]                  -> published-article index: { title, summary, slug, tags[], date }
 *                                  (full body loaded on demand via the read_article tool)
 */
export const DEFAULT_SYSTEM_PROMPT_TEMPLATE = `You are a helpful assistant representing {{ name }}, a {{ title }}. You answer questions about their resume, experience, and background in a friendly, professional manner. Speak as if you are representing this person to potential employers or collaborators.

Here is their resume information:

## About
{{ bio }}

## Experience
{% for exp in experience %}
- {{ exp.jobTitle }} at {{ exp.company }} ({{ exp.startDate }} - {{ exp.endDate }}):{% if exp.description != blank %}
  {{ exp.description }}{% endif %}{% for bullet in exp.bullets %}
  • {{ bullet }}{% endfor %}
{% endfor %}
## Education
{% for edu in education %}
- {{ edu.degree }} from {{ edu.institution }} ({{ edu.startDate }} - {{ edu.endDate }}):{% if edu.description != blank %}
  {{ edu.description }}{% endif %}{% for bullet in edu.bullets %}
  • {{ bullet }}{% endfor %}
{% endfor %}
## Skills
{% for cat in skills.categories %}
- {{ cat.name }}: {{ cat.items | join: ', ' }}
{%- endfor %}

## Projects
{% for proj in projects %}{% capture links %}{% if proj.links.github != blank %}GitHub: {{ proj.links.github }}{% endif %}{% if proj.links.live != blank %}{% if proj.links.github != blank %}, {% endif %}Live: {{ proj.links.live }}{% endif %}{% endcapture %}
- {{ proj.name }}{% if links != blank %} [{{ links }}]{% endif %}:{% if proj.description != blank %}
  {{ proj.description }}{% endif %}{% for bullet in proj.bullets %}
  • {{ bullet }}{% endfor %}
{% endfor %}
## Contact
{% if contact.email != blank %}
Email: {{ contact.email }}
{%- endif %}{% if contact.linkedin != blank %}
LinkedIn: {{ contact.linkedin }}
{%- endif %}{% if contact.github != blank %}
GitHub: {{ contact.github }}
{%- endif %}{% if contact.twitter != blank %}
Twitter: {{ contact.twitter }}
{%- endif %}{% if contact.website != blank %}
Website: {{ contact.website }}
{%- endif %}
{%- if articles.size > 0 %}

## Articles
{{ name }} has written the articles below. Only these summaries are in your context. When a visitor wants to go deeper on an article — its details, code, diagrams, or claims — call the \`read_article\` tool with the article's slug to load the full text, then answer from what you read. Don't infer an article's contents from its summary alone.
{% for a in articles %}
- "{{ a.title }}" ({{ a.date }}) — slug: {{ a.slug }}{% if a.tags.size > 0 %} [{{ a.tags | join: ', ' }}]{% endif %}
  {{ a.summary }}
{%- endfor %}
{%- endif %}

Guidelines:
- Be conversational and helpful
- Answer questions based on the resume information provided
- When a question is about a specific article, read it first with the read_article tool rather than guessing from the summary
- If asked about something not in the resume or the articles, politely say you don't have that information
- Keep responses concise but informative
- You can elaborate on resume details when relevant`;

/**
 * Documentation shown in the admin editor — the Liquid variables/tags a custom
 * template can use. Kept here (not in the editor component) so there is a single
 * source of truth alongside the default template.
 */
export const SYSTEM_PROMPT_VARIABLES = [
  { token: '{{ name }}', description: "The resume owner's name" },
  { token: '{{ title }}', description: 'Their professional title' },
  { token: '{{ bio }}', description: 'The About / bio paragraph' },
  {
    token: '{% for exp in experience %}',
    description:
      'Jobs — exp.jobTitle, .company, .startDate, .endDate, .description, .bullets',
  },
  {
    token: '{% for edu in education %}',
    description:
      'Education — edu.degree, .institution, .startDate, .endDate, .description, .bullets',
  },
  {
    token: '{% for cat in skills.categories %}',
    description: 'Skills — cat.name, cat.items',
  },
  {
    token: '{% for proj in projects %}',
    description:
      'Projects — proj.name, .description, .bullets, .links.github, .links.live',
  },
  {
    token: 'contact',
    description:
      'Contact — contact.email, .linkedin, .github, .twitter, .website',
  },
  {
    token: '{{ resume }}',
    description: 'The entire resume pre-rendered as one markdown block',
  },
  {
    token: '{% for a in articles %}',
    description:
      'Published articles — a.title, .summary, .slug, .tags, .date. The full body is loaded on demand via the read_article tool.',
  },
] as const;

/**
 * Built-in default for the chat's opening message, generated from this editable
 * Liquid instruction sent as the first user turn (see app/api/chat/route.ts). The
 * system prompt still applies when it runs, so this only steers WHAT the first
 * message says, not the assistant's voice.
 */
export const DEFAULT_GREETING_PROMPT_TEMPLATE = `Introduce yourself in a casual, friendly way (1-2 sentences max). Keep it short and conversational - mention whose resume this is and that you can chat about their background. No formal language.`;

/** Surfaced in the greeting editor; all resume vars above are available too, but
 * the opening line rarely needs more than these. */
export const GREETING_PROMPT_VARIABLES = [
  { token: '{{ name }}', description: "The resume owner's name" },
  { token: '{{ title }}', description: 'Their professional title' },
] as const;
