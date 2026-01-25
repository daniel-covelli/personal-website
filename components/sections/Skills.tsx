import { Skills as SkillsType } from '@/lib/types';

interface SkillsProps {
  data: SkillsType;
}

export default function Skills({ data }: SkillsProps) {
  if (data.categories.length === 0) return null;

  return (
    <section className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-2">
          Skills
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {data.categories.map((category) => (
            <div key={category.id}>
              <h3 className="font-semibold text-gray-900 mb-3">
                {category.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.items.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
