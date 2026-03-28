'use client';

import { defaultBuilding } from '@/data/building';

interface Props {
  onClose: () => void;
}

export default function Configurator({ onClose }: Props) {
  const building = defaultBuilding;

  const content = (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          Building Config
        </h2>
        <button
          onClick={onClose}
          className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 mb-6">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500">Name</label>
          <div className="text-sm text-white mt-0.5">{building.name}</div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500">Address</label>
          <div className="text-sm text-white mt-0.5">{building.address}</div>
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Floors</div>
      <div className="space-y-2">
        {building.floors.map((floor) => (
          <div
            key={floor.id}
            className="bg-[#0a0a14] rounded-lg p-3 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">
                F{floor.number} — {floor.name}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  floor.type === 'commercial'
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {floor.type}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex gap-3 flex-wrap">
              <span>{floor.sqft.toLocaleString()} sqft</span>
              <span>{floor.height}ft height</span>
              <span>{floor.sensors.length} sensors</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          Total sensors:{' '}
          <span className="text-white">
            {building.floors.reduce((sum, f) => sum + f.sensors.length, 0)}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Total sqft:{' '}
          <span className="text-white">
            {building.floors.reduce((sum, f) => sum + f.sqft, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: side panel */}
      <div className="hidden sm:block absolute top-0 left-0 h-full w-80 bg-[#111118]/95 backdrop-blur-md border-r border-gray-800 z-30 overflow-y-auto">
        {content}
      </div>

      {/* Mobile: bottom sheet */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-30 bg-[#111118]/95 backdrop-blur-md border-t border-gray-800 rounded-t-xl max-h-[70vh] overflow-y-auto">
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>
        {content}
      </div>
    </>
  );
}
