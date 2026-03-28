'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { SensorType, SENSOR_COLORS, SystemPipe, MEPSystem } from '@/types';
import { getMEPSystems } from '@/data/mepSystems';
import SystemNode3D from './SystemNode3D';
import type { SystemNode } from '@/types';

interface Props {
  visibleSystems: Set<SensorType>;
  onNodeSelect: (node: SystemNode) => void;
  mepSystems?: MEPSystem[];
}

function PipeSegment({ pipeData }: { pipeData: SystemPipe }) {
  const color = SENSOR_COLORS[pipeData.systemType];

  const geometry = useMemo(() => {
    if (pipeData.waypoints.length < 2) return null;

    const radius = pipeData.diameter * 0.5;

    const raw = pipeData.waypoints.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z),
    );

    const aligned: THREE.Vector3[] = [raw[0]];
    for (let i = 1; i < raw.length; i++) {
      const prev = aligned[aligned.length - 1];
      const next = raw[i];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const dz = next.z - prev.z;

      const axes = [Math.abs(dx), Math.abs(dy), Math.abs(dz)];
      const moving = axes.filter((a) => a > 0.01).length;

      if (moving <= 1) {
        aligned.push(next.clone());
      } else {
        let cursor = prev.clone();
        if (Math.abs(dy) > 0.01) {
          cursor = new THREE.Vector3(cursor.x, next.y, cursor.z);
          aligned.push(cursor.clone());
        }
        if (Math.abs(dx) > 0.01) {
          cursor = new THREE.Vector3(next.x, cursor.y, cursor.z);
          aligned.push(cursor.clone());
        }
        if (Math.abs(dz) > 0.01) {
          cursor = new THREE.Vector3(cursor.x, cursor.y, next.z);
          if (cursor.distanceTo(aligned[aligned.length - 1]) > 0.01) {
            aligned.push(cursor.clone());
          }
        }
      }
    }

    const curves: THREE.Curve<THREE.Vector3>[] = [];
    for (let i = 0; i < aligned.length - 1; i++) {
      curves.push(new THREE.LineCurve3(aligned[i], aligned[i + 1]));
    }
    const path = new THREE.CurvePath<THREE.Vector3>();
    curves.forEach((c) => path.add(c));

    const tubularSegments = Math.max(aligned.length * 4, 12);
    return new THREE.TubeGeometry(path, tubularSegments, radius, 8, false);
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

export default function MEPSystemsLayer({ visibleSystems, onNodeSelect, mepSystems }: Props) {
  const defaultSystems = useMemo(() => getMEPSystems(), []);
  const systems = mepSystems || defaultSystems;

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
