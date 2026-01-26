import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import { ScrollArea } from '@/components/ui/scroll-area';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'John Doe - Full Stack Developer',
  description: 'Personal resume website showcasing my skills and experience',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full overflow-hidden bg-stone-50`}>
        <SessionProvider>
          <ScrollArea className="h-full">
            {children}
          </ScrollArea>
        </SessionProvider>
      </body>
    </html>
  );
}
