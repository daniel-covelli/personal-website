import '@/app/print.css';

export const metadata = {
  title: 'Resume - Print Version',
  robots: 'noindex, nofollow',
};

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-white">{children}</div>;
}
