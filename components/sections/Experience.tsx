import { Experience as ExperienceType, Article } from '@/lib/types';
import SectionHeading from './SectionHeading';
import ExperienceFieldNotes from './ExperienceFieldNotes';

interface ExperienceProps {
  data: ExperienceType[];
  notesByCompany?: Record<string, Article[]>;
}

export default function Experience({ data, notesByCompany }: ExperienceProps) {
  if (data.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <SectionHeading>Experience</SectionHeading>
        <div className="relative space-y-8 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-hair before:content-['']">
          {data.map((exp) => (
            <div key={exp.id} className="relative pl-7">
              <span
                aria-hidden="true"
                className="tl-halo absolute left-[2.5px] top-[7px] h-1.5 w-1.5 rounded-full bg-brand"
              />
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
              {notesByCompany?.[exp.company]?.length ? (
                <ExperienceFieldNotes notes={notesByCompany[exp.company]} />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
