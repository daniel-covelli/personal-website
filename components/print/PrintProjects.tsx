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
              <div className="print-tech-stack">
                {project.bullets.join(' | ')}
              </div>
            )}
            {(project.links.github || project.links.live) && (
              <div className="print-project-links">
                {project.links.github && (
                  <a href={project.links.github} className="print-contact-link">
                    GitHub
                  </a>
                )}
                {project.links.github && project.links.live && (
                  <span className="print-contact-separator">|</span>
                )}
                {project.links.live && (
                  <a href={project.links.live} className="print-contact-link">
                    Live Demo
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
