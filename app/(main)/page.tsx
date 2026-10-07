import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getContent } from '@/lib/content';
import { getPublishedArticles } from '@/lib/articles';
import { getBannerNote, getNotesByCompany } from '@/lib/field-notes';

export const dynamic = 'force-dynamic';
import Header from '@/components/sections/Header';
import FeaturedBanner from '@/components/sections/FeaturedBanner';
import Experience from '@/components/sections/Experience';
import Education from '@/components/sections/Education';
import Skills from '@/components/sections/Skills';
import Projects from '@/components/sections/Projects';
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
  const bannerNote = getBannerNote(articles);
  const notesByCompany = getNotesByCompany(articles);

  return (
    <ThemeProvider>
      <main>
        <Nav name={content.header.name} />
        <FeaturedBanner note={bannerNote} />
        <Header data={content.header} />
        <Experience data={content.experience} notesByCompany={notesByCompany} />
        <Education data={content.education} />
        <Skills data={content.skills} />
        <Projects data={content.projects} />
        <Contact
          data={content.contact}
          name={content.header.name}
          isAdmin={isAdmin}
        />
        <ChatButton personName={content.header.name} isAdmin={isAdmin} />
      </main>
    </ThemeProvider>
  );
}
