'use client';

import type { BuildingConfig, BuildingType } from '@/lib/buildingSchema';

interface Props {
  config: BuildingConfig;
  onChange: (updater: (prev: BuildingConfig) => BuildingConfig) => void;
}

export default function BuildingInfoForm({ config, onChange }: Props) {
  const update = (field: keyof BuildingConfig, value: string) => {
    onChange((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl overflow-y-auto h-full">
      <h2 className="text-lg font-semibold text-white mb-6">Basic Information</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Building Name</label>
          <input
            value={config.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full px-3 py-2.5 min-h-[44px] bg-[#0a0a12] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Address</label>
          <input
            value={config.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="1200 Pacific Avenue, Seattle, WA"
            className="w-full px-3 py-2.5 min-h-[44px] bg-[#0a0a12] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Building Type</label>
          <select
            value={config.type}
            onChange={(e) => update('type', e.target.value as BuildingType)}
            className="w-full px-3 py-2.5 min-h-[44px] bg-[#0a0a12] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="commercial">Commercial</option>
            <option value="mixed-use">Mixed-Use</option>
            <option value="residential">Residential</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">ID (slug)</label>
            <input
              value={config.id}
              disabled
              className="w-full px-3 py-2.5 min-h-[44px] bg-[#0a0a12] border border-gray-800 rounded-lg text-gray-500 text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Created</label>
            <input
              value={new Date(config.createdAt).toLocaleDateString()}
              disabled
              className="w-full px-3 py-2.5 min-h-[44px] bg-[#0a0a12] border border-gray-800 rounded-lg text-gray-500 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        {/* Default camera view */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3 mt-6">Default Camera View</h3>
          <div className="grid grid-cols-3 gap-3">
            {(['x', 'y', 'z'] as const).map((axis, i) => (
              <div key={axis}>
                <label className="block text-[10px] text-gray-500 mb-1">Position {axis.toUpperCase()}</label>
                <input
                  type="number"
                  value={config.defaultView.cameraPosition[i]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onChange((prev) => {
                      const pos = [...prev.defaultView.cameraPosition] as [number, number, number];
                      pos[i] = val;
                      return { ...prev, defaultView: { ...prev.defaultView, cameraPosition: pos } };
                    });
                  }}
                  className="w-full px-2 py-2 min-h-[44px] bg-[#0a0a12] border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
