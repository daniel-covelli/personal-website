import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getContent } from '@/lib/content';
import { getPublishedArticles } from '@/lib/articles';

export const dynamic = 'force-dynamic';
import Header from '@/components/sections/Header';
import Experience from '@/components/sections/Experience';
import Education from '@/components/sections/Education';
import Skills from '@/components/sections/Skills';
import Projects from '@/components/sections/Projects';
import Writing from '@/components/sections/Writing';
import Contact from '@/components/sections/Contact';
import Nav from '@/components/Nav';
import ChatButton from '@/components/chat/ChatButton';
import { ThemeProvider } from '@/components/ThemeProvider';

export default async function Home() {
  const [content, session, articles] = await Promise.all([
    getContent(),
    getServerSession(authOptions),
    getPublishedArticles(),
  ]);
  const isAdmin = !!session;

  return (
    <ThemeProvider>
      <main>
        <Nav name={content.header.name} />
        <Header data={content.header} />
        <Experience data={content.experience} />
        <Education data={content.education} />
        <Skills data={content.skills} />
        <Projects data={content.projects} />
        <Writing data={articles} />
        <Contact data={content.contact} />
        <footer className="px-4 py-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between text-sm text-subtle">
            <p>
              &copy; {new Date().getFullYear()} {content.header.name}
            </p>
            {isAdmin ? (
              <a
                href="/admin"
                className="text-xs text-subtle transition-colors hover:text-ink"
              >
                Admin
              </a>
            ) : (
              <a
                href="/login"
                className="text-xs text-subtle transition-colors hover:text-ink"
              >
                Login
              </a>
            )}
          </div>
        </footer>
        <ChatButton personName={content.header.name} isAdmin={isAdmin} />
      </main>
    </ThemeProvider>
  );
}
