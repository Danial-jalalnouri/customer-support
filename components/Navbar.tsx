'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';

const publicNavItems = [
  { href: '/qa', label: 'Q&A' },
];

const protectedNavItems = [
  { href: '/ask', label: 'Ask a Question' },
  { href: '/unanswered', label: 'Unanswered' },
  { href: '/admin', label: 'Admin' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#1e1e2e] border-b border-[#444] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/qa" className="text-xl font-bold text-[#89b4fa]">
            Support
          </Link>
          <div className="flex items-center gap-2">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === item.href
                    ? 'bg-[#89b4fa] text-[#1e1e2e]'
                    : 'text-[#cdd6f4] hover:bg-[#313244]'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Show when="signed-in">
              {protectedNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === item.href
                      ? 'bg-[#89b4fa] text-[#1e1e2e]'
                      : 'text-[#cdd6f4] hover:bg-[#313244]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </Show>
            <Show when="signed-out">
              <SignInButton>
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-[#cdd6f4] hover:bg-[#313244]">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-[#89b4fa] text-[#1e1e2e] hover:bg-[#74c7ec]">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </div>
    </nav>
  );
}
