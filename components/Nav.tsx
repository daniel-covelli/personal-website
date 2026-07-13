import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import NavResumeButton from './NavResumeButton';

interface NavProps {
  name: string;
}

export default function Nav({ name }: NavProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-hair bg-surface/80 px-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between py-2">
        <Link
          href="/"
          className="text-sm font-medium text-ink transition-colors hover:text-subtle"
        >
          {name}
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NavResumeButton />
        </div>
      </div>
    </nav>
  );
}
