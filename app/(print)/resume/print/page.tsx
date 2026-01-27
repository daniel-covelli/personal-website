import { getContent } from '@/lib/content';
import PrintHeader from '@/components/print/PrintHeader';

export const dynamic = 'force-dynamic';
import PrintExperience from '@/components/print/PrintExperience';
import PrintEducation from '@/components/print/PrintEducation';
import PrintSkills from '@/components/print/PrintSkills';
import PrintProjects from '@/components/print/PrintProjects';
import PrintContact from '@/components/print/PrintContact';

export default async function PrintPage() {
  const content = await getContent();

  return (
    <div className="print-container">
      <PrintHeader data={content.header} />
      <PrintContact data={content.contact} />
      <PrintExperience data={content.experience} />
      <PrintEducation data={content.education} />
      <PrintSkills data={content.skills} />
      <PrintProjects data={content.projects} />
    </div>
  );
}
