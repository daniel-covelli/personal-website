import { Education } from '@/lib/types';

interface PrintEducationProps {
  data: Education[];
}

export default function PrintEducation({ data }: PrintEducationProps) {
  if (data.length === 0) return null;

  return (
    <section className="print-section">
      <h2 className="print-section-title">Education</h2>
      <div>
        {data.map((edu) => (
          <div key={edu.id} className="print-entry">
            <div className="print-entry-header">
              <span className="print-entry-title">{edu.degree}</span>
              <span className="print-entry-date">
                {edu.startDate} — {edu.endDate}
              </span>
            </div>
            <div className="print-entry-subtitle">{edu.institution}</div>
            {edu.description && (
              <p className="print-entry-description">{edu.description}</p>
            )}
            {edu.bullets?.length > 0 && (
              <ul className="print-bullets">
                {edu.bullets.map((bullet, i) => (
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
