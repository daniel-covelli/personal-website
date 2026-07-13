import { Skills as SkillsType } from '@/lib/types';
import SectionHeading from './SectionHeading';

interface SkillsProps {
  data: SkillsType;
}

export default function Skills({ data }: SkillsProps) {
  if (data.categories.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <SectionHeading>Skills</SectionHeading>
        <div className="grid gap-6 md:grid-cols-2">
          {data.categories.map((category) => (
            <div key={category.id}>
              <h3 className="mb-3 font-semibold text-ink">{category.name}</h3>
              <div className="flex flex-wrap gap-2">
                {category.items.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-pill px-3 py-1 text-sm text-pill-fg"
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
