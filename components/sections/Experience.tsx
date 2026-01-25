import { Experience as ExperienceType } from '@/lib/types';

interface ExperienceProps {
  data: ExperienceType[];
}

export default function Experience({ data }: ExperienceProps) {
  if (data.length === 0) return null;

  return (
    <section className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-2">
          Experience
        </h2>
        <div className="space-y-8">
          {data.map((exp) => (
            <div key={exp.id} className="relative pl-6 border-l-2 border-blue-200">
              <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-[7px] top-1" />
              <h3 className="text-lg font-semibold text-gray-900">
                {exp.jobTitle}
              </h3>
              <p className="text-blue-600 font-medium">{exp.company}</p>
              <p className="text-sm text-gray-500 mb-2">
                {exp.startDate} — {exp.endDate}
              </p>
              <p className="text-gray-600">{exp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
