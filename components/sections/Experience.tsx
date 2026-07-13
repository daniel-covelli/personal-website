import { Experience as ExperienceType } from '@/lib/types';
import SectionHeading from './SectionHeading';

interface ExperienceProps {
  data: ExperienceType[];
}

export default function Experience({ data }: ExperienceProps) {
  if (data.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <SectionHeading>Experience</SectionHeading>
        <div className="space-y-8">
          {data.map((exp) => (
            <div key={exp.id} className="relative border-l-2 border-rail pl-6">
              <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-brand" />
              <h3 className="text-lg font-bold leading-tight tracking-[-0.01em] text-ink">
                {exp.jobTitle}
              </h3>
              {/* Gaps are 3px/4px (not equal) so the *visual* space reads even:
                  the taller title line box leaves ~1px more room below it. */}
              <p className="mt-[3px] text-sm font-semibold leading-tight text-brand">
                {exp.company}
              </p>
              <p className="mt-1 text-xs font-medium uppercase leading-tight tracking-[0.05em] text-subtle tabular-nums">
                {exp.startDate} — {exp.endDate}
              </p>
              {exp.description && (
                <p className="mt-3 text-[15px] leading-relaxed text-body">
                  {exp.description}
                </p>
              )}
              {exp.bullets?.length > 0 && (
                <ul className="mt-3 list-disc space-y-2.5 pl-5 text-sm leading-normal text-body marker:text-subtle">
                  {exp.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
