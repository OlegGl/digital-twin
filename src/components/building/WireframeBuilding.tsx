'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

export default function WireframeBuilding() {
  const podiumEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(150, 20, 300)), []);
  const towerEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(80, 60, 200)), []);
  const penthouseEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(24, 5, 32)), []);

  const podiumFloor = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(150, 0.1, 300)), []);
  const towerFloor = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(80, 0.1, 200)), []);

  return (
    <group>
      {/* Podium shell */}
      <mesh position={[0, 10, 0]}>
        <boxGeometry args={[150, 20, 300]} />
        <meshBasicMaterial
          color="#6688aa"
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <lineSegments position={[0, 10, 0]} geometry={podiumEdges}>
        <lineBasicMaterial color="#4a6a8a" transparent opacity={0.35} />
      </lineSegments>

      {/* Tower shell */}
      <mesh position={[0, 50, 0]}>
        <boxGeometry args={[80, 60, 200]} />
        <meshBasicMaterial
          color="#6688aa"
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <lineSegments position={[0, 50, 0]} geometry={towerEdges}>
        <lineBasicMaterial color="#4a6a8a" transparent opacity={0.35} />
      </lineSegments>

      {/* Penthouse shell */}
      <mesh position={[0, 84, 0]}>
        <boxGeometry args={[24, 5, 32]} />
        <meshBasicMaterial
          color="#6688aa"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <lineSegments position={[0, 84, 0]} geometry={penthouseEdges}>
        <lineBasicMaterial color="#5a7a9a" transparent opacity={0.45} />
      </lineSegments>

      {/* Ground plane (y=0) — podium footprint */}
      <lineSegments position={[0, 0, 0]} geometry={podiumFloor}>
        <lineBasicMaterial color="#3a5a7a" transparent opacity={0.25} />
      </lineSegments>

      {/* Tower floor plates at each story boundary */}
      {[20, 30, 40, 50, 60, 70, 80].map((y) => (
        <lineSegments key={`floor-${y}`} position={[0, y, 0]} geometry={towerFloor}>
          <lineBasicMaterial color="#3a4a6a" transparent opacity={0.2} />
        </lineSegments>
      ))}

      {/* Floor labels */}
      {[
        { y: 10, label: 'F1 — Commercial' },
        { y: 25, label: 'F2' },
        { y: 35, label: 'F3' },
        { y: 45, label: 'F4' },
        { y: 55, label: 'F5' },
        { y: 65, label: 'F6' },
        { y: 75, label: 'F7' },
        { y: 84, label: 'Mechanical' },
      ].map(({ y, label }) => (
        <mesh key={`label-bg-${y}`} position={[-42, y, -102]}>
          <planeGeometry args={[
            label.length > 4 ? 28 : 12,
            4,
          ]} />
          <meshBasicMaterial color="#0a0a0f" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
