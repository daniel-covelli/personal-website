import { Header } from '@/lib/types';

interface PrintHeaderProps {
  data: Header;
}

export default function PrintHeader({ data }: PrintHeaderProps) {
  return (
    <header className="print-header">
      <h1 className="print-name">{data.name}</h1>
      <p className="print-title">{data.title}</p>
      {data.bio && <p className="print-bio">{data.bio}</p>}
    </header>
  );
}
