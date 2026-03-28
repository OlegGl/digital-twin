'use client';

import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Sensor, SensorType, SystemNode, MEPSystem } from '@/types';
import { defaultBuilding } from '@/data/building';
import { getMEPSystems } from '@/data/mepSystems';
import type { BuildingConfig } from '@/lib/buildingSchema';
import BuildingModel from './BuildingModel';
import SensorCube from './SensorCube';
import WireframeBuilding from './WireframeBuilding';
import MEPSystemsLayer from './MEPSystemsLayer';

interface Props {
  onSensorSelect: (sensor: Sensor) => void;
  wireframeMode: boolean;
  visibleSystems: Set<SensorType>;
  onNodeSelect: (node: SystemNode) => void;
  buildingConfig?: BuildingConfig | null;
}

export default function BuildingScene({
  onSensorSelect,
  wireframeMode,
  visibleSystems,
  onNodeSelect,
  buildingConfig,
}: Props) {
  // Convert BuildingConfig sensors to the Sensor[] format expected by existing components
  const allSensors: Sensor[] = useMemo(() => {
    if (buildingConfig) {
      return buildingConfig.floors.flatMap((f) =>
        f.sensors.map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          floorId: f.id,
          position: s.position,
          unit: s.unit,
          min: s.min,
          max: s.max,
          status: s.status,
        })),
      );
    }
    return defaultBuilding.floors.flatMap((f) => f.sensors);
  }, [buildingConfig]);

  // Convert BuildingConfig systems to MEPSystem[] format
  const mepSystems: MEPSystem[] = useMemo(() => {
    if (buildingConfig && buildingConfig.systems.length > 0) {
      return buildingConfig.systems.map((s) => ({
        type: s.type,
        nodes: s.nodes.map((n) => ({
          id: n.id,
          name: n.name,
          systemType: n.systemType,
          nodeType: n.nodeType as SystemNode['nodeType'],
          position: n.position,
          floor: n.floor,
          description: n.description,
          specs: n.specs as Record<string, string | number>,
          status: n.status,
        })),
        pipes: s.pipes.map((p) => ({
          id: p.id,
          systemType: p.systemType,
          fromNode: p.fromNode,
          toNode: p.toNode,
          waypoints: p.waypoints,
          diameter: p.diameter,
          label: p.label,
        })),
      })) as MEPSystem[];
    }
    return getMEPSystems();
  }, [buildingConfig]);

  const camPos = buildingConfig?.defaultView?.cameraPosition || [250, 150, 250];
  const camTarget = buildingConfig?.defaultView?.cameraTarget || [0, 40, 0];

  return (
    <Canvas
      camera={{ position: [camPos[0], camPos[1], camPos[2]], fov: 50, near: 1, far: 2000 }}
      shadows={!wireframeMode}
      className="w-full h-full"
      style={{ background: '#0a0a0f' }}
    >
      <ambientLight intensity={wireframeMode ? 0.6 : 0.35} />
      <directionalLight
        position={[200, 300, 150]}
        intensity={wireframeMode ? 0.4 : 1.2}
        castShadow={!wireframeMode}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={800}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <pointLight position={[-100, 200, -100]} intensity={0.3} color="#4488ff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color="#0d0d1a" />
      </mesh>

      <gridHelper args={[800, 40, '#1a1a2e', '#111122']} position={[0, 0, 0]} />

      {wireframeMode ? (
        <>
          <WireframeBuilding />
          <MEPSystemsLayer
            visibleSystems={visibleSystems}
            onNodeSelect={onNodeSelect}
            mepSystems={mepSystems}
          />
        </>
      ) : (
        <>
          <BuildingModel />
          {allSensors.map((sensor) => (
            <SensorCube key={sensor.id} sensor={sensor} onClick={onSensorSelect} />
          ))}
        </>
      )}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={20}
        maxDistance={600}
        maxPolarAngle={Math.PI / 2.1}
        target={[camTarget[0], camTarget[1], camTarget[2]]}
      />
    </Canvas>
  );
}
