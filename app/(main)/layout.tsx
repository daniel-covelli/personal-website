import SessionProvider from '@/components/SessionProvider';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ScrollArea className="h-screen">
        <div className="min-h-screen bg-stone-50">{children}</div>
      </ScrollArea>
    </SessionProvider>
  );
}
