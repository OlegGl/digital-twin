'use client';

import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SensorType, SENSOR_COLORS } from '@/types';
import type { BuildingConfig, SystemPipeConfig } from '@/lib/buildingSchema';

interface Props {
  config: BuildingConfig;
  wireframe: boolean;
  visibleSystems: Set<SensorType>;
}

function FloorMesh({ outline, yBase, height, wireframe }: {
  outline: [number, number][];
  yBase: number;
  height: number;
  wireframe: boolean;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (outline.length < 3) return s;
    s.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) {
      s.lineTo(outline[i][0], outline[i][1]);
    }
    s.closePath();
    return s;
  }, [outline]);

  const geometry = useMemo(() => {
    const settings = { steps: 1, depth: height, bevelEnabled: false };
    return new THREE.ExtrudeGeometry(shape, settings);
  }, [shape, height]);

  // ExtrudeGeometry extrudes along Z; rotate so it goes along Y
  return (
    <group position={[0, yBase, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={geometry}>
        {wireframe ? (
          <meshBasicMaterial color="#6688aa" transparent opacity={0.04} side={THREE.DoubleSide} depthWrite={false} />
        ) : (
          <meshStandardMaterial color="#8a8578" metalness={0.1} roughness={0.9} />
        )}
      </mesh>
      {wireframe && (
        <lineSegments geometry={new THREE.EdgesGeometry(geometry)}>
          <lineBasicMaterial color="#4a6a8a" transparent opacity={0.35} />
        </lineSegments>
      )}
    </group>
  );
}

function PipeSegment3D({ pipe, allNodes }: { pipe: SystemPipeConfig; allNodes: BuildingConfig['systems'][0]['nodes'] }) {
  const color = SENSOR_COLORS[pipe.systemType];

  const geometry = useMemo(() => {
    const from = allNodes.find((n) => n.id === pipe.fromNode);
    const to = allNodes.find((n) => n.id === pipe.toNode);
    if (!from || !to) return null;

    const points = [
      new THREE.Vector3(from.position.x, from.position.y, from.position.z),
      new THREE.Vector3(to.position.x, to.position.y, to.position.z),
    ];

    // Axis-aligned routing
    const aligned: THREE.Vector3[] = [points[0]];
    const a = points[0];
    const b = points[1];
    const dy = b.y - a.y;
    const dx = b.x - a.x;
    const dz = b.z - a.z;

    let cursor = a.clone();
    if (Math.abs(dy) > 0.01) {
      cursor = new THREE.Vector3(cursor.x, b.y, cursor.z);
      aligned.push(cursor.clone());
    }
    if (Math.abs(dx) > 0.01) {
      cursor = new THREE.Vector3(b.x, cursor.y, cursor.z);
      aligned.push(cursor.clone());
    }
    if (Math.abs(dz) > 0.01) {
      cursor = new THREE.Vector3(cursor.x, cursor.y, b.z);
      if (cursor.distanceTo(aligned[aligned.length - 1]) > 0.01) {
        aligned.push(cursor.clone());
      }
    }

    const curves: THREE.Curve<THREE.Vector3>[] = [];
    for (let i = 0; i < aligned.length - 1; i++) {
      curves.push(new THREE.LineCurve3(aligned[i], aligned[i + 1]));
    }
    if (curves.length === 0) return null;
    const path = new THREE.CurvePath<THREE.Vector3>();
    curves.forEach((c) => path.add(c));

    return new THREE.TubeGeometry(path, Math.max(8, aligned.length * 4), pipe.diameter * 0.5, 6, false);
  }, [pipe, allNodes]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.3} roughness={0.5} transparent opacity={0.75} />
    </mesh>
  );
}

export default function BuildingPreviewScene({ config, wireframe, visibleSystems }: Props) {
  const camPos = config.defaultView.cameraPosition;
  const camTarget = config.defaultView.cameraTarget;

  // Compute floor Y bases by stacking heights
  const sortedFloors = [...config.floors].sort((a, b) => a.number - b.number);
  const floorYBases: Record<string, number> = {};
  let currentY = 0;
  sortedFloors.forEach((f) => {
    floorYBases[f.id] = currentY;
    currentY += f.height;
  });

  const allNodes = config.systems.flatMap((s) => s.nodes);
  const visiblePipes = config.systems
    .filter((s) => visibleSystems.has(s.type))
    .flatMap((s) => s.pipes);
  const visibleNodes = config.systems
    .filter((s) => visibleSystems.has(s.type))
    .flatMap((s) => s.nodes);

  return (
    <Canvas
      camera={{ position: [camPos[0], camPos[1], camPos[2]], fov: 50, near: 1, far: 2000 }}
      shadows={!wireframe}
      style={{ background: '#0a0a0f' }}
    >
      <ambientLight intensity={wireframe ? 0.6 : 0.35} />
      <directionalLight position={[200, 300, 150]} intensity={wireframe ? 0.4 : 1.2} />
      <pointLight position={[-100, 200, -100]} intensity={0.3} color="#4488ff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color="#0d0d1a" />
      </mesh>
      <gridHelper args={[800, 40, '#1a1a2e', '#111122']} />

      {/* Floor meshes */}
      {sortedFloors.map((f) => (
        <FloorMesh
          key={f.id}
          outline={f.outline}
          yBase={floorYBases[f.id]}
          height={f.height}
          wireframe={wireframe}
        />
      ))}

      {/* MEP nodes */}
      {wireframe && visibleNodes.map((node) => (
        <mesh key={node.id} position={[node.position.x, node.position.y, node.position.z]}>
          <sphereGeometry args={[2, 8, 8]} />
          <meshStandardMaterial
            color={SENSOR_COLORS[node.systemType]}
            emissive={SENSOR_COLORS[node.systemType]}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}

      {/* MEP pipes */}
      {wireframe && visiblePipes.map((pipe) => (
        <PipeSegment3D key={pipe.id} pipe={pipe} allNodes={allNodes} />
      ))}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        target={[camTarget[0], camTarget[1], camTarget[2]]}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
