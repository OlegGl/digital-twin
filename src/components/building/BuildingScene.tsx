'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Sensor, SensorType, SystemNode } from '@/types';
import { defaultBuilding } from '@/data/building';
import BuildingModel from './BuildingModel';
import SensorCube from './SensorCube';
import WireframeBuilding from './WireframeBuilding';
import MEPSystemsLayer from './MEPSystemsLayer';

interface Props {
  onSensorSelect: (sensor: Sensor) => void;
  wireframeMode: boolean;
  visibleSystems: Set<SensorType>;
  onNodeSelect: (node: SystemNode) => void;
}

export default function BuildingScene({
  onSensorSelect,
  wireframeMode,
  visibleSystems,
  onNodeSelect,
}: Props) {
  const allSensors = defaultBuilding.floors.flatMap((f) => f.sensors);

  return (
    <Canvas
      camera={{ position: [250, 150, 250], fov: 50, near: 1, far: 2000 }}
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

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color="#0d0d1a" />
      </mesh>

      {/* Grid on ground */}
      <gridHelper args={[800, 40, '#1a1a2e', '#111122']} position={[0, 0, 0]} />

      {wireframeMode ? (
        <>
          <WireframeBuilding />
          <MEPSystemsLayer visibleSystems={visibleSystems} onNodeSelect={onNodeSelect} />
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
        target={[0, 40, 0]}
      />
    </Canvas>
  );
}
