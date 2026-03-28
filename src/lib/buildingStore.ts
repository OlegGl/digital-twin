'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { BuildingConfig, BuildingIndexEntry } from './buildingSchema';

const STORAGE_KEY = 'digital-twin-selected-building';

// ─── Simple external store for selected building ID ──────────────────────────
let _selectedId: string | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((l) => l());
}

function getSelectedId(): string | null {
  return _selectedId;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setSelectedId(id: string | null) {
  _selectedId = id;
  if (typeof window !== 'undefined') {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  emitChange();
}

// Initialize from localStorage
if (typeof window !== 'undefined') {
  _selectedId = localStorage.getItem(STORAGE_KEY);
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useSelectedBuildingId() {
  const id = useSyncExternalStore(subscribe, getSelectedId, () => null);
  return [id, setSelectedId] as const;
}

export function useBuildingIndex() {
  const [index, setIndex] = useState<BuildingIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/buildings');
      if (res.ok) {
        setIndex(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { index, loading, refresh };
}

export function useBuildingConfig(id: string | null) {
  const [config, setConfig] = useState<BuildingConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (buildingId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/buildings/${buildingId}`);
      if (res.ok) {
        setConfig(await res.json());
      } else {
        setConfig(null);
      }
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      load(id);
    } else {
      setConfig(null);
    }
  }, [id, load]);

  return { config, loading, reload: () => id && load(id) };
}
