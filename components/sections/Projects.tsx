import { Project } from '@/lib/types';

interface ProjectsProps {
  data: Project[];
}

export default function Projects({ data }: ProjectsProps) {
  if (data.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 border-b pb-2 text-2xl font-bold text-gray-900">
          Projects
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {data.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border border-stone-200 bg-stone-100 p-6 shadow-sm"
            >
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {project.name}
              </h3>
              {(project.description || project.bullets?.length > 0) && (
                <div className="mb-4">
                  {project.description && (
                    <p className="mb-2 text-sm text-gray-600">
                      {project.description}
                    </p>
                  )}
                  {project.bullets?.length > 0 && (
                    <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                      {project.bullets.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="mb-4 flex flex-wrap gap-2">
                {project.techStack.map((tech, index) => (
                  <span
                    key={index}
                    className="rounded bg-stone-200 px-2 py-1 text-xs text-stone-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex gap-4">
                {project.links.github && (
                  <a
                    href={project.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-sky-600 hover:text-sky-700 hover:underline"
                  >
                    GitHub
                  </a>
                )}
                {project.links.live && (
                  <a
                    href={project.links.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-sky-600 hover:text-sky-700 hover:underline"
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
