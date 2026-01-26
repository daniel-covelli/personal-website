import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getContent } from '@/lib/content';
import Header from '@/components/sections/Header';
import Experience from '@/components/sections/Experience';
import Education from '@/components/sections/Education';
import Skills from '@/components/sections/Skills';
import Projects from '@/components/sections/Projects';
import Contact from '@/components/sections/Contact';
import Nav from '@/components/Nav';
import ChatButton from '@/components/chat/ChatButton';

export default async function Home() {
  const [content, session] = await Promise.all([
    getContent(),
    getServerSession(authOptions),
  ]);
  const isAdmin = !!session;

  return (
    <main>
      <Nav name={content.header.name} />
      <Header data={content.header} />
      <Experience data={content.experience} />
      <Education data={content.education} />
      <Skills data={content.skills} />
      <Projects data={content.projects} />
      <Contact data={content.contact} />
      <footer className="px-4 py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between text-sm text-stone-500">
          <p>
            &copy; {new Date().getFullYear()} {content.header.name}
          </p>
          {isAdmin ? (
            <a
              href="/admin"
              className="text-xs text-stone-400 transition-colors hover:text-stone-600"
            >
              Admin
            </a>
          ) : (
            <a
              href="/login"
              className="text-xs text-stone-400 transition-colors hover:text-stone-600"
            >
              Login
            </a>
          )}
        </div>
      </footer>
      <ChatButton personName={content.header.name} isAdmin={isAdmin} />
    </main>
  );
}
