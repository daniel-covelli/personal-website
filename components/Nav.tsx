import Link from 'next/link';

interface NavProps {
  name: string;
}

export default function Nav({ name }: NavProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-stone-50/80 backdrop-blur-md px-4">
      <div className="mx-auto flex max-w-3xl items-center justify-between py-2">
        <Link
          href="/"
          className="text-sm font-medium text-stone-900 transition-colors hover:text-stone-600"
        >
          {name}
        </Link>
        <a
          href="/resume.pdf"
          download
          className="flex items-center gap-1 text-xs font-medium text-sky-600 transition-colors hover:text-sky-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-3.5 w-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Resume
        </a>
      </div>
    </nav>
  );
}
