import { Skills as SkillsType } from '@/lib/types';

interface SkillsProps {
  data: SkillsType;
}

export default function Skills({ data }: SkillsProps) {
  if (data.categories.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 border-b pb-2 text-2xl font-bold text-gray-900">
          Skills
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {data.categories.map((category) => (
            <div key={category.id}>
              <h3 className="mb-3 font-semibold text-gray-900">
                {category.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.items.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-sky-50 px-3 py-1 text-sm text-sky-700"
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
