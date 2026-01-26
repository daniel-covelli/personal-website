import { Skills } from '@/lib/types';

interface PrintSkillsProps {
  data: Skills;
}

export default function PrintSkills({ data }: PrintSkillsProps) {
  if (data.categories.length === 0) return null;

  return (
    <section className="print-section">
      <h2 className="print-section-title">Skills</h2>
      <div className="print-skills-grid">
        {data.categories.map((category) => (
          <div key={category.id} className="print-skill-category">
            <div className="print-skill-category-name">{category.name}</div>
            <div className="print-skill-items">{category.items.join(', ')}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
