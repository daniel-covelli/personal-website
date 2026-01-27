import { Contact } from '@/lib/types';

interface PrintContactProps {
  data: Contact;
}

export default function PrintContact({ data }: PrintContactProps) {
  const topRow = [
    { value: data.location, href: null, display: data.location },
    { value: data.phone, href: data.phone ? `tel:${data.phone}` : null, display: data.phone },
    { value: data.email, href: data.email ? `mailto:${data.email}` : null, display: data.email },
  ].filter((item) => item.value);

  const bottomRow = [
    { value: data.website, href: data.website, display: data.website },
    { value: data.github, href: data.github, display: data.github },
    { value: data.linkedin, href: data.linkedin, display: data.linkedin },
  ].filter((item) => item.value);

  if (topRow.length === 0 && bottomRow.length === 0) return null;

  const renderRow = (items: typeof topRow) => (
    <>
      {items.map((item, index) => (
        <span key={item.display}>
          {item.href ? (
            <a href={item.href} className="print-contact-link">
              {item.display}
            </a>
          ) : (
            item.display
          )}
          {index < items.length - 1 && <span className="print-contact-separator">|</span>}
        </span>
      ))}
    </>
  );

  return (
    <div className="print-contact-block">
      {topRow.length > 0 && <div className="print-contact-row">{renderRow(topRow)}</div>}
      {bottomRow.length > 0 && <div className="print-contact-row">{renderRow(bottomRow)}</div>}
    </div>
  );
}
