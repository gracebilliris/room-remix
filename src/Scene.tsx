import { Component, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Plane, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import Furniture from './Furniture';
import { canPlace, footprint } from './model';
import { GRID } from './catalog';
import type { FurnitureItem, Layout } from './types';

interface SceneProps {
  layout: Layout;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, z: number) => void;
  cameraMode: 'perspective' | 'top';
  cameraReset: number;
  showGrid: boolean;
  onReady?: () => void;
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="webgl-fallback"><strong>Your room needs WebGL.</strong><p>Enable hardware acceleration or try a current browser. You can still add, move, rotate, save, and export furniture using the panels.</p></div> : this.props.children;
  }
}

const floorPlane = new Plane(new Vector3(0, 1, 0), 0);

function Room({ width, depth, grid }: { width: number; depth: number; grid: boolean }) {
  return <group>
    <mesh position={[0, -0.1, 0]} receiveShadow castShadow><boxGeometry args={[width + 0.18, 0.2, depth + 0.18]} /><meshStandardMaterial color="#c8b499" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[width, depth]} /><meshStandardMaterial color="#d9c3a5" roughness={0.95} /></mesh>
    {Array.from({ length: Math.floor(depth / 0.3) }, (_, i) => <mesh key={`plank-${i}`} position={[0, 0.001, -depth / 2 + i * 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, 0.008]} /><meshStandardMaterial color="#bc9e7b" transparent opacity={0.28} depthWrite={false} />
    </mesh>)}
    {Array.from({ length: Math.floor(depth / 0.3) }, (_, i) => <group key={`grain-${i}`}>
      {[-1, 1].map((side, j) => <mesh key={side} position={[side * width / 4 + (i % 3) * 0.08, 0.002, -depth / 2 + i * 0.3 + 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.006, 0.29]} /><meshStandardMaterial color="#b79b7d" transparent opacity={0.18 + j * 0.02} depthWrite={false} />
      </mesh>)}
    </group>)}
    <mesh position={[0, 1.3, -depth / 2 - 0.06]} castShadow receiveShadow><boxGeometry args={[width + 0.18, 2.6, 0.12]} /><meshStandardMaterial color="#f2eee3" /></mesh>
    <mesh position={[-width / 2 - 0.06, 1.3, 0]} castShadow receiveShadow><boxGeometry args={[0.12, 2.6, depth]} /><meshStandardMaterial color="#e5e8dc" /></mesh>
    <mesh position={[0, 0.07, -depth / 2 + 0.012]}><boxGeometry args={[width, 0.14, 0.04]} /><meshStandardMaterial color="#fff8eb" /></mesh>
    <mesh position={[-width / 2 + 0.012, 0.07, 0]}><boxGeometry args={[0.04, 0.14, depth]} /><meshStandardMaterial color="#fff8eb" /></mesh>
    <group position={[-width / 2 + 0.02, 1.65, -0.15]}>
      <mesh><boxGeometry args={[0.045, 1.22, 1.44]} /><meshStandardMaterial color="#fffcf0" /></mesh>
      <mesh position={[0.029, 0, 0]}><boxGeometry args={[0.01, 1.08, 1.3]} /><meshStandardMaterial color="#c9ddd9" emissive="#d4e4dd" emissiveIntensity={0.14} /></mesh>
      <mesh position={[0.05, 0, 0]}><boxGeometry args={[0.04, 1.1, 0.035]} /><meshStandardMaterial color="#fff8e9" /></mesh>
      <mesh position={[0.05, 0, 0]}><boxGeometry args={[0.04, 0.035, 1.32]} /><meshStandardMaterial color="#fff8e9" /></mesh>
      <mesh position={[0.1, -0.62, 0]} castShadow><boxGeometry args={[0.22, 0.06, 1.5]} /><meshStandardMaterial color="#f9f2e3" /></mesh>
    </group>
    <group position={[-0.6, 1.65, -depth / 2 + 0.035]}>
      <mesh castShadow><boxGeometry args={[0.78, 0.96, 0.04]} /><meshStandardMaterial color="#b9946d" /></mesh>
      <mesh position={[0, 0, 0.025]}><planeGeometry args={[0.7, 0.88]} /><meshStandardMaterial color="#f4ead6" /></mesh>
      <mesh position={[0.08, 0.13, 0.03]}><circleGeometry args={[0.18, 40]} /><meshStandardMaterial color="#aab79c" /></mesh>
      <mesh position={[-0.1, -0.13, 0.033]}><circleGeometry args={[0.2, 40, 0, Math.PI]} /><meshStandardMaterial color="#c79578" /></mesh>
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.3, 0.006, 0.05]} receiveShadow>
      <planeGeometry args={[Math.min(3.2, width - 0.6), Math.min(2.4, depth - 0.6)]} /><meshStandardMaterial color="#e9e2d0" roughness={1} />
    </mesh>
    {grid && <group position={[0, 0.014, 0]}>
      {Array.from({ length: Math.floor(width / GRID) + 1 }, (_, i) => <mesh key={`x-${i}`} position={[-width / 2 + i * GRID, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.006, depth]} /><meshBasicMaterial color="#64775e" transparent opacity={0.2} depthWrite={false} />
      </mesh>)}
      {Array.from({ length: Math.floor(depth / GRID) + 1 }, (_, i) => <mesh key={`z-${i}`} position={[0, 0, -depth / 2 + i * GRID]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, 0.006]} /><meshBasicMaterial color="#64775e" transparent opacity={0.2} depthWrite={false} />
      </mesh>)}
    </group>}
  </group>;
}

function Content(props: SceneProps) {
  const { layout, selectedId, onSelect, onMove, cameraMode, cameraReset, showGrid } = props;
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();
  const [preview, setPreview] = useState<FurnitureItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ item: FurnitureItem; offset: Vector3; moved: boolean; candidate: FurnitureItem; target: { releasePointerCapture: (id: number) => void }; pointerId: number } | null>(null);
  const wasDragging = useRef(false);
  const maxSize = Math.max(layout.room.width, layout.room.depth);

  useEffect(() => {
    if (cameraMode === 'top') camera.position.set(0, maxSize * 1.9, 0.001);
    else camera.position.set(maxSize * 1.22, maxSize * 1.03, maxSize * 1.38);
    camera.lookAt(0, 0, 0);
    controls.current?.target.set(0, 0.4, 0);
    controls.current?.update();
  }, [camera, cameraMode, cameraReset, maxSize]);

  const { onReady } = props;
  useEffect(() => { onReady?.(); }, [onReady]);

  useEffect(() => {
    const canvas = gl.domElement;
    const cancel = () => {
      drag.current = null;
      setDragging(false);
      setPreview(null);
      if (controls.current) controls.current.enabled = true;
    };
    canvas.addEventListener('pointercancel', cancel);
    canvas.addEventListener('lostpointercapture', cancel);
    window.addEventListener('blur', cancel);
    return () => {
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('lostpointercapture', cancel);
      window.removeEventListener('blur', cancel);
    };
  }, [gl]);

  function start(event: ThreeEvent<PointerEvent>, item: FurnitureItem) {
    if (event.button !== 0 || drag.current || event.nativeEvent.isPrimary === false) return;
    event.stopPropagation();
    onSelect(item.id);
    const point = event.ray.intersectPlane(floorPlane, new Vector3());
    if (!point) return;
    const target = event.target as unknown as { setPointerCapture: (id: number) => void; releasePointerCapture: (id: number) => void };
    target.setPointerCapture(event.pointerId);
    drag.current = { item, offset: point.sub(new Vector3(item.x, 0, item.z)), moved: false, candidate: item, target, pointerId: event.pointerId };
    wasDragging.current = true;
    if (controls.current) controls.current.enabled = false;
    setDragging(true);
  }
  function move(event: ThreeEvent<PointerEvent>) {
    if (!drag.current) return;
    event.stopPropagation();
    const point = event.ray.intersectPlane(floorPlane, new Vector3());
    if (!point) return;
    const { item, offset } = drag.current;
    const candidate = { ...item, x: Math.round((point.x - offset.x) / GRID) * GRID, z: Math.round((point.z - offset.z) / GRID) * GRID };
    drag.current.moved = drag.current.moved || candidate.x !== item.x || candidate.z !== item.z;
    drag.current.candidate = candidate;
    setPreview(candidate);
  }
  function finish(event: ThreeEvent<PointerEvent>) {
    const current = drag.current;
    if (!current) return;
    event.stopPropagation();
    drag.current = null;
    current.target.releasePointerCapture(current.pointerId);
    if (current.moved) onMove(current.item.id, current.candidate.x, current.candidate.z);
    setPreview(null);
    setDragging(false);
    if (controls.current) controls.current.enabled = true;
    window.setTimeout(() => { wasDragging.current = false; }, 0);
  }

  return <>
    <color attach="background" args={['#eeeee8']} />
    <ambientLight intensity={1.35} />
    <hemisphereLight args={['#fff9e9', '#b3b7a0', 1]} />
    <directionalLight position={[2, 7, 5]} intensity={3} color="#fff4dd" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0004} shadow-normalBias={0.025} />
    <directionalLight position={[-4, 4, -1]} intensity={0.8} color="#e8f4ec" />
    <Room width={layout.room.width} depth={layout.room.depth} grid={showGrid} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} onClick={event => { if (!wasDragging.current && !dragging) { event.stopPropagation(); onSelect(null); } }}>
      <planeGeometry args={[50, 50]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
    {layout.items.map(original => {
      const item = preview?.id === original.id ? preview : original;
      const selected = original.id === selectedId;
      const invalid = preview?.id === original.id && !!canPlace(layout, preview);
      const box = footprint(item);
      return <group key={item.id} position={[item.x, 0, item.z]}
        onPointerDown={event => start(event, original)} onPointerMove={move} onPointerUp={finish}
        onPointerOver={event => { event.stopPropagation(); gl.domElement.style.cursor = dragging ? 'grabbing' : 'grab'; }}
        onPointerOut={() => { gl.domElement.style.cursor = 'default'; }}>
        <group rotation={[0, item.rotation * Math.PI / 180, 0]}><Furniture kind={item.kind} /></group>
        {selected && <group position={[0, 0.024, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[box.width + 0.12, box.depth + 0.12]} /><meshBasicMaterial color={invalid ? '#cf6f5c' : '#729a78'} transparent opacity={0.19} depthWrite={false} /></mesh>
          {[-1, 1].flatMap(side => [
            <mesh key={`x${side}`} position={[side * (box.width + 0.12) / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.018, box.depth + 0.14]} /><meshBasicMaterial color={invalid ? '#b54e3b' : '#648467'} /></mesh>,
            <mesh key={`z${side}`} position={[0, 0, side * (box.depth + 0.12) / 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[box.width + 0.14, 0.018]} /><meshBasicMaterial color={invalid ? '#b54e3b' : '#648467'} /></mesh>,
          ])}
        </group>}
      </group>;
    })}
    <OrbitControls ref={controls} makeDefault enabled={!dragging} enableDamping dampingFactor={0.12}
      enableRotate={cameraMode !== 'top'} minPolarAngle={0} maxPolarAngle={Math.PI / 2.1}
      minDistance={3} maxDistance={32} />
  </>;
}

export default function Scene(props: SceneProps) {
  return <SceneBoundary><Canvas shadows dpr={[1, 1.75]} camera={{ position: [8, 7, 9], fov: 40, near: 0.1, far: 100 }}
    gl={{ antialias: true, preserveDrawingBuffer: true }} style={{ touchAction: 'none' }}
    aria-label="Interactive 3D room. Select and drag furniture, or use the accessible furniture list and position controls.">
    <Content {...props} />
  </Canvas></SceneBoundary>;
}
