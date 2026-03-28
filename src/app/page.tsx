'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Sensor, SensorType, SystemNode, MEPSystem } from '@/types';
import { useSelectedBuildingId } from '@/lib/buildingStore';
import type { BuildingConfig } from '@/lib/buildingSchema';
import Legend from '@/components/building/Legend';
import SensorPanel from '@/components/building/SensorPanel';
import SystemNodePanel from '@/components/building/SystemNodePanel';
import Configurator from '@/components/building/Configurator';

const BuildingScene = dynamic(() => import('@/components/building/BuildingScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-gray-500 text-sm animate-pulse">Loading 3D Scene...</div>
    </div>
  ),
});

const MEP_TYPES = new Set([SensorType.ELECTRICAL, SensorType.HVAC, SensorType.WATER, SensorType.GAS]);

export default function Home() {
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [selectedNode, setSelectedNode] = useState<SystemNode | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [visibleSystems, setVisibleSystems] = useState<Set<SensorType>>(new Set(MEP_TYPES));
  const [selectedId] = useSelectedBuildingId();
  const [buildingConfig, setBuildingConfig] = useState<BuildingConfig | null>(null);

  // Load building config when selection changes
  useEffect(() => {
    const id = selectedId || 'cascade-commons';
    fetch(`/api/buildings/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setBuildingConfig(data))
      .catch(() => setBuildingConfig(null));
  }, [selectedId]);

  const toggleWireframe = useCallback(() => {
    setWireframeMode((prev) => {
      if (!prev) setSelectedSensor(null);
      else setSelectedNode(null);
      return !prev;
    });
  }, []);

  const toggleSystem = useCallback((type: SensorType) => {
    setVisibleSystems((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleNodeSelect = useCallback((node: SystemNode) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <BuildingScene
        onSensorSelect={setSelectedSensor}
        wireframeMode={wireframeMode}
        visibleSystems={visibleSystems}
        onNodeSelect={handleNodeSelect}
        buildingConfig={buildingConfig}
      />

      <Legend
        wireframeMode={wireframeMode}
        visibleSystems={visibleSystems}
        onToggleSystem={toggleSystem}
      />

      {selectedSensor && !wireframeMode && (
        <SensorPanel sensor={selectedSensor} onClose={() => setSelectedSensor(null)} />
      )}

      {selectedNode && wireframeMode && (
        <SystemNodePanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}

      <button
        onClick={toggleWireframe}
        className={`absolute top-4 right-16 z-20 min-w-[44px] min-h-[44px] px-3 flex items-center gap-2 rounded-lg border transition-all ${
          wireframeMode
            ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
            : 'bg-[#111118] border-gray-700 text-gray-400 hover:bg-[#1a1a28]'
        }`}
        title={wireframeMode ? 'Exit X-Ray view' : 'X-Ray: View MEP Systems'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-xs font-medium hidden sm:inline">X-Ray</span>
      </button>

      <button
        onClick={() => setShowConfig(!showConfig)}
        className="absolute top-4 right-4 z-20 w-11 h-11 min-w-[44px] min-h-[44px] bg-[#111118] border border-gray-700 rounded-lg flex items-center justify-center hover:bg-[#1a1a28] transition-colors"
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
