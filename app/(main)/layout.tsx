import SessionProvider from '@/components/SessionProvider';
import AnalyticsBeacon from '@/components/AnalyticsBeacon';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AnalyticsBeacon />
      <ScrollArea className="h-screen">
        <div className="min-h-screen bg-surface">{children}</div>
      </ScrollArea>
    </SessionProvider>
  );
}
