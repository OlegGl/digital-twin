'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { SensorType, SENSOR_COLORS, SystemPipe } from '@/types';
import { getMEPSystems } from '@/data/mepSystems';
import SystemNode3D from './SystemNode3D';
import type { SystemNode } from '@/types';

interface Props {
  visibleSystems: Set<SensorType>;
  onNodeSelect: (node: SystemNode) => void;
}

function PipeSegment({ pipeData }: { pipeData: SystemPipe }) {
  const color = SENSOR_COLORS[pipeData.systemType];

  const geometry = useMemo(() => {
    if (pipeData.waypoints.length < 2) return null;

    const points = pipeData.waypoints.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z),
    );

    const curve = new THREE.CatmullRomCurve3(points, false, 'chordal', 0.05);
    const tubularSegments = Math.max(points.length * 10, 20);
    const radius = pipeData.diameter * 0.5;

    return new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false);
  }, [pipeData.waypoints, pipeData.diameter]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        metalness={0.3}
        roughness={0.5}
        transparent
        opacity={0.75}
      />
    </mesh>
  );
}

export default function MEPSystemsLayer({ visibleSystems, onNodeSelect }: Props) {
  const systems = useMemo(() => getMEPSystems(), []);

  const filteredSystems = useMemo(
    () => systems.filter((s) => visibleSystems.has(s.type)),
    [systems, visibleSystems],
  );

  return (
    <group>
      {filteredSystems.map((system) => (
        <group key={system.type}>
          {system.pipes.map((p) => (
            <PipeSegment key={p.id} pipeData={p} />
          ))}
          {system.nodes.map((n) => (
            <SystemNode3D key={n.id} node={n} onClick={onNodeSelect} />
          ))}
        </group>
      ))}
    </group>
  );
}
