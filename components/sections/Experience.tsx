import { Experience as ExperienceType } from '@/lib/types';

interface ExperienceProps {
  data: ExperienceType[];
}

export default function Experience({ data }: ExperienceProps) {
  if (data.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 border-b pb-2 text-2xl font-bold text-gray-900">
          Experience
        </h2>
        <div className="space-y-8">
          {data.map((exp) => (
            <div
              key={exp.id}
              className="relative border-l-2 border-sky-200 pl-6"
            >
              <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-sky-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                {exp.jobTitle}
              </h3>
              <p className="font-medium text-stone-600">{exp.company}</p>
              <p className="mb-2 text-sm text-gray-500">
                {exp.startDate} — {exp.endDate}
              </p>
              {exp.description && (
                <p className="mb-2 text-gray-600">{exp.description}</p>
              )}
              {exp.bullets?.length > 0 && (
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
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
