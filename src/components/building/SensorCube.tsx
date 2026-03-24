'use client';

import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Sensor, SENSOR_COLORS, SENSOR_LABELS } from '@/types';

interface Props {
  sensor: Sensor;
  onClick: (sensor: Sensor) => void;
}

export default function SensorCube({ sensor, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const color = SENSOR_COLORS[sensor.type];

  useFrame(() => {
    if (meshRef.current) {
      const target = hovered ? 1.6 : 1;
      const s = meshRef.current.scale.x;
      const next = s + (target - s) * 0.15;
      meshRef.current.scale.setScalar(next);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[sensor.position.x, sensor.position.y, sensor.position.z]}
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
        onClick(sensor);
      }}
    >
      <boxGeometry args={[5, 5, 5]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.8 : 0.3}
        metalness={0.5}
        roughness={0.3}
      />
      {hovered && (
        <Html distanceFactor={150} style={{ pointerEvents: 'none' }}>
          <div className="bg-[#111118]/95 border border-gray-700 rounded px-2.5 py-1.5 text-xs whitespace-nowrap backdrop-blur-sm">
            <div className="font-medium text-white">{sensor.name}</div>
            <div className="text-gray-400 text-[10px]">{SENSOR_LABELS[sensor.type]}</div>
          </div>
        </Html>
      )}
    </mesh>
  );
}
