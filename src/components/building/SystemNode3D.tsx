'use client';

import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SystemNode, SENSOR_COLORS, SENSOR_LABELS } from '@/types';

interface Props {
  node: SystemNode;
  onClick: (node: SystemNode) => void;
}

const NODE_RADII: Record<string, number> = {
  source: 3,
  equipment: 2.8,
  panel: 2.2,
  meter: 2.2,
  valve: 2,
  junction: 1.6,
  riser: 1.4,
  terminal: 1.8,
};

export default function SystemNode3D({ node, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const color = SENSOR_COLORS[node.systemType];
  const radius = NODE_RADII[node.nodeType] ?? 2;

  useFrame(() => {
    if (!meshRef.current) return;
    const target = hovered ? 1.5 : 1;
    const s = meshRef.current.scale.x;
    meshRef.current.scale.setScalar(s + (target - s) * 0.15);
  });

  return (
    <group position={[node.position.x, node.position.y, node.position.z]}>
      {/* Glow sphere (outer) */}
      <mesh>
        <sphereGeometry args={[radius * 1.4, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.2 : 0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Core sphere (interactive) */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(node);
        }}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.9 : 0.5}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Hover tooltip */}
      {hovered && (
        <Html distanceFactor={150} style={{ pointerEvents: 'none' }}>
          <div className="bg-[#111118]/95 border border-gray-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap backdrop-blur-sm min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                {SENSOR_LABELS[node.systemType]}
              </span>
            </div>
            <div className="font-medium text-white text-sm">{node.name}</div>
            <div className="text-gray-500 text-[10px] mt-0.5">
              Floor {node.floor === 8 ? 'Penthouse' : node.floor} · {node.nodeType}
            </div>
            <div className="text-gray-400 text-[10px] mt-1 max-w-[220px] leading-relaxed line-clamp-2">
              {node.description.split(' — ')[0]}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
