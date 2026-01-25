import { Education as EducationType } from '@/lib/types';

interface EducationProps {
  data: EducationType[];
}

export default function Education({ data }: EducationProps) {
  if (data.length === 0) return null;

  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-2">
          Education
        </h2>
        <div className="space-y-6">
          {data.map((edu) => (
            <div key={edu.id}>
              <h3 className="text-lg font-semibold text-gray-900">
                {edu.degree}
              </h3>
              <p className="text-blue-600 font-medium">{edu.institution}</p>
              <p className="text-sm text-gray-500 mb-2">
                {edu.startDate} — {edu.endDate}
              </p>
              <p className="text-gray-600">{edu.details}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
