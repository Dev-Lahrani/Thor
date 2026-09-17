import React, { useRef, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { ThreatEvent } from '../types';
import { X, Globe as GlobeIcon, Maximize2, Minimize2 } from 'lucide-react';
import { CATEGORY_INFO } from '../utils/helpers';

// Extend THREE elements
extend({ Line_: THREE.Line });

interface Globe3DProps {
  events: ThreatEvent[];
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (event: ThreatEvent) => void;
}

// Convert lat/lon to 3D sphere coordinates
const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
};

// Rotating Earth component
const Earth: React.FC<{ autoRotate: boolean }> = ({ autoRotate }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2, 64, 64]}>
      <meshStandardMaterial
        color="#1a1a2e"
        roughness={0.8}
        metalness={0.2}
        wireframe={false}
      />
    </Sphere>
  );
};

// Grid lines on the globe
const GlobeGrid: React.FC = () => {
  const gridRef = useRef<THREE.Group>(null);

  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    const radius = 2.02;

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const points: [number, number, number][] = [];
      for (let lon = 0; lon <= 360; lon += 5) {
        const vec = latLonToVector3(lat, lon, radius);
        points.push([vec.x, vec.y, vec.z]);
      }
      lines.push(
        <Line key={`lat-${lat}`} points={points} color="#00f5ff" lineWidth={0.5} opacity={0.15} transparent />
      );
    }

    // Longitude lines
    for (let lon = 0; lon < 360; lon += 30) {
      const points: [number, number, number][] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        const vec = latLonToVector3(lat, lon, radius);
        points.push([vec.x, vec.y, vec.z]);
      }
      lines.push(
        <Line key={`lon-${lon}`} points={points} color="#00f5ff" lineWidth={0.5} opacity={0.15} transparent />
      );
    }

    return lines;
  }, []);

  return <group ref={gridRef}>{gridLines}</group>;
};

// Threat marker component
const ThreatMarker: React.FC<{
  event: ThreatEvent;
  onClick: () => void;
}> = ({ event, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const [lon, lat] = event.coordinates;
  const position = latLonToVector3(lat, lon, 2.1);

  const color = CATEGORY_INFO[event.category]?.color || '#ef4444';
  const size = event.severity === 'critical' ? 0.08 :
               event.severity === 'high' ? 0.065 :
               event.severity === 'medium' ? 0.05 : 0.04;

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.3 + 1;
      meshRef.current.scale.setScalar(hovered ? 1.5 : pulse);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1 : 0.5}
        />
      </mesh>
      {hovered && (
        <Html distanceFactor={10}>
          <div className="glass-darker px-3 py-2 rounded-lg text-xs whitespace-nowrap pointer-events-none">
            <div className="font-medium text-white">{event.title.slice(0, 30)}...</div>
            <div className="text-gray-400">{event.category}</div>
            {event.magnitudeLabel && (
              <div className="text-neon-cyan font-mono">{event.magnitudeLabel}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

// Main scene component
const GlobeScene: React.FC<{
  events: ThreatEvent[];
  onSelectEvent: (event: ThreatEvent) => void;
  autoRotate: boolean;
}> = ({ events, onSelectEvent, autoRotate }) => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#bf00ff" />

      <Earth autoRotate={autoRotate} />
      <GlobeGrid />

      {events.slice(0, 100).map((event) => (
        <ThreatMarker
          key={event.id}
          event={event}
          onClick={() => onSelectEvent(event)}
        />
      ))}

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
      />
    </>
  );
};

export const Globe3D: React.FC<Globe3DProps> = ({
  events,
  isOpen,
  onClose,
  onSelectEvent,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  if (!isOpen) return null;

  return (
    <div className={`fixed ${isFullscreen ? 'inset-0' : 'inset-4'} bg-black/90 flex flex-col z-50 ${isFullscreen ? '' : 'rounded-xl overflow-hidden'}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GlobeIcon className="w-5 h-5 text-neon-cyan" />
          <h2 className="text-lg font-bold text-white">3D Threat Globe</h2>
          <span className="text-xs text-gray-500">Showing {Math.min(events.length, 100)} signals</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
              className="rounded bg-white/10 border-white/20"
            />
            Auto-rotate
          </label>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <GlobeScene
            events={events}
            onSelectEvent={onSelectEvent}
            autoRotate={autoRotate}
          />
        </Canvas>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 glass-darker rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-2">Threat Categories</div>
          <div className="space-y-1">
            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <span className="text-gray-300">{info.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls hint */}
        <div className="absolute bottom-4 right-4 glass-darker rounded-lg p-3 text-xs text-gray-400">
          <div>Drag to rotate</div>
          <div>Scroll to zoom</div>
          <div>Click markers for details</div>
        </div>
      </div>
    </div>
  );
};
