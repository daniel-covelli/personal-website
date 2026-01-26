'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface NavProps {
  name: string;
}

export default function Nav({ name }: NavProps) {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-semibold text-gray-900 transition-colors hover:text-gray-600"
        >
          {name}
        </Link>
        <div className="flex items-center gap-3">
          {session ? (
            <Link
              href="/admin"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              Admin
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
