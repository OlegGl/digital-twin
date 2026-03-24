'use client';

import { useRef } from 'react';
import * as THREE from 'three';

export default function BuildingModel() {
  const groupRef = useRef<THREE.Group>(null);

  // PNW mixed-use: concrete + timber + glass
  // Ground floor: Safeway podium — 150 x 20 x 300
  // Tower: 80 x 60 x 200, centered on podium, starting at y=20

  return (
    <group ref={groupRef}>
      {/* ── Ground Floor — Safeway Podium ── */}
      {/* Main structure: warm concrete */}
      <mesh position={[0, 10, 0]} castShadow receiveShadow>
        <boxGeometry args={[150, 20, 300]} />
        <meshStandardMaterial color="#8a8578" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Timber accent band around podium top */}
      <mesh position={[0, 20, 0]}>
        <boxGeometry args={[152, 1.5, 302]} />
        <meshStandardMaterial color="#6b4c30" metalness={0.05} roughness={0.85} />
      </mesh>

      {/* Glass storefront (front face) — large panels */}
      <mesh position={[0, 10, -151]}>
        <boxGeometry args={[146, 16, 1.5]} />
        <meshStandardMaterial
          color="#7cb8c9"
          metalness={0.6}
          roughness={0.15}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Storefront mullions (vertical dividers) */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={`mullion-${i}`} position={[-64 + i * 16, 10, -151.5]}>
          <boxGeometry args={[0.8, 16, 0.5]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.3} roughness={0.6} />
        </mesh>
      ))}

      {/* Safeway sign — timber-backed */}
      <mesh position={[0, 19.5, -152]}>
        <boxGeometry args={[50, 3, 1]} />
        <meshStandardMaterial color="#2d4a2d" emissive="#1a331a" emissiveIntensity={0.4} />
      </mesh>

      {/* Entry canopy — timber overhang */}
      <mesh position={[0, 18, -154]} castShadow>
        <boxGeometry args={[30, 0.8, 6]} />
        <meshStandardMaterial color="#5a3d25" metalness={0.05} roughness={0.8} />
      </mesh>

      {/* Canopy supports */}
      {[-12, 12].map((x) => (
        <mesh key={`canopy-${x}`} position={[x, 16, -154]}>
          <boxGeometry args={[0.6, 4, 0.6]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}

      {/* Side walls — exposed concrete with timber panels */}
      {[-76, 76].map((x) => (
        <mesh key={`side-timber-${x}`} position={[x, 10, 0]}>
          <boxGeometry args={[1, 14, 200]} />
          <meshStandardMaterial color="#6b4c30" metalness={0.05} roughness={0.85} />
        </mesh>
      ))}

      {/* ── Residential Tower ── */}
      {/* Main tower body: lighter warm concrete */}
      <mesh position={[0, 50, 0]} castShadow receiveShadow>
        <boxGeometry args={[80, 60, 200]} />
        <meshStandardMaterial color="#a09888" metalness={0.1} roughness={0.85} />
      </mesh>

      {/* Tower timber accent bands at each floor */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={`timber-band-${i}`} position={[0, 20.5 + i * 10, 0]}>
          <boxGeometry args={[81, 0.8, 201]} />
          <meshStandardMaterial color="#5a3d25" metalness={0.05} roughness={0.8} />
        </mesh>
      ))}

      {/* Window grid — front face: large PNW-style floor-to-ceiling glass */}
      {[0, 1, 2, 3, 4, 5].map((floorIdx) => {
        const y = 25 + floorIdx * 10;
        return Array.from({ length: 8 }).map((_, col) => (
          <mesh
            key={`win-front-${floorIdx}-${col}`}
            position={[-28 + col * 8, y, -101]}
          >
            <boxGeometry args={[6, 8, 0.5]} />
            <meshStandardMaterial
              color="#89b5c4"
              metalness={0.7}
              roughness={0.12}
              transparent
              opacity={0.5}
              emissive="#4a7a8a"
              emissiveIntensity={0.15}
            />
          </mesh>
        ));
      })}

      {/* Window grid — back face */}
      {[0, 1, 2, 3, 4, 5].map((floorIdx) => {
        const y = 25 + floorIdx * 10;
        return Array.from({ length: 8 }).map((_, col) => (
          <mesh
            key={`win-back-${floorIdx}-${col}`}
            position={[-28 + col * 8, y, 101]}
          >
            <boxGeometry args={[6, 8, 0.5]} />
            <meshStandardMaterial
              color="#89b5c4"
              metalness={0.7}
              roughness={0.12}
              transparent
              opacity={0.5}
              emissive="#4a7a8a"
              emissiveIntensity={0.15}
            />
          </mesh>
        ));
      })}

      {/* Side windows — left */}
      {[0, 1, 2, 3, 4, 5].map((floorIdx) => {
        const y = 25 + floorIdx * 10;
        return Array.from({ length: 12 }).map((_, col) => (
          <mesh
            key={`win-left-${floorIdx}-${col}`}
            position={[-41, y, -80 + col * 14]}
          >
            <boxGeometry args={[0.5, 8, 6]} />
            <meshStandardMaterial
              color="#89b5c4"
              metalness={0.7}
              roughness={0.12}
              transparent
              opacity={0.5}
              emissive="#4a7a8a"
              emissiveIntensity={0.15}
            />
          </mesh>
        ));
      })}

      {/* Side windows — right */}
      {[0, 1, 2, 3, 4, 5].map((floorIdx) => {
        const y = 25 + floorIdx * 10;
        return Array.from({ length: 12 }).map((_, col) => (
          <mesh
            key={`win-right-${floorIdx}-${col}`}
            position={[41, y, -80 + col * 14]}
          >
            <boxGeometry args={[0.5, 8, 6]} />
            <meshStandardMaterial
              color="#89b5c4"
              metalness={0.7}
              roughness={0.12}
              transparent
              opacity={0.5}
              emissive="#4a7a8a"
              emissiveIntensity={0.15}
            />
          </mesh>
        ));
      })}

      {/* Balcony ledges — PNW condos love outdoor space */}
      {[0, 2, 4].map((floorIdx) => {
        const y = 21.5 + floorIdx * 10;
        return (
          <mesh key={`balcony-front-${floorIdx}`} position={[0, y, -103]} castShadow>
            <boxGeometry args={[78, 0.5, 4]} />
            <meshStandardMaterial color="#7a7a72" metalness={0.15} roughness={0.8} />
          </mesh>
        );
      })}

      {/* Balcony glass railings */}
      {[0, 2, 4].map((floorIdx) => {
        const y = 22.5 + floorIdx * 10;
        return (
          <mesh key={`railing-front-${floorIdx}`} position={[0, y, -104.5]}>
            <boxGeometry args={[78, 3, 0.3]} />
            <meshStandardMaterial
              color="#aaccdd"
              metalness={0.5}
              roughness={0.2}
              transparent
              opacity={0.3}
            />
          </mesh>
        );
      })}

      {/* Roof cap — darker concrete with slight overhang */}
      <mesh position={[0, 80.5, 0]} castShadow>
        <boxGeometry args={[84, 1.2, 204]} />
        <meshStandardMaterial color="#6a6560" metalness={0.15} roughness={0.8} />
      </mesh>

      {/* Green roof accent (PNW sustainability) */}
      <mesh position={[25, 81.3, 30]}>
        <boxGeometry args={[30, 0.4, 50]} />
        <meshStandardMaterial color="#4a6b3a" roughness={0.95} />
      </mesh>
      <mesh position={[-20, 81.3, -20]}>
        <boxGeometry args={[20, 0.4, 30]} />
        <meshStandardMaterial color="#3d5e30" roughness={0.95} />
      </mesh>

      {/* Mechanical penthouse — smaller, cleaner */}
      <mesh position={[0, 84, 0]} castShadow>
        <boxGeometry args={[24, 5, 32]} />
        <meshStandardMaterial color="#787068" metalness={0.2} roughness={0.7} />
      </mesh>

      {/* Penthouse timber screen */}
      <mesh position={[0, 84, -17]}>
        <boxGeometry args={[26, 5.5, 0.5]} />
        <meshStandardMaterial color="#5a3d25" metalness={0.05} roughness={0.85} />
      </mesh>
    </group>
  );
}
