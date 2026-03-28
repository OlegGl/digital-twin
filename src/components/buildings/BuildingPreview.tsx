'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { BuildingConfig } from '@/lib/buildingSchema';
import { SensorType } from '@/types';

const BuildingPreviewScene = dynamic(() => import('./BuildingPreviewScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-gray-500 text-sm animate-pulse">Loading 3D Preview...</div>
    </div>
  ),
});

interface Props {
  config: BuildingConfig;
}

const MEP_TYPES = new Set(Object.values(SensorType));

export default function BuildingPreview({ config }: Props) {
  const [wireframe, setWireframe] = useState(false);

  return (
    <div className="w-full h-full relative">
      <BuildingPreviewScene config={config} wireframe={wireframe} visibleSystems={MEP_TYPES} />

      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={() => setWireframe(!wireframe)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            wireframe
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
              : 'bg-[#111118] text-gray-400 border border-gray-700 hover:bg-[#1a1a28]'
          }`}
        >
          {wireframe ? 'Wireframe' : 'Solid'}
        </button>
      </div>

      <div className="absolute bottom-3 left-3 z-10 text-[10px] text-gray-500">
        {config.floors.length} floors · {config.systems.reduce((n, s) => n + s.nodes.length, 0)} nodes · {config.systems.reduce((n, s) => n + s.pipes.length, 0)} pipes
      </div>
    </div>
  );
}
