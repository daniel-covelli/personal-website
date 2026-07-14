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
        <div className="grid gap-5 md:grid-cols-3">
          {data.map((project) => (
            <div
              key={project.id}
              className="flex h-full flex-col rounded-xl border border-hair bg-panel p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-subtle"
            >
              <h3 className="text-base font-semibold leading-snug tracking-[-0.01em] text-ink">
                {project.name}
              </h3>
              {project.description && (
                <p className="mt-2 text-sm leading-relaxed text-body">
                  {project.description}
                </p>
              )}
              {project.bullets?.length > 0 && (
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {project.bullets.map((bullet, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-chip px-2 py-0.5 text-xs font-medium text-chip-fg"
                    >
                      {bullet}
                    </span>
                  ))}
                </div>
              )}
              {(project.links.github || project.links.live) && (
                <div className="mt-auto pt-6">
                  <div className="flex gap-4 border-t border-hair pt-4">
                    {project.links.github && (
                      <a
                        href={project.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-brand transition-colors hover:text-brand-strong"
                      >
                        GitHub
                      </a>
                    )}
                    {project.links.live && (
                      <a
                        href={project.links.live}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-brand transition-colors hover:text-brand-strong"
                      >
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
