import { Experience } from '@/lib/types';

interface PrintExperienceProps {
  data: Experience[];
}

export default function PrintExperience({ data }: PrintExperienceProps) {
  if (data.length === 0) return null;

  return (
    <section className="print-section">
      <h2 className="print-section-title">Experience</h2>
      <div>
        {data.map((exp) => (
          <div key={exp.id} className="print-entry">
            <div className="print-entry-header">
              <span className="print-entry-title">{exp.jobTitle}</span>
              <span className="print-entry-date">
                {exp.startDate} — {exp.endDate}
              </span>
            </div>
            <div className="print-entry-subtitle">{exp.company}</div>
            {exp.description && (
              <p className="print-entry-description">{exp.description}</p>
            )}
            {exp.bullets?.length > 0 && (
              <ul className="print-bullets">
                {exp.bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
