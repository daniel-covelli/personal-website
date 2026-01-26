import { Inter } from 'next/font/google';
import '@/app/globals.css';
import '@/app/print.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Resume - Print Version',
  robots: 'noindex, nofollow',
};

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white`}>{children}</body>
    </html>
  );
}
