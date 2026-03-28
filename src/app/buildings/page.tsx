'use client';

import { useState, useCallback, useRef, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useBuildingIndex } from '@/lib/buildingStore';
import { createEmptyBuilding, slugify, generateId, type BuildingType } from '@/lib/buildingSchema';
import { exportBuildingJSON, parseBuildingJSON, readFileAsText } from '@/lib/buildingIO';
import BuildingCard from '@/components/buildings/BuildingCard';

export default function BuildingsPage() {
  const { index, loading, refresh } = useBuildingIndex();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<BuildingType>('commercial');
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExport = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/buildings/${id}`);
      if (!res.ok) throw new Error('Failed to fetch building');
      const config = await res.json();
      exportBuildingJSON(config);
    } catch {
      alert('Failed to export building');
    }
  }, []);

  const handleImportFile = useCallback(async (file: File) => {
    setImportError(null);
    setImporting(true);
    try {
      const text = await readFileAsText(file);
      const result = parseBuildingJSON(text);
      if (!result.success) {
        setImportError(result.error);
        return;
      }

      // Assign a fresh ID to avoid collisions
      const existingIds = new Set(index.map((b) => b.id));
      let newId = slugify(result.data.name);
      if (!newId) newId = generateId('building');
      while (existingIds.has(newId)) {
        newId = `${slugify(result.data.name)}-${generateId()}`;
      }

      const now = new Date().toISOString();
      const imported = {
        ...result.data,
        id: newId,
        createdAt: now,
        updatedAt: now,
      };

      const res = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imported),
      });

      if (res.ok) {
        await refresh();
        setImportError(null);
      } else {
        const err = await res.json();
        setImportError(err.error || 'Failed to save imported building');
      }
    } catch {
      setImportError('Failed to read file');
    } finally {
      setImporting(false);
    }
  }, [index, refresh]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImportFile(file);
    e.target.value = '';
  }, [handleImportFile]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      handleImportFile(file);
    } else {
      setImportError('Please drop a .json file');
    }
  }, [handleImportFile]);

  return (
    <div
      className={`p-4 md:p-6 max-w-6xl mx-auto overflow-y-auto h-full relative ${dragOver ? 'ring-2 ring-blue-500/50 ring-inset' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-40 bg-blue-600/10 flex items-center justify-center pointer-events-none">
          <div className="bg-[#111118] border-2 border-dashed border-blue-500 rounded-xl p-8 text-center">
            <div className="text-blue-400 text-lg font-medium">Drop JSON file to import</div>
            <div className="text-gray-500 text-sm mt-1">Building configuration file</div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Buildings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your building portfolio</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex-1 sm:flex-none px-4 py-2.5 min-h-[44px] bg-[#111118] border border-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-[#1a1a28] transition-colors disabled:opacity-50"
          >
            {importing ? 'Importing...' : '↑ Import'}
          </button>
          <button
            onClick={() => setCreating(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 min-h-[44px] bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
          >
            + New Building
          </button>
        </div>
      </div>

      {/* Import error */}
      {importError && (
        <div className="mb-4 p-3 bg-red-600/10 border border-red-600/30 rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <pre className="text-sm text-red-400 whitespace-pre-wrap font-mono">{importError}</pre>
            <button
              onClick={() => setImportError(null)}
              className="text-red-400 hover:text-red-300 text-sm flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#111118] border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">New Building</h2>

            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Cascade Commons"
              className="w-full px-3 py-2.5 min-h-[44px] bg-[#0a0a12] border border-gray-700 rounded-lg text-white text-sm mb-4 focus:outline-none focus:border-blue-500"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />

            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as BuildingType)}
              className="w-full px-3 py-2.5 min-h-[44px] bg-[#0a0a12] border border-gray-700 rounded-lg text-white text-sm mb-6 focus:outline-none focus:border-blue-500"
            >
              <option value="commercial">Commercial</option>
              <option value="mixed-use">Mixed-Use</option>
              <option value="residential">Residential</option>
              <option value="industrial">Industrial</option>
            </select>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setCreating(false); setNewName(''); }}
                className="px-4 py-2.5 min-h-[44px] text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-4 py-2.5 min-h-[44px] bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <p className="text-gray-600 text-sm mb-4">Create your first building or import an existing config</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Or drop a JSON file here to import
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {index.map((b) => (
            <BuildingCard key={b.id} building={b} onDelete={handleDelete} onExport={handleExport} />
          ))}
        </div>
      )}
    </div>
  );
}
