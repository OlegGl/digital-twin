'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BuildingSelector from './buildings/BuildingSelector';

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '/', label: '3D View' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/buildings', label: 'Buildings' },
  ];

  return (
    <nav className="h-14 bg-[#111118] border-b border-gray-800 flex items-center px-4 md:px-6 gap-2 sm:gap-4 relative">
      <Link href="/" className="text-lg font-bold text-white tracking-tight mr-1 sm:mr-2 flex-shrink-0">
        <span className="text-blue-400">◆</span> <span className="hidden sm:inline">Digital Twin</span><span className="sm:hidden">DT</span>
      </Link>

      <div className="hidden sm:block">
        <BuildingSelector />
      </div>

      {/* Desktop nav links */}
      <div className="hidden md:flex gap-1 ml-auto">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              pathname === l.href
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden ml-auto min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        aria-label="Menu"
      >
        {menuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-[#111118] border-b border-gray-800 z-50 md:hidden">
          <div className="p-4 border-b border-gray-800/50">
            <BuildingSelector />
          </div>
          <div className="p-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
