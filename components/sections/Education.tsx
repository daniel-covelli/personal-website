import { Education as EducationType } from '@/lib/types';

interface EducationProps {
  data: EducationType[];
}

export default function Education({ data }: EducationProps) {
  if (data.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 border-b pb-2 text-2xl font-bold text-gray-900">
          Education
        </h2>
        <div className="space-y-6">
          {data.map((edu) => (
            <div key={edu.id}>
              <h3 className="text-lg font-semibold text-gray-900">
                {edu.degree}
              </h3>
              <p className="font-medium text-stone-600">{edu.institution}</p>
              <p className="mb-2 text-sm text-gray-500">
                {edu.startDate} — {edu.endDate}
              </p>
              {edu.description && (
                <p className="mb-2 text-gray-600">{edu.description}</p>
              )}
              {edu.bullets?.length > 0 && (
                <ul className="list-inside list-disc space-y-1 text-gray-600">
                  {edu.bullets.map((bullet, i) => (
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
