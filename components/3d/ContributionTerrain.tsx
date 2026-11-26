"use client";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import { useMemo, useRef, useState, useCallback } from "react";
import * as THREE from "three";

interface ContributionTerrainProps {
  calendar: { date: string; count: number; weekday: number }[];
  username: string;
}

interface HoverData {
  date: string;
  count: number;
  position: THREE.Vector3;
}

function TerrainMesh({
  calendar,
  onHover,
}: {
  calendar: { date: string; count: number; weekday: number }[];
  onHover: (data: HoverData | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);

  // Organize calendar data into weeks grid
  const { weeks, maxCount } = useMemo(() => {
    const sorted = [...calendar].sort((a, b) => a.date.localeCompare(b.date));
    const maxCount = Math.max(...sorted.map((d) => d.count), 1);

    const weeks: { date: string; count: number }[][] = [];
    let currentWeek: { date: string; count: number }[] = [];

    const startDayOfWeek = sorted[0]?.weekday ?? 0;
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({ date: "", count: 0 });
    }

    for (const day of sorted) {
      currentWeek.push({ date: day.date, count: day.count });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push({ date: "", count: 0 });
      weeks.push(currentWeek);
    }

    return { weeks, maxCount };
  }, [calendar]);

  // Create smooth terrain geometry with higher subdivision
  const { geometry, wireframeGeometry } = useMemo(() => {
    const weekCount = weeks.length;

    // Higher subdivision for smoother surface (multiply segments)
    const subdivisionsPerWeek = 3;
    const subdivisionsPerDay = 3;
    const widthSegments = (weekCount - 1) * subdivisionsPerWeek;
    const heightSegments = 6 * subdivisionsPerDay;

    const width = weekCount * 0.3;
    const height = 2.1;

    const geo = new THREE.PlaneGeometry(
      width,
      height,
      widthSegments,
      heightSegments
    );
    const positionAttr = geo.attributes.position;

    // Helper function to get interpolated count at any position
    const getInterpolatedCount = (weekPos: number, dayPos: number): number => {
      const weekIndex = Math.floor(weekPos);
      const dayIndex = Math.floor(dayPos);
      const weekFrac = weekPos - weekIndex;
      const dayFrac = dayPos - dayIndex;

      const getCount = (w: number, d: number) => {
        if (w < 0 || w >= weeks.length || d < 0 || d > 6) return 0;
        return weeks[w]?.[d]?.count || 0;
      };

      // Bilinear interpolation
      const c00 = getCount(weekIndex, dayIndex);
      const c10 = getCount(weekIndex + 1, dayIndex);
      const c01 = getCount(weekIndex, dayIndex + 1);
      const c11 = getCount(weekIndex + 1, dayIndex + 1);

      const c0 = c00 * (1 - weekFrac) + c10 * weekFrac;
      const c1 = c01 * (1 - weekFrac) + c11 * weekFrac;

      return c0 * (1 - dayFrac) + c1 * dayFrac;
    };

    // Displace vertices with smooth interpolation
    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);

      const weekPos = ((x + width / 2) / width) * (weekCount - 1);
      const dayPos = ((y + height / 2) / height) * 6;

      const count = getInterpolatedCount(weekPos, dayPos);
      const displacement = (count / maxCount) * 1.5;

      positionAttr.setZ(i, displacement);
    }

    geo.computeVertexNormals();

    // Generate colors
    const colors = new Float32Array(positionAttr.count * 3);
    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);

      const weekPos = ((x + width / 2) / width) * (weekCount - 1);
      const dayPos = ((y + height / 2) / height) * 6;
      const count = getInterpolatedCount(weekPos, dayPos);

      const intensity = count / maxCount;
      const color = new THREE.Color();
      if (count < 0.5) {
        color.setHSL(0.08, 0.5, 0.08);
      } else {
        color.setHSL(0.1, 0.85, 0.25 + intensity * 0.35);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const colorAttr = new THREE.BufferAttribute(colors, 3);
    geo.setAttribute("color", colorAttr);

    // Create wireframe geometry
    const wireGeo = new THREE.WireframeGeometry(geo);

    return {
      geometry: geo,
      wireframeGeometry: wireGeo,
    };
  }, [weeks, maxCount]);

  // Handle click/hover on terrain to find nearest data point
  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!event.point) return;

      const weekCount = weeks.length;
      const width = weekCount * 0.3;
      const height = 2.1;

      // Transform point back to local coordinates
      const localPoint = event.point.clone();
      if (meshRef.current) {
        meshRef.current.worldToLocal(localPoint);
      }

      // Map to week/day indices
      const weekIndex = Math.round(
        ((localPoint.x + width / 2) / width) * (weekCount - 1)
      );
      const dayIndex = Math.round(((localPoint.y + height / 2) / height) * 6);

      if (
        weekIndex >= 0 &&
        weekIndex < weeks.length &&
        dayIndex >= 0 &&
        dayIndex <= 6
      ) {
        const dayData = weeks[weekIndex]?.[dayIndex];
        if (dayData && dayData.date) {
          onHover({
            date: dayData.date,
            count: dayData.count,
            position: event.point.clone(),
          });
          document.body.style.cursor = "pointer";
          return;
        }
      }

      onHover(null);
      document.body.style.cursor = "auto";
    },
    [weeks, onHover]
  );

  const handlePointerOut = useCallback(() => {
    onHover(null);
    document.body.style.cursor = "auto";
  }, [onHover]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
    if (wireframeRef.current) {
      wireframeRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
  });

  return (
    <group rotation={[-Math.PI / 2.5, 0, 0]} position={[0, 0, 0]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>
      <lineSegments ref={wireframeRef} geometry={wireframeGeometry}>
        <lineBasicMaterial color="#ffb000" opacity={0.08} transparent />
      </lineSegments>
    </group>
  );
}

function Tooltip({ data }: { data: HoverData | null }) {
  if (!data) return null;

  const formattedDate = new Date(data.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Html
      center
      position={[data.position.x, data.position.y + 0.8, data.position.z]}
      style={{ pointerEvents: "none" }}
    >
      <div className="px-3 py-2 bg-terminal-bg/95 border border-terminal rounded text-xs text-terminal whitespace-nowrap backdrop-blur-sm">
        <div className="font-bold">{formattedDate}</div>
        <div className="text-terminal/70">{data.count} contributions</div>
      </div>
    </Html>
  );
}

function Grid() {
  return (
    <gridHelper
      args={[20, 40, "#3d2800", "#1a1408"]}
      position={[0, -0.5, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

export function ContributionTerrain({
  calendar,
  username,
}: ContributionTerrainProps) {
  const [hoveredData, setHoveredData] = useState<HoverData | null>(null);

  if (!calendar || calendar.length === 0) return null;

  return (
    <div className="w-full h-80 bg-terminal-bg rounded-lg border border-terminal/20 overflow-hidden relative">
      <Canvas
        camera={{ position: [8, 6, 8], fov: 45 }}
        style={{ background: "#0a0806" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.8}
          color="#ffb000"
        />
        <pointLight position={[-5, 5, -5]} intensity={0.4} color="#cc8800" />

        <Stars
          radius={40}
          depth={50}
          count={400}
          factor={2}
          saturation={0}
          fade
          speed={0.2}
        />

        <TerrainMesh calendar={calendar} onHover={setHoveredData} />
        {hoveredData && <Tooltip data={hoveredData} />}
        <Grid />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>

      <div className="absolute top-3 left-3 text-terminal/60 text-xs uppercase tracking-wider">
        Terrain Map · @{username}
      </div>
      <div className="absolute bottom-2 left-2 text-xs text-terminal/70 pointer-events-none">
        Drag to rotate · Scroll to zoom · Hover for details
      </div>
    </div>
  );
}
