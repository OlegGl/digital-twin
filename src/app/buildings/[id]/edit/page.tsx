'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { BuildingConfig } from '@/lib/buildingSchema';
import { exportBuildingJSON } from '@/lib/buildingIO';
import BuildingInfoForm from '@/components/buildings/BuildingInfoForm';
import FloorManager from '@/components/buildings/FloorManager';
import SystemEditor from '@/components/buildings/SystemEditor';
import BuildingPreview from '@/components/buildings/BuildingPreview';

const TABS = ['Info', 'Floors', 'Systems', 'Preview'] as const;

export default function BuildingEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [config, setConfig] = useState<BuildingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch(`/api/buildings/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => setConfig(data))
      .catch(() => router.push('/buildings'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const updateConfig = useCallback((updater: (prev: BuildingConfig) => BuildingConfig) => {
    setConfig((prev) => {
      if (!prev) return prev;
      setDirty(true);
      return updater(prev);
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/buildings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setDirty(false);
        const updated = await res.json();
        setConfig(updated);
      } else {
        const err = await res.json();
        alert(err.error || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  }, [config, id]);

  const handleExport = useCallback(() => {
    if (config) exportBuildingJSON(config);
  }, [config]);

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 animate-pulse">Loading building...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-[#0d0d18] border-b border-gray-800 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => router.push('/buildings')}
            className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ←
          </button>
          <h1 className="text-white font-semibold truncate">{config.name}</h1>
          {dirty && <span className="text-xs text-amber-400 flex-shrink-0">• Unsaved</span>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleExport}
            className="px-3 py-2 min-h-[44px] bg-[#111118] border border-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-[#1a1a28] transition-colors hidden sm:flex items-center"
            title="Export JSON"
          >
            ↓ Export
          </button>
          <button
            onClick={handleExport}
            className="min-w-[44px] min-h-[44px] bg-[#111118] border border-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-[#1a1a28] transition-colors flex sm:hidden items-center justify-center"
            title="Export JSON"
          >
            ↓
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="px-4 py-2 min-h-[44px] bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tabs - horizontal scrollable on mobile */}
      <div className="flex gap-1 px-4 md:px-6 pt-3 bg-[#0a0a12] overflow-x-auto scrollbar-none">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex-shrink-0 ${
              i === activeTab
                ? 'bg-[#111118] text-white border-t border-x border-gray-700'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 bg-[#111118] overflow-hidden">
        {activeTab === 0 && (
          <BuildingInfoForm config={config} onChange={updateConfig} />
        )}
        {activeTab === 1 && (
          <FloorManager config={config} onChange={updateConfig} />
        )}
        {activeTab === 2 && (
          <SystemEditor config={config} onChange={updateConfig} />
        )}
        {activeTab === 3 && (
          <BuildingPreview config={config} />
        )}
      </div>
    </div>
  );
}
