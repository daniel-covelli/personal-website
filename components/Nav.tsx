'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface NavProps {
  name: string;
}

export default function Nav({ name }: NavProps) {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          {name}
        </Link>
        <div className="flex items-center gap-3">
          {session ? (
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Admin
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
