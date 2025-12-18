"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Text } from "@react-three/drei";
import { useMemo } from "react";

interface GitSkylineProps {
  calendar: { date: string; count: number; weekday: number }[];
  username: string;
}

function ContributionBars({
  calendar,
}: {
  calendar: { date: string; count: number; weekday: number }[];
}) {
  const bars = useMemo(() => {
    const sorted = [...calendar].sort((a, b) => a.date.localeCompare(b.date));

    const weeks: number[][] = [];
    let currentWeek: number[] = [];

    const firstDate = new Date(sorted[0]?.date || "2025-01-01");
    const startDayOfWeek = firstDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(0);
    }

    for (const day of sorted) {
      currentWeek.push(day.count);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [calendar]);

  const maxCount = useMemo(() => {
    return Math.max(...calendar.map((d) => d.count), 1);
  }, [calendar]);

  const barWidth = 0.15;
  const barGap = 0.05;
  const weekGap = 0.1;

  return (
    <group position={[-(bars.length * (barWidth + weekGap)) / 2, 0, 0]}>
      {bars.map((week, weekIndex) =>
        week.map((count, dayIndex) => {
          if (count === 0) return null;
          const height = (count / maxCount) * 3;
          const intensity = Math.min(count / maxCount + 0.3, 1);

          return (
            <mesh
              key={`${weekIndex}-${dayIndex}`}
              position={[
                weekIndex * (barWidth + weekGap),
                height / 2,
                dayIndex * (barWidth + barGap),
              ]}
            >
              <boxGeometry args={[barWidth, height, barWidth]} />
              <meshStandardMaterial
                color={`hsl(120, 100%, ${30 + intensity * 30}%)`}
                emissive="#00ff00"
                emissiveIntensity={intensity * 0.3}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#0a0a0a" transparent opacity={0.8} />
    </mesh>
  );
}

export function GitSkyline({ calendar, username }: GitSkylineProps) {
  if (!calendar || calendar.length === 0) return null;

  return (
    <div className="w-full h-80 bg-[#050505] rounded-lg border border-[#00ff00]/20 overflow-hidden">
      <Canvas
        camera={{ position: [10, 8, 10], fov: 50 }}
        style={{ background: "#050505" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <pointLight position={[-10, 10, -10]} intensity={0.3} color="#00ff00" />

        <Stars
          radius={50}
          depth={50}
          count={1000}
          factor={2}
          saturation={0}
          fade
          speed={0.5}
        />

        <ContributionBars calendar={calendar} />
        <Ground />

        <Text
          position={[0, -0.5, 4]}
          fontSize={0.4}
          color="#00ff00"
          anchorX="center"
          anchorY="middle"
        >
          @{username} · 2025
        </Text>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={25}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>

      <div className="absolute bottom-2 left-2 text-xs text-[#00ff00]/40 pointer-events-none">
        🖱️ Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
