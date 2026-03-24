'use client';

import { useRef } from 'react';
import * as THREE from 'three';

export default function BuildingModel() {
  const groupRef = useRef<THREE.Group>(null);

  // Ground floor: Safeway podium — 150 x 20 x 300
  // Tower: 80 x 60 x 200, centered on podium, starting at y=20

  return (
    <group ref={groupRef}>
      {/* Ground floor — Safeway podium */}
      <mesh position={[0, 10, 0]} castShadow receiveShadow>
        <boxGeometry args={[150, 20, 300]} />
        <meshStandardMaterial color="#1a3a3a" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Glass storefront (front face of ground floor) */}
      <mesh position={[0, 10, -151]} castShadow>
        <boxGeometry args={[148, 16, 1]} />
        <meshStandardMaterial
          color="#2288aa"
          metalness={0.8}
          roughness={0.1}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Safeway sign area */}
      <mesh position={[0, 19, -151.5]}>
        <boxGeometry args={[60, 3, 0.5]} />
        <meshStandardMaterial color="#225533" emissive="#114422" emissiveIntensity={0.5} />
      </mesh>

      {/* Residential tower — floors 2-7 (60ft total, each 10ft) */}
      <mesh position={[0, 50, 0]} castShadow receiveShadow>
        <boxGeometry args={[80, 60, 200]} />
        <meshStandardMaterial color="#2a2a3a" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Window grid — front face of tower */}
      {[0, 1, 2, 3, 4, 5].map((floorIdx) => {
        const y = 23 + floorIdx * 10;
        return Array.from({ length: 8 }).map((_, col) => (
          <mesh
            key={`win-front-${floorIdx}-${col}`}
            position={[-28 + col * 8, y, -101]}
          >
            <boxGeometry args={[5, 7, 0.5]} />
            <meshStandardMaterial
              color="#334466"
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.5}
              emissive="#223344"
              emissiveIntensity={0.2}
            />
          </mesh>
        ));
      })}

      {/* Window grid — back face */}
      {[0, 1, 2, 3, 4, 5].map((floorIdx) => {
        const y = 23 + floorIdx * 10;
        return Array.from({ length: 8 }).map((_, col) => (
          <mesh
            key={`win-back-${floorIdx}-${col}`}
            position={[-28 + col * 8, y, 101]}
          >
            <boxGeometry args={[5, 7, 0.5]} />
            <meshStandardMaterial
              color="#334466"
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.5}
              emissive="#223344"
              emissiveIntensity={0.2}
            />
          </mesh>
        ));
      })}

      {/* Side windows — left */}
      {[0, 1, 2, 3, 4, 5].map((floorIdx) => {
        const y = 23 + floorIdx * 10;
        return Array.from({ length: 12 }).map((_, col) => (
          <mesh
            key={`win-left-${floorIdx}-${col}`}
            position={[-41, y, -80 + col * 14]}
          >
            <boxGeometry args={[0.5, 7, 5]} />
            <meshStandardMaterial
              color="#334466"
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.5}
              emissive="#223344"
              emissiveIntensity={0.2}
            />
          </mesh>
        ));
      })}

      {/* Side windows — right */}
      {[0, 1, 2, 3, 4, 5].map((floorIdx) => {
        const y = 23 + floorIdx * 10;
        return Array.from({ length: 12 }).map((_, col) => (
          <mesh
            key={`win-right-${floorIdx}-${col}`}
            position={[41, y, -80 + col * 14]}
          >
            <boxGeometry args={[0.5, 7, 5]} />
            <meshStandardMaterial
              color="#334466"
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.5}
              emissive="#223344"
              emissiveIntensity={0.2}
            />
          </mesh>
        ));
      })}

      {/* Floor lines on tower */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={`floor-line-${i}`} position={[0, 20 + i * 10, 0]}>
          <boxGeometry args={[81, 0.3, 201]} />
          <meshStandardMaterial color="#1a1a28" />
        </mesh>
      ))}

      {/* Roof cap */}
      <mesh position={[0, 80.5, 0]} castShadow>
        <boxGeometry args={[84, 1, 204]} />
        <meshStandardMaterial color="#1e1e2e" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Roof equipment (mechanical penthouse) */}
      <mesh position={[0, 84, 0]} castShadow>
        <boxGeometry args={[30, 6, 40]} />
        <meshStandardMaterial color="#222233" />
      </mesh>
    </group>
  );
}
