import { Project } from '@/lib/types';
import SectionHeading from './SectionHeading';
import ExternalIcon from './ExternalIcon';

interface ProjectsProps {
  data: Project[];
}

/** Short, readable form of a link: `github/<repo>` for repos, the bare host otherwise. */
function shortUrl(href: string): string {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'github.com') {
      const repo = url.pathname.split('/').filter(Boolean)[1];
      if (repo) return `github/${repo}`;
    }
    return host + url.pathname.replace(/\/$/, '');
  } catch {
    return href;
  }
}

export default function Projects({ data }: ProjectsProps) {
  if (data.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <SectionHeading>Projects</SectionHeading>
        <ul className="grid gap-x-7 gap-y-8 sm:grid-cols-2 md:grid-cols-3">
          {data.map((project) => {
            // The name opens the project itself; the mono line under it shows
            // the source when there is one, so each link says where it goes.
            const primary = project.links.live || project.links.github;
            const secondary = project.links.github || project.links.live;
            return (
              <li key={project.id} className="min-w-0">
                {primary ? (
                  <a
                    href={primary}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-2xl font-semibold leading-tight tracking-[-0.025em] text-ink transition-colors hover:text-brand"
                  >
                    {project.name}
                  </a>
                ) : (
                  <h3 className="text-2xl font-semibold leading-tight tracking-[-0.025em] text-ink">
                    {project.name}
                  </h3>
                )}
                {secondary && (
                  <a
                    href={secondary}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex max-w-full items-center gap-1 font-data text-[13px] text-brand underline-offset-[3px] transition-colors hover:text-brand-strong hover:underline"
                  >
                    <span className="truncate">{shortUrl(secondary)}</span>
                    <ExternalIcon />
                  </a>
                )}
                {project.description && (
                  <p className="mt-3 text-[15px] leading-relaxed text-body">
                    {project.description}
                  </p>
                )}
                {project.bullets?.length > 0 && (
                  <p className="mt-2 text-[13px] leading-relaxed text-subtle">
                    {project.bullets.join(', ')}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
