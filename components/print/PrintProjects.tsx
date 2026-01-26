import { Project } from '@/lib/types';

interface PrintProjectsProps {
  data: Project[];
}

export default function PrintProjects({ data }: PrintProjectsProps) {
  if (data.length === 0) return null;

  return (
    <section className="print-section">
      <h2 className="print-section-title">Projects</h2>
      <div className="print-projects-grid">
        {data.map((project) => (
          <div key={project.id} className="print-project">
            <div className="print-project-name">{project.name}</div>
            {project.description && (
              <p className="print-project-description">{project.description}</p>
            )}
            {project.bullets?.length > 0 && (
              <ul className="print-bullets">
                {project.bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            )}
            {project.techStack.length > 0 && (
              <div className="print-tech-stack">
                {project.techStack.join(' | ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
