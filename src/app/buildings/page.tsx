'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBuildingIndex } from '@/lib/buildingStore';
import { createEmptyBuilding, type BuildingType } from '@/lib/buildingSchema';
import BuildingCard from '@/components/buildings/BuildingCard';

export default function BuildingsPage() {
  const { index, loading, refresh } = useBuildingIndex();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<BuildingType>('commercial');

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    const config = createEmptyBuilding(newName.trim(), newType);

    const res = await fetch('/api/buildings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (res.ok) {
      setCreating(false);
      setNewName('');
      await refresh();
      router.push(`/buildings/${config.id}/edit`);
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to create building');
    }
  }, [newName, newType, refresh, router]);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/buildings/${id}`, { method: 'DELETE' });
    refresh();
  }, [refresh]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Buildings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your building portfolio</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
        >
          + New Building
        </button>
      </div>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#111118] border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">New Building</h2>

            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Cascade Commons"
              className="w-full px-3 py-2 bg-[#0a0a12] border border-gray-700 rounded-lg text-white text-sm mb-4 focus:outline-none focus:border-blue-500"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />

            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as BuildingType)}
              className="w-full px-3 py-2 bg-[#0a0a12] border border-gray-700 rounded-lg text-white text-sm mb-6 focus:outline-none focus:border-blue-500"
            >
              <option value="commercial">Commercial</option>
              <option value="mixed-use">Mixed-Use</option>
              <option value="residential">Residential</option>
              <option value="industrial">Industrial</option>
            </select>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setCreating(false); setNewName(''); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111118] border border-gray-800 rounded-xl p-5 h-56 animate-pulse" />
          ))}
        </div>
      ) : index.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-600 text-4xl mb-4">🏢</div>
          <p className="text-gray-400 mb-2">No buildings yet</p>
          <p className="text-gray-600 text-sm">Create your first building to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {index.map((b) => (
            <BuildingCard key={b.id} building={b} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
