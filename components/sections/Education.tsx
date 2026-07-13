import { Education as EducationType } from '@/lib/types';
import SectionHeading from './SectionHeading';

interface EducationProps {
  data: EducationType[];
}

export default function Education({ data }: EducationProps) {
  if (data.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <SectionHeading>Education</SectionHeading>
        <div className="space-y-6">
          {data.map((edu) => (
            <div key={edu.id}>
              <h3 className="text-lg font-semibold text-ink">{edu.degree}</h3>
              <p className="font-medium text-body">{edu.institution}</p>
              <p className="mb-2 text-sm text-subtle">
                {edu.startDate} — {edu.endDate}
              </p>
              {edu.description && (
                <p className="mb-2 text-body">{edu.description}</p>
              )}
              {edu.bullets?.length > 0 && (
                <p className="text-sm text-body">
                  {edu.bullets.join(' · ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
