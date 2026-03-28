'use client';

import Link from 'next/link';
import type { BuildingIndexEntry } from '@/lib/buildingSchema';

const TYPE_BADGE_COLORS: Record<string, string> = {
  commercial: 'bg-amber-600/20 text-amber-400',
  'mixed-use': 'bg-purple-600/20 text-purple-400',
  residential: 'bg-green-600/20 text-green-400',
  industrial: 'bg-red-600/20 text-red-400',
};

interface Props {
  building: BuildingIndexEntry;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}

export default function BuildingCard({ building, onDelete, onExport }: Props) {
  const badgeClass = TYPE_BADGE_COLORS[building.type] || 'bg-gray-600/20 text-gray-400';

  return (
    <div className="bg-[#111118] border border-gray-800 rounded-xl p-4 sm:p-5 hover:border-gray-700 transition-colors group">
      {/* Icon placeholder */}
      <div className="w-full h-24 sm:h-28 bg-[#0a0a12] rounded-lg mb-3 sm:mb-4 flex items-center justify-center">
        <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      </div>

      <div className="flex items-start justify-between mb-2">
        <h3 className="text-white font-semibold text-sm">{building.name}</h3>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
          {building.type}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-3 sm:mb-4 truncate">{building.address || 'No address'}</p>

      <div className="flex gap-2">
        <Link
          href={`/buildings/${building.id}/edit`}
          className="flex-1 text-center text-xs font-medium px-3 py-2.5 min-h-[44px] flex items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 transition-colors"
        >
          Edit
        </Link>
        <button
          onClick={() => onExport(building.id)}
          className="text-xs font-medium px-3 py-2.5 min-h-[44px] flex items-center justify-center rounded-lg bg-green-600/10 text-green-400 hover:bg-green-600/20 transition-colors"
          title="Export JSON"
        >
          Export
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete "${building.name}"?`)) onDelete(building.id);
          }}
          className="text-xs font-medium px-3 py-2.5 min-h-[44px] flex items-center justify-center rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
