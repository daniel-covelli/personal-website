import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getContent } from '@/lib/content';
import ContentEditor from '@/components/admin/ContentEditor';
import LogoutButton from './LogoutButton';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login?callbackUrl=/admin');
  }

  const content = await getContent();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your resume content</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              className="text-sm text-blue-600 hover:underline"
            >
              View Resume
            </a>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <ContentEditor initialContent={content} />
      </main>
    </div>
  );
}
