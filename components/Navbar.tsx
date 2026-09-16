'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/qa', label: 'Q&A' },
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
          <div className="flex gap-1">
            {navItems.map((item) => (
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
          </div>
        </div>
      </div>
    </nav>
  );
}
