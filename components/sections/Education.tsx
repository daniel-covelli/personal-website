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
              <h3 className="text-lg font-bold leading-tight tracking-[-0.01em] text-ink">
                {edu.degree}
              </h3>
              <p className="mt-0.5 text-sm font-semibold text-brand">
                {edu.institution}
              </p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.05em] text-subtle tabular-nums">
                {edu.startDate} — {edu.endDate}
              </p>
              {edu.description && (
                <p className="mt-3 text-[15px] leading-relaxed text-body">
                  {edu.description}
                </p>
              )}
              {edu.bullets?.length > 0 && (
                <p className="mt-2 text-[13px] leading-relaxed text-subtle">
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
