'use client';

import { useState, useCallback } from 'react';
import type { BuildingConfig, SystemConfig, SystemNodeConfig, SystemPipeConfig } from '@/lib/buildingSchema';
import { SensorType, SENSOR_COLORS, SENSOR_LABELS } from '@/types';
import { generateId } from '@/lib/buildingSchema';
import FloorPlanCanvas from './FloorPlanCanvas';

interface Props {
  config: BuildingConfig;
  onChange: (updater: (prev: BuildingConfig) => BuildingConfig) => void;
}

const SYSTEM_TYPES = Object.values(SensorType);

export default function SystemEditor({ config, onChange }: Props) {
  const [selectedFloorNum, setSelectedFloorNum] = useState<number>(
    config.floors[0]?.number ?? 1,
  );
  const [activeSystemType, setActiveSystemType] = useState<SensorType>(SensorType.HVAC);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [drawingFrom, setDrawingFrom] = useState<string | null>(null);

  const selectedFloor = config.floors.find((f) => f.number === selectedFloorNum);

  // Get or create system for a type
  const getSystem = useCallback((type: SensorType): SystemConfig => {
    return config.systems.find((s) => s.type === type) || { type, nodes: [], pipes: [] };
  }, [config.systems]);

  const updateSystems = useCallback((updater: (systems: SystemConfig[]) => SystemConfig[]) => {
    onChange((prev) => ({ ...prev, systems: updater(prev.systems) }));
  }, [onChange]);

  // Ensure system exists in array
  const ensureSystem = useCallback((systems: SystemConfig[], type: SensorType): SystemConfig[] => {
    if (systems.some((s) => s.type === type)) return systems;
    return [...systems, { type, nodes: [], pipes: [] }];
  }, []);

  const handlePlaceNode = useCallback((x: number, z: number) => {
    if (!selectedFloor) return;
    const floorMidY = selectedFloor.number === 1 ? 10 : 20 + (selectedFloor.number - 2) * 10 + 5;

    const newNode: SystemNodeConfig = {
      id: generateId('node'),
      name: `${SENSOR_LABELS[activeSystemType]} Node`,
      systemType: activeSystemType,
      nodeType: 'terminal',
      position: { x, y: floorMidY, z },
      floor: selectedFloor.number,
      description: '',
      specs: {},
      status: 'normal',
    };

    updateSystems((systems) => {
      const updated = ensureSystem(systems, activeSystemType);
      return updated.map((s) =>
        s.type === activeSystemType ? { ...s, nodes: [...s.nodes, newNode] } : s,
      );
    });
    setSelectedNodeId(newNode.id);
  }, [selectedFloor, activeSystemType, updateSystems, ensureSystem]);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (drawingFrom) {
      // Complete pipe
      if (drawingFrom !== nodeId) {
        // Find system types to determine pipe type
        const fromNode = config.systems.flatMap((s) => s.nodes).find((n) => n.id === drawingFrom);
        const toNode = config.systems.flatMap((s) => s.nodes).find((n) => n.id === nodeId);
        if (fromNode && toNode) {
          const pipeType = fromNode.systemType;
          const newPipe: SystemPipeConfig = {
            id: generateId('pipe'),
            systemType: pipeType,
            fromNode: drawingFrom,
            toNode: nodeId,
            waypoints: [
              [fromNode.position.x, fromNode.position.y, fromNode.position.z],
              [toNode.position.x, toNode.position.y, toNode.position.z],
            ],
            diameter: 0.5,
          };
          updateSystems((systems) => {
            const updated = ensureSystem(systems, pipeType);
            return updated.map((s) =>
              s.type === pipeType ? { ...s, pipes: [...s.pipes, newPipe] } : s,
            );
          });
        }
      }
      setDrawingFrom(null);
    } else {
      setSelectedNodeId(nodeId);
    }
  }, [drawingFrom, config.systems, updateSystems, ensureSystem]);

  const handleStartDrawing = useCallback((nodeId: string) => {
    setDrawingFrom(nodeId);
    setSelectedNodeId(null);
  }, []);

  const handleMoveNode = useCallback((nodeId: string, x: number, z: number) => {
    updateSystems((systems) =>
      systems.map((s) => ({
        ...s,
        nodes: s.nodes.map((n) =>
          n.id === nodeId ? { ...n, position: { ...n.position, x, z } } : n,
        ),
      })),
    );
  }, [updateSystems]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    updateSystems((systems) =>
      systems.map((s) => ({
        ...s,
        nodes: s.nodes.filter((n) => n.id !== nodeId),
        pipes: s.pipes.filter((p) => p.fromNode !== nodeId && p.toNode !== nodeId),
      })),
    );
    setSelectedNodeId(null);
  }, [updateSystems]);

  const handleDeletePipe = useCallback((pipeId: string) => {
    updateSystems((systems) =>
      systems.map((s) => ({
        ...s,
        pipes: s.pipes.filter((p) => p.id !== pipeId),
      })),
    );
  }, [updateSystems]);

  // Get nodes/pipes for the current floor
  const floorNodes = config.systems.flatMap((s) => s.nodes).filter((n) => n.floor === selectedFloorNum);
  const floorNodeIds = new Set(floorNodes.map((n) => n.id));
  const floorPipes = config.systems.flatMap((s) => s.pipes).filter(
    (p) => floorNodeIds.has(p.fromNode) || floorNodeIds.has(p.toNode),
  );

  const selectedNode = selectedNodeId
    ? config.systems.flatMap((s) => s.nodes).find((n) => n.id === selectedNodeId)
    : null;

  const sortedFloors = [...config.floors].sort((a, b) => a.number - b.number);

  return (
    <div className="flex h-full">
      {/* Left sidebar: system palette + floor selector */}
      <div className="w-52 border-r border-gray-800 flex flex-col">
        {/* System type palette */}
        <div className="p-3 border-b border-gray-800">
          <span className="text-[10px] text-gray-500 font-medium block mb-2">SYSTEM TYPE</span>
          <div className="grid grid-cols-2 gap-1">
            {SYSTEM_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setActiveSystemType(type)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${
                  type === activeSystemType
                    ? 'bg-white/10 ring-1 ring-white/20'
                    : 'hover:bg-white/5'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: SENSOR_COLORS[type] }}
                />
                <span className="text-gray-300 truncate">{SENSOR_LABELS[type]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Floor selector */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <span className="text-[10px] text-gray-500 font-medium block mb-2">FLOORS</span>
            {sortedFloors.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFloorNum(f.number)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs mb-0.5 transition-colors ${
                  f.number === selectedFloorNum
                    ? 'bg-blue-600/15 text-blue-400'
                    : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                F{f.number} — {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mode indicator */}
        <div className="p-3 border-t border-gray-800 text-[10px] text-gray-500">
          {drawingFrom ? (
            <span className="text-amber-400">Drawing pipe — click target node</span>
          ) : (
            <>
              <div>Long-press: place node</div>
              <div>Click node: select</div>
              <div>Shift+click: start pipe</div>
              <div>Drag: move node</div>
              <div>Delete: remove selected</div>
            </>
          )}
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative">
        <FloorPlanCanvas
          floor={selectedFloor || null}
          nodes={floorNodes}
          pipes={floorPipes}
          allNodes={config.systems.flatMap((s) => s.nodes)}
          selectedNodeId={selectedNodeId}
          drawingFrom={drawingFrom}
          onPlaceNode={handlePlaceNode}
          onNodeClick={handleNodeClick}
          onStartDrawing={handleStartDrawing}
          onMoveNode={handleMoveNode}
          onDeleteNode={handleDeleteNode}
          onDeletePipe={handleDeletePipe}
        />

        {/* Node properties panel */}
        {selectedNode && (
          <div className="absolute top-3 right-3 w-56 bg-[#0d0d18] border border-gray-700 rounded-lg p-3 z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-white">Node Properties</span>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-gray-500 hover:text-gray-300 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Name</label>
                <input
                  value={selectedNode.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    updateSystems((systems) =>
                      systems.map((s) => ({
                        ...s,
                        nodes: s.nodes.map((n) =>
                          n.id === selectedNode.id ? { ...n, name } : n,
                        ),
                      })),
                    );
                  }}
                  className="w-full px-2 py-1 bg-[#0a0a12] border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Type</label>
                <select
                  value={selectedNode.nodeType}
                  onChange={(e) => {
                    const nodeType = e.target.value as SystemNodeConfig['nodeType'];
                    updateSystems((systems) =>
                      systems.map((s) => ({
                        ...s,
                        nodes: s.nodes.map((n) =>
                          n.id === selectedNode.id ? { ...n, nodeType } : n,
                        ),
                      })),
                    );
                  }}
                  className="w-full px-2 py-1 bg-[#0a0a12] border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  {['source', 'junction', 'panel', 'valve', 'meter', 'equipment', 'terminal', 'riser'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] text-gray-500">
                Pos: {Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.z)}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleStartDrawing(selectedNode.id)}
                  className="flex-1 text-[10px] px-2 py-1 bg-blue-600/15 text-blue-400 rounded hover:bg-blue-600/25"
                >
                  Draw Pipe
                </button>
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="text-[10px] px-2 py-1 bg-red-600/10 text-red-400 rounded hover:bg-red-600/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
