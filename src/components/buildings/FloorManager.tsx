'use client';

import { useState, useCallback } from 'react';
import type { BuildingConfig, FloorConfig, FloorType } from '@/lib/buildingSchema';
import { generateId, defaultRectOutline } from '@/lib/buildingSchema';
import FloorShapeEditor from './FloorShapeEditor';

interface Props {
  config: BuildingConfig;
  onChange: (updater: (prev: BuildingConfig) => BuildingConfig) => void;
}

export default function FloorManager({ config, onChange }: Props) {
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(
    config.floors[0]?.id || null,
  );

  const selectedFloor = config.floors.find((f) => f.id === selectedFloorId);

  const addFloor = useCallback(() => {
    const maxNum = config.floors.reduce((m, f) => Math.max(m, f.number), 0);
    const newFloor: FloorConfig = {
      id: generateId('f'),
      number: maxNum + 1,
      name: `Floor ${maxNum + 1}`,
      type: 'residential',
      height: 10,
      outline: defaultRectOutline(80, 80),
      sqft: 6400,
      sensors: [],
    };
    onChange((prev) => ({ ...prev, floors: [...prev.floors, newFloor] }));
    setSelectedFloorId(newFloor.id);
  }, [config.floors, onChange]);

  const removeFloor = useCallback((id: string) => {
    onChange((prev) => ({
      ...prev,
      floors: prev.floors.filter((f) => f.id !== id),
    }));
    if (selectedFloorId === id) {
      setSelectedFloorId(config.floors.find((f) => f.id !== id)?.id || null);
    }
  }, [config.floors, onChange, selectedFloorId]);

  const updateFloor = useCallback((id: string, updates: Partial<FloorConfig>) => {
    onChange((prev) => ({
      ...prev,
      floors: prev.floors.map((f) => f.id === id ? { ...f, ...updates } : f),
    }));
  }, [onChange]);

  const sortedFloors = [...config.floors].sort((a, b) => a.number - b.number);

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Mobile: horizontal pills */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-gray-800 overflow-x-auto scrollbar-none">
        {sortedFloors.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFloorId(f.id)}
            className={`flex-shrink-0 px-3 py-2 min-h-[44px] rounded-lg text-xs font-medium transition-colors ${
              f.id === selectedFloorId
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                : 'bg-[#0a0a12] text-gray-400 border border-gray-800 hover:bg-[#1a1a28]'
            }`}
          >
            F{f.number}
          </button>
        ))}
        <button
          onClick={addFloor}
          className="flex-shrink-0 px-3 py-2 min-h-[44px] rounded-lg text-xs text-blue-400 border border-dashed border-gray-700 hover:border-blue-500/50"
        >
          + Add
        </button>
      </div>

      {/* Desktop: floor list sidebar */}
      <div className="hidden md:flex w-64 border-r border-gray-800 flex-col">
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">FLOORS</span>
          <button
            onClick={addFloor}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            + Add
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sortedFloors.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFloorId(f.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-gray-800/50 transition-colors ${
                f.id === selectedFloorId
                  ? 'bg-blue-600/10 border-l-2 border-l-blue-500'
                  : 'hover:bg-[#1a1a28]'
              }`}
            >
              <div className="text-sm text-white font-medium">
                F{f.number} — {f.name}
              </div>
              <div className="text-[10px] text-gray-500">
                {f.type} · {f.height}ft · {f.sqft.toLocaleString()} sqft
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Floor detail / shape editor */}
      <div className="flex-1 overflow-y-auto">
        {selectedFloor ? (
          <div className="p-3 sm:p-4">
            {/* Floor properties */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Number</label>
                <input
                  type="number"
                  value={selectedFloor.number}
                  onChange={(e) => updateFloor(selectedFloor.id, { number: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-2 min-h-[44px] bg-[#0a0a12] border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Name</label>
                <input
                  value={selectedFloor.name}
                  onChange={(e) => updateFloor(selectedFloor.id, { name: e.target.value })}
                  className="w-full px-2 py-2 min-h-[44px] bg-[#0a0a12] border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Type</label>
                <select
                  value={selectedFloor.type}
                  onChange={(e) => updateFloor(selectedFloor.id, { type: e.target.value as FloorType })}
                  className="w-full px-2 py-2 min-h-[44px] bg-[#0a0a12] border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {['commercial', 'residential', 'parking', 'mechanical', 'retail', 'office', 'lobby'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Height (ft)</label>
                <input
                  type="number"
                  value={selectedFloor.height}
                  onChange={(e) => updateFloor(selectedFloor.id, { height: parseFloat(e.target.value) || 10 })}
                  className="w-full px-2 py-2 min-h-[44px] bg-[#0a0a12] border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Shape editor */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">FLOOR SHAPE (top-down polygon)</span>
              <button
                onClick={() => removeFloor(selectedFloor.id)}
                className="text-xs text-red-400 hover:text-red-300 min-h-[44px] flex items-center px-2"
              >
                Delete Floor
              </button>
            </div>

            <FloorShapeEditor
              outline={selectedFloor.outline}
              onChange={(outline) => {
                const area = polygonArea(outline);
                updateFloor(selectedFloor.id, { outline, sqft: Math.round(area) });
              }}
            />

            <div className="mt-2 text-xs text-gray-500">
              Area: {selectedFloor.sqft.toLocaleString()} sqft · {selectedFloor.outline.length} vertices
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            Select a floor or add one
          </div>
        )}
      </div>
    </div>
  );
}

// Shoelace formula for polygon area
function polygonArea(pts: [number, number][]): number {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i][0] * pts[j][1];
    area -= pts[j][0] * pts[i][1];
  }
  return Math.abs(area) / 2;
}
