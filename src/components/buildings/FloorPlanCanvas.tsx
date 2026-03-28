'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { SENSOR_COLORS } from '@/types';
import type { FloorConfig, SystemNodeConfig, SystemPipeConfig } from '@/lib/buildingSchema';

interface Props {
  floor: FloorConfig | null;
  nodes: SystemNodeConfig[];
  pipes: SystemPipeConfig[];
  allNodes: SystemNodeConfig[];
  selectedNodeId: string | null;
  drawingFrom: string | null;
  onPlaceNode: (x: number, z: number) => void;
  onNodeClick: (nodeId: string) => void;
  onStartDrawing: (nodeId: string) => void;
  onMoveNode: (nodeId: string, x: number, z: number) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeletePipe: (pipeId: string) => void;
}

const GRID_SIZE = 10;

export default function FloorPlanCanvas({
  floor,
  nodes,
  pipes,
  allNodes,
  selectedNodeId,
  drawingFrom,
  onPlaceNode,
  onNodeClick,
  onStartDrawing,
  onMoveNode,
  onDeleteNode,
  onDeletePipe,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(2);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  // Center on floor outline
  useEffect(() => {
    if (floor) {
      setPan({ x: size.w / 2, y: size.h / 2 });
    }
  }, [floor?.id, size.w, size.h]); // eslint-disable-line react-hooks/exhaustive-deps

  const toCanvas = useCallback((wx: number, wz: number) => ({
    x: pan.x + wx * scale,
    y: pan.y + wz * scale,
  }), [pan, scale]);

  const toWorld = useCallback((cx: number, cy: number): [number, number] => {
    const wx = (cx - pan.x) / scale;
    const wz = (cy - pan.y) / scale;
    return [Math.round(wx / GRID_SIZE) * GRID_SIZE, Math.round(wz / GRID_SIZE) * GRID_SIZE];
  }, [pan, scale]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size.w, size.h);
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, size.w, size.h);

    // Grid
    const gridPx = GRID_SIZE * scale;
    if (gridPx > 4) {
      ctx.strokeStyle = '#151520';
      ctx.lineWidth = 0.5;
      const sx = ((pan.x % gridPx) + gridPx) % gridPx;
      const sy = ((pan.y % gridPx) + gridPx) % gridPx;
      for (let x = sx; x < size.w; x += gridPx) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size.h);
        ctx.stroke();
      }
      for (let y = sy; y < size.h; y += gridPx) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size.w, y);
        ctx.stroke();
      }
    }

    // Floor outline
    if (floor && floor.outline.length >= 3) {
      ctx.beginPath();
      const p0 = toCanvas(floor.outline[0][0], floor.outline[0][1]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < floor.outline.length; i++) {
        const p = toCanvas(floor.outline[i][0], floor.outline[i][1]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Pipes (axis-aligned routing)
    pipes.forEach((pipe) => {
      const fromNode = allNodes.find((n) => n.id === pipe.fromNode);
      const toNode = allNodes.find((n) => n.id === pipe.toNode);
      if (!fromNode || !toNode) return;

      const color = SENSOR_COLORS[pipe.systemType];
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, pipe.diameter * scale * 0.5);
      ctx.globalAlpha = 0.7;

      // Route at right angles: vertical first (in 2D that's Z), then X
      const from = toCanvas(fromNode.position.x, fromNode.position.z);
      const to = toCanvas(toNode.position.x, toNode.position.z);
      const mid = { x: from.x, y: to.y };

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(mid.x, mid.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Drawing in progress
    if (drawingFrom && mousePos) {
      const fromNode = allNodes.find((n) => n.id === drawingFrom);
      if (fromNode) {
        const from = toCanvas(fromNode.position.x, fromNode.position.z);
        const mid = { x: from.x, y: mousePos.y };
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(mid.x, mid.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Nodes
    nodes.forEach((node) => {
      const p = toCanvas(node.position.x, node.position.z);
      const color = SENSOR_COLORS[node.systemType];
      const radius = node.id === selectedNodeId ? 8 : 6;

      // Glow for selected
      if (node.id === selectedNodeId) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = color + '22';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = node.id === selectedNodeId ? '#fff' : '#000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px system-ui';
      ctx.fillText(node.name, p.x + 10, p.y + 3);
    });
  }, [size, pan, scale, floor, nodes, pipes, allNodes, selectedNodeId, drawingFrom, mousePos, toCanvas]);

  // Event handlers
  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const findNodeAt = (cx: number, cy: number): SystemNodeConfig | null => {
    for (const node of nodes) {
      const p = toCanvas(node.position.x, node.position.z);
      const dx = cx - p.x;
      const dy = cy - p.y;
      if (dx * dx + dy * dy < 144) return node;
    }
    return null;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getPos(e);

    // Middle click pan
    if (e.button === 1) {
      isPanning.current = true;
      panStart.current = { mx: pos.x, my: pos.y, px: pan.x, py: pan.y };
      return;
    }

    if (e.button !== 0) return;

    const hitNode = findNodeAt(pos.x, pos.y);

    if (e.shiftKey && hitNode) {
      onStartDrawing(hitNode.id);
      return;
    }

    if (hitNode) {
      if (drawingFrom) {
        onNodeClick(hitNode.id);
        return;
      }
      // Start drag after small movement
      setDraggingNodeId(hitNode.id);
      onNodeClick(hitNode.id);
      return;
    }

    // Long press to place node
    longPressTimer.current = setTimeout(() => {
      const [wx, wz] = toWorld(pos.x, pos.y);
      onPlaceNode(wx, wz);
      longPressTimer.current = null;
    }, 500);
  }, [pan, scale, nodes, drawingFrom, onNodeClick, onPlaceNode, onStartDrawing, toCanvas, toWorld]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getPos(e);
    setMousePos(pos);

    if (isPanning.current) {
      setPan({
        x: panStart.current.px + (pos.x - panStart.current.mx),
        y: panStart.current.py + (pos.y - panStart.current.my),
      });
      return;
    }

    // Cancel long press if moved too far
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      // Start panning instead
      isPanning.current = true;
      panStart.current = { mx: pos.x, my: pos.y, px: pan.x, py: pan.y };
      return;
    }

    if (draggingNodeId) {
      const [wx, wz] = toWorld(pos.x, pos.y);
      onMoveNode(draggingNodeId, wx, wz);
    }
  }, [pan, draggingNodeId, onMoveNode, toWorld]);

  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    isPanning.current = false;
    setDraggingNodeId(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const pos = getPos(e);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(15, scale * factor));
    // Zoom toward cursor
    const dx = pos.x - pan.x;
    const dy = pos.y - pan.y;
    setPan({
      x: pos.x - dx * (newScale / scale),
      y: pos.y - dy * (newScale / scale),
    });
    setScale(newScale);
  }, [pan, scale]);

  // Keyboard handler for delete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedNodeId) {
        onDeleteNode(selectedNodeId);
      }
      if (e.key === 'Escape') {
        // Cancel drawing
        if (drawingFrom) {
          onNodeClick('__cancel__'); // no-op, just to reset
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNodeId, drawingFrom, onDeleteNode, onNodeClick]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        width={size.w}
        height={size.h}
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
