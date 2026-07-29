'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="rounded-lg bg-chip px-4 py-2 text-sm text-body hover:bg-hair"
    >
      Sign Out
    </button>
  );
}
