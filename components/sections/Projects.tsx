import { Project } from '@/lib/types';
import SectionHeading from './SectionHeading';

interface ProjectsProps {
  data: Project[];
}

export default function Projects({ data }: ProjectsProps) {
  if (data.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <SectionHeading>Projects</SectionHeading>
        <div className="grid gap-6 md:grid-cols-2">
          {data.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border border-hair bg-panel p-6 shadow-soft"
            >
              <h3 className="mb-2 text-lg font-semibold text-ink">
                {project.name}
              </h3>
              {project.description && (
                <p className="mb-4 text-sm text-body">{project.description}</p>
              )}
              {project.bullets?.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {project.bullets.map((bullet, i) => (
                    <span
                      key={i}
                      className="rounded bg-chip px-2 py-1 text-xs text-chip-fg"
                    >
                      {bullet}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-4">
                {project.links.github && (
                  <a
                    href={project.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand hover:text-brand-strong hover:underline"
                  >
                    GitHub
                  </a>
                )}
                {project.links.live && (
                  <a
                    href={project.links.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand hover:text-brand-strong hover:underline"
                  >
                    Live Demo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
