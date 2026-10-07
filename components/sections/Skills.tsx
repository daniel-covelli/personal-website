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
        <div className="grid max-w-[64ch] gap-3.5">
          {data.categories.map((category) => (
            <p
              key={category.id}
              className="text-[15px] leading-[1.75] text-body"
            >
              <span className="mr-1.5 font-semibold text-ink">
                {category.name}
              </span>
              {category.items.join(', ')}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
