'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Sensor } from '@/types';
import Legend from '@/components/building/Legend';
import SensorPanel from '@/components/building/SensorPanel';
import Configurator from '@/components/building/Configurator';

const BuildingScene = dynamic(() => import('@/components/building/BuildingScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-gray-500 text-sm animate-pulse">Loading 3D Scene...</div>
    </div>
  ),
});

export default function Home() {
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <BuildingScene onSensorSelect={setSelectedSensor} />
      <Legend />
      {selectedSensor && (
        <SensorPanel sensor={selectedSensor} onClose={() => setSelectedSensor(null)} />
      )}
      <button
        onClick={() => setShowConfig(!showConfig)}
        className="absolute top-4 right-4 z-20 w-10 h-10 bg-[#111118] border border-gray-700 rounded-lg flex items-center justify-center hover:bg-[#1a1a28] transition-colors"
        title="Building Configuration"
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      {showConfig && <Configurator onClose={() => setShowConfig(false)} />}
    </div>
  );
}
