'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface Props {
  outline: [number, number][];
  onChange: (outline: [number, number][]) => void;
}

const GRID_SIZE = 10; // snap grid in feet
const CANVAS_W = 600;
const CANVAS_H = 400;

export default function FloorShapeEditor({ outline, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [pan, setPan] = useState({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
  const [scale, setScale] = useState(2); // pixels per foot
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // World → canvas
  const toCanvas = useCallback((wx: number, wz: number) => ({
    x: pan.x + wx * scale,
    y: pan.y + wz * scale,
  }), [pan, scale]);

  // Canvas → world
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

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 0.5;
    const gridPx = GRID_SIZE * scale;
    const startX = pan.x % gridPx;
    const startY = pan.y % gridPx;
    for (let x = startX; x < CANVAS_W; x += gridPx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = startY; y < CANVAS_H; y += gridPx) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    // Origin crosshair
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pan.x, 0);
    ctx.lineTo(pan.x, CANVAS_H);
    ctx.moveTo(0, pan.y);
    ctx.lineTo(CANVAS_W, pan.y);
    ctx.stroke();

    // Polygon fill
    if (outline.length >= 3) {
      ctx.beginPath();
      const p0 = toCanvas(outline[0][0], outline[0][1]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < outline.length; i++) {
        const p = toCanvas(outline[i][0], outline[i][1]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.fill();

      // Edges
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Edge lengths
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px monospace';
      for (let i = 0; i < outline.length; i++) {
        const j = (i + 1) % outline.length;
        const a = toCanvas(outline[i][0], outline[i][1]);
        const b = toCanvas(outline[j][0], outline[j][1]);
        const dx = outline[j][0] - outline[i][0];
        const dz = outline[j][1] - outline[i][1];
        const len = Math.sqrt(dx * dx + dz * dz);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        ctx.fillText(`${Math.round(len)}'`, mx + 4, my - 4);
      }
    }

    // Vertices
    outline.forEach((pt, i) => {
      const p = toCanvas(pt[0], pt[1]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = draggingIdx === i ? '#60a5fa' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Coordinate label
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px monospace';
      ctx.fillText(`${pt[0]},${pt[1]}`, p.x + 8, p.y - 8);
    });
  }, [outline, pan, scale, toCanvas, draggingIdx]);

  // Mouse handlers
  const getMousePos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);

    // Right-click or middle-click → pan
    if (e.button === 1 || e.button === 2) {
      setIsPanning(true);
      panStart.current = { x: pos.x, y: pos.y, panX: pan.x, panY: pan.y };
      return;
    }

    // Check if clicking a vertex
    for (let i = 0; i < outline.length; i++) {
      const p = toCanvas(outline[i][0], outline[i][1]);
      const dx = pos.x - p.x;
      const dy = pos.y - p.y;
      if (dx * dx + dy * dy < 100) {
        setDraggingIdx(i);
        return;
      }
    }

    // Check if clicking on an edge → insert vertex
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length;
      const a = toCanvas(outline[i][0], outline[i][1]);
      const b = toCanvas(outline[j][0], outline[j][1]);
      const dist = pointToSegDist(pos.x, pos.y, a.x, a.y, b.x, b.y);
      if (dist < 8) {
        const [wx, wz] = toWorld(pos.x, pos.y);
        const newOutline = [...outline];
        newOutline.splice(j, 0, [wx, wz]);
        onChange(newOutline);
        setDraggingIdx(j);
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    if (isPanning) {
      setPan({
        x: panStart.current.panX + (pos.x - panStart.current.x),
        y: panStart.current.panY + (pos.y - panStart.current.y),
      });
      return;
    }
    if (draggingIdx !== null) {
      const [wx, wz] = toWorld(pos.x, pos.y);
      const newOutline = [...outline];
      newOutline[draggingIdx] = [wx, wz];
      onChange(newOutline);
    }
  };

  const handleMouseUp = () => {
    setDraggingIdx(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const newScale = Math.max(0.5, Math.min(10, scale - e.deltaY * 0.002));
    setScale(newScale);
  };

  // Double-click vertex to delete
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (outline.length <= 3) return;
    const pos = getMousePos(e);
    for (let i = 0; i < outline.length; i++) {
      const p = toCanvas(outline[i][0], outline[i][1]);
      const dx = pos.x - p.x;
      const dy = pos.y - p.y;
      if (dx * dx + dy * dy < 100) {
        onChange(outline.filter((_, idx) => idx !== i));
        return;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="border border-gray-700 rounded-lg cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

function pointToSegDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
}
