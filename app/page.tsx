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
  const content = await getContent();

  return (
    <main>
      <Nav name={content.header.name} />
      <Header data={content.header} />
      <Experience data={content.experience} />
      <Education data={content.education} />
      <Skills data={content.skills} />
      <Projects data={content.projects} />
      <Contact data={content.contact} />
      <footer className="text-center py-8 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} {content.header.name}. All rights reserved.</p>
      </footer>
      <ChatButton personName={content.header.name} />
    </main>
  );
}
