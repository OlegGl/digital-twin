'use client';

import { SensorType, SENSOR_COLORS, SENSOR_LABELS } from '@/types';

const types = Object.values(SensorType);

export default function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-20 bg-[#111118]/90 backdrop-blur-sm border border-gray-800 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-medium">
        Systems
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {types.map((t) => (
          <div key={t} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: SENSOR_COLORS[t] }}
            />
            <span className="text-xs text-gray-300">{SENSOR_LABELS[t]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
