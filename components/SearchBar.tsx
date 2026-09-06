'use client';

import { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (value: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search questions..."
        className="w-full px-4 py-3 pl-10 bg-[#1e1e2e] border border-[#444] rounded-lg text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] transition-colors"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6c7086]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
}
