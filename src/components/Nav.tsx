'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BuildingSelector from './buildings/BuildingSelector';

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: '3D View' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/buildings', label: 'Buildings' },
  ];

  return (
    <nav className="h-14 bg-[#111118] border-b border-gray-800 flex items-center px-4 md:px-6 gap-4">
      <Link href="/" className="text-lg font-bold text-white tracking-tight mr-2">
        <span className="text-blue-400">◆</span> Digital Twin
      </Link>

      <BuildingSelector />

      <div className="flex gap-1 ml-auto">
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
    </nav>
  );
}
