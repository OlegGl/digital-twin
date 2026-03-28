'use client';

import { useState, useEffect } from 'react';
import { SensorType, SENSOR_COLORS, SENSOR_LABELS } from '@/types';

const allTypes = Object.values(SensorType);
const mepTypes: SensorType[] = [SensorType.ELECTRICAL, SensorType.HVAC, SensorType.WATER, SensorType.GAS];

interface Props {
  wireframeMode?: boolean;
  visibleSystems?: Set<SensorType>;
  onToggleSystem?: (type: SensorType) => void;
}

export default function Legend({ wireframeMode, visibleSystems, onToggleSystem }: Props) {
  const types = wireframeMode ? mepTypes : allTypes;
  const [collapsed, setCollapsed] = useState(false);

  // Start collapsed on mobile
  useEffect(() => {
    setCollapsed(window.innerWidth < 640);
  }, []);

  return (
    <div className="absolute bottom-4 left-4 z-20 bg-[#111118]/90 backdrop-blur-sm border border-gray-800 rounded-lg">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-0 sm:pointer-events-none"
      >
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
          {wireframeMode ? 'MEP Systems' : 'Systems'}
        </div>
        <svg
          className={`w-3 h-3 text-gray-500 sm:hidden transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`${collapsed ? 'hidden' : 'block'} sm:block px-3 pb-3`}>
        {wireframeMode && (
          <div className="text-[9px] text-gray-600 mb-2">Click to toggle visibility</div>
        )}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {types.map((t) => {
            const active = !wireframeMode || visibleSystems?.has(t);
            return (
              <button
                key={t}
                className={`flex items-center gap-2 min-h-[36px] sm:min-h-0 transition-opacity ${
                  wireframeMode ? 'cursor-pointer hover:opacity-100' : 'cursor-default'
                } ${active ? 'opacity-100' : 'opacity-30'}`}
                onClick={() => wireframeMode && onToggleSystem?.(t)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0 transition-all"
                  style={{
                    backgroundColor: active ? SENSOR_COLORS[t] : '#333',
                    boxShadow: active && wireframeMode ? `0 0 6px ${SENSOR_COLORS[t]}80` : 'none',
                  }}
                />
                <span className={`text-xs ${active ? 'text-gray-300' : 'text-gray-600'}`}>
                  {SENSOR_LABELS[t]}
                </span>
              </button>
            );
          })}
        </div>
        {wireframeMode && (
          <button
            className="mt-2 text-[10px] text-gray-500 hover:text-gray-300 transition-colors min-h-[36px] sm:min-h-0"
            onClick={() => {
              if (!onToggleSystem) return;
              const allVisible = mepTypes.every((t) => visibleSystems?.has(t));
              mepTypes.forEach((t) => {
                const isVisible = visibleSystems?.has(t);
                if (allVisible ? isVisible : !isVisible) onToggleSystem(t);
              });
            }}
          >
            {mepTypes.every((t) => visibleSystems?.has(t)) ? 'Hide All' : 'Show All'}
          </button>
        )}
      </div>
    </div>
  );
}
