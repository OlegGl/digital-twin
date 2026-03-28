'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelectedBuildingId, useBuildingIndex } from '@/lib/buildingStore';

export default function BuildingSelector() {
  const [selectedId, setSelectedId] = useSelectedBuildingId();
  const { index, loading } = useBuildingIndex();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auto-select first building if none selected
  useEffect(() => {
    if (!selectedId && index.length > 0) {
      setSelectedId(index[0].id);
    }
  }, [selectedId, index, setSelectedId]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = index.find((b) => b.id === selectedId);

  if (loading) {
    return (
      <div className="h-8 w-40 bg-gray-800/50 rounded animate-pulse" />
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 bg-[#0d0d18] hover:bg-[#151525] transition-colors text-sm"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
        <span className="text-gray-300 max-w-[140px] truncate">
          {current?.name || 'Select Building'}
        </span>
        <svg className={`w-3 h-3 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-[#111118] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {index.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setSelectedId(b.id);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 hover:bg-[#1a1a28] transition-colors border-b border-gray-800/50 last:border-0 ${
                b.id === selectedId ? 'bg-blue-600/10' : ''
              }`}
            >
              <div className="text-sm text-white font-medium">{b.name}</div>
              <div className="text-xs text-gray-500 truncate">{b.address || 'No address'}</div>
            </button>
          ))}

          <button
            onClick={() => {
              setOpen(false);
              router.push('/buildings');
            }}
            className="w-full text-left px-4 py-2.5 text-blue-400 hover:bg-blue-600/10 transition-colors text-sm font-medium border-t border-gray-700"
          >
            + Manage Buildings
          </button>
        </div>
      )}
    </div>
  );
}
