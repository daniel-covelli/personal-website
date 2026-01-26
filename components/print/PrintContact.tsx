import { Contact } from '@/lib/types';

interface PrintContactProps {
  data: Contact;
}

export default function PrintContact({ data }: PrintContactProps) {
  const items = [
    { label: 'Email', value: data.email },
    { label: 'LinkedIn', value: data.linkedin },
    { label: 'GitHub', value: data.github },
    { label: 'Twitter', value: data.twitter },
    { label: 'Website', value: data.website },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  // Extract display value from URLs
  const getDisplayValue = (label: string, value: string) => {
    if (label === 'Email') return value;
    try {
      const url = new URL(value);
      return url.hostname + url.pathname.replace(/\/$/, '');
    } catch {
      return value;
    }
  };

  return (
    <section className="print-section">
      <h2 className="print-section-title">Contact</h2>
      <div className="print-contact">
        {items.map((item) => (
          <span key={item.label} className="print-contact-item">
            <span className="print-contact-label">{item.label}:</span>{' '}
            {getDisplayValue(item.label, item.value)}
          </span>
        ))}
      </div>
    </section>
  );
}
