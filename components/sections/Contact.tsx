import { Contact as ContactType } from '@/lib/types';
import SectionHeading from './SectionHeading';

interface ContactProps {
  data: ContactType;
}

export default function Contact({ data }: ContactProps) {
  const links = [
    { label: 'Email', value: data.email, href: `mailto:${data.email}` },
    { label: 'LinkedIn', value: data.linkedin, href: data.linkedin },
    { label: 'GitHub', value: data.github, href: data.github },
    { label: 'Twitter', value: data.twitter, href: data.twitter },
    { label: 'Website', value: data.website, href: data.website },
  ].filter((link) => link.value);

  if (links.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <SectionHeading>Contact</SectionHeading>
        <div className="flex flex-wrap justify-center gap-6">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.label !== 'Email' ? '_blank' : undefined}
              rel={link.label !== 'Email' ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-2 rounded-lg bg-chip px-4 py-2 transition-colors hover:bg-pill"
            >
              <span className="font-medium text-body">{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
