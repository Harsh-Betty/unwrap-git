"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import { useMemo, useRef, useState, useCallback } from "react";
import * as THREE from "three";

interface ContributionHelixProps {
  calendar: { date: string; count: number; weekday: number }[];
  username: string;
}

interface DayData {
  date: string;
  count: number;
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
}

function HelixSpheres({
  calendar,
  onHover,
}: {
  calendar: { date: string; count: number; weekday: number }[];
  onHover: (data: DayData | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const dayData = useMemo(() => {
    const sorted = [...calendar].sort((a, b) => a.date.localeCompare(b.date));
    const maxCount = Math.max(...sorted.map((d) => d.count), 1);
    const data: DayData[] = [];

    const totalDays = sorted.length;
    const helixHeight = 8;
    const helixRadius = 2;
    const turnsPerYear = 6;

    sorted.forEach((day, index) => {
      if (day.count === 0) return;

      const t = index / totalDays;
      const angle = t * Math.PI * 2 * turnsPerYear;
      const y = t * helixHeight - helixHeight / 2;

      // First strand
      const x1 = Math.cos(angle) * helixRadius;
      const z1 = Math.sin(angle) * helixRadius;

      const intensity = Math.min(day.count / maxCount + 0.3, 1);
      const color = new THREE.Color().setHSL(0.1, 0.9, 0.3 + intensity * 0.4);
      const size = 0.08 + (day.count / maxCount) * 0.12;

      data.push({
        date: day.date,
        count: day.count,
        position: new THREE.Vector3(x1, y, z1),
        color,
        size,
      });

      // Second strand (opposite side)
      const x2 = Math.cos(angle + Math.PI) * helixRadius;
      const z2 = Math.sin(angle + Math.PI) * helixRadius;

      data.push({
        date: day.date,
        count: day.count,
        position: new THREE.Vector3(x2, y, z2),
        color,
        size,
      });
    });

    return data;
  }, [calendar]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const handlePointerOver = useCallback(
    (index: number) => {
      setHovered(index);
      document.body.style.cursor = "pointer";
      onHover(dayData[index]);
    },
    [dayData, onHover]
  );

  const handlePointerOut = useCallback(() => {
    setHovered(null);
    document.body.style.cursor = "auto";
    onHover(null);
  }, [onHover]);

  return (
    <group ref={groupRef}>
      {dayData.map((data, index) => (
        <mesh
          key={index}
          position={data.position}
          onPointerOver={() => handlePointerOver(index)}
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry
            args={[hovered === index ? data.size * 1.5 : data.size, 16, 16]}
          />
          <meshStandardMaterial
            color={data.color}
            emissive={data.color}
            emissiveIntensity={hovered === index ? 0.8 : 0.3}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Connecting lines */}
      {dayData.length > 1 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array(
                  dayData.flatMap((d) => [
                    d.position.x,
                    d.position.y,
                    d.position.z,
                  ])
                ),
                3,
              ]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ffb000" opacity={0.15} transparent />
        </line>
      )}
    </group>
  );
}

function Tooltip({ data }: { data: DayData | null }) {
  if (!data) return null;

  const formattedDate = new Date(data.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Html
      center
      position={[data.position.x, data.position.y + 0.5, data.position.z]}
      style={{ pointerEvents: "none" }}
    >
      <div className="px-3 py-2 bg-terminal-bg/95 border border-terminal rounded text-xs text-terminal whitespace-nowrap backdrop-blur-sm">
        <div className="font-bold">{formattedDate}</div>
        <div className="text-terminal/70">{data.count} contributions</div>
      </div>
    </Html>
  );
}

export function ContributionHelix({
  calendar,
  username,
}: ContributionHelixProps) {
  const [hoveredData, setHoveredData] = useState<DayData | null>(null);

  if (!calendar || calendar.length === 0) return null;

  return (
    <div className="w-full h-80 bg-terminal-bg rounded-lg border border-terminal/20 overflow-hidden relative">
      <Canvas
        camera={{ position: [6, 4, 6], fov: 50 }}
        style={{ background: "#0a0806" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.6} color="#ffb000" />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.3}
          color="#cc8800"
        />

        <Stars
          radius={30}
          depth={50}
          count={500}
          factor={2}
          saturation={0}
          fade
          speed={0.3}
        />

        <HelixSpheres calendar={calendar} onHover={setHoveredData} />
        {hoveredData && <Tooltip data={hoveredData} />}

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={4}
          maxDistance={15}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>

      <div className="absolute top-3 left-3 text-terminal/60 text-xs uppercase tracking-wider">
        DNA Helix · @{username}
      </div>
      <div className="absolute bottom-2 left-2 text-xs text-terminal/40 pointer-events-none">
        Drag to rotate · Scroll to zoom · Hover for details
      </div>
    </div>
  );
}
