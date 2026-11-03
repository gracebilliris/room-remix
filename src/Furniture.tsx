import { RoundedBox } from '@react-three/drei';
import { DoubleSide } from 'three';
import type { FurnitureKind } from './types';

type Triple = [number, number, number];
const oak = '#ba906a';
const darkOak = '#8e6e50';

function Box({ size, at, color = oak, radius = 0.035, rotation }: { size: Triple; at: Triple; color?: string; radius?: number; rotation?: Triple }) {
  return <RoundedBox args={size} radius={Math.min(radius, ...size.map(value => value / 2.1))} smoothness={3} position={at} rotation={rotation} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={0.85} />
  </RoundedBox>;
}

function Leg({ x, z, height = 0.35, radius = 0.035 }: { x: number; z: number; height?: number; radius?: number }) {
  return <mesh position={[x, height / 2, z]} castShadow><cylinderGeometry args={[radius, radius * 0.8, height, 10]} /><meshStandardMaterial color={darkOak} /></mesh>;
}

function Legs({ width, depth, height }: { width: number; depth: number; height: number }) {
  return <>{[-1, 1].flatMap(x => [-1, 1].map(z => <Leg key={`${x}-${z}`} x={x * width / 2} z={z * depth / 2} height={height} />))}</>;
}

export default function Furniture({ kind }: { kind: FurnitureKind }) {
  if (kind === 'sofa') return <group>
    <Legs width={1.7} depth={0.6} height={0.22} />
    <Box size={[1.97, 0.24, 0.86]} at={[0, 0.29, 0]} color="#a8ba9d" radius={0.09} />
    <Box size={[1.9, 0.49, 0.17]} at={[0, 0.60, -0.35]} color="#b4c5a9" radius={0.07} />
    {[-1, 1].map(side => <group key={side}>
      <Box size={[0.2, 0.42, 0.85]} at={[side * 0.89, 0.51, 0]} color="#adbea2" radius={0.08} />
      <Box size={[0.76, 0.17, 0.65]} at={[side * 0.4, 0.46, 0.06]} color="#c0cfb7" radius={0.075} />
      <Box size={[0.7, 0.34, 0.12]} at={[side * 0.4, 0.66, -0.22]} color="#bdcdb4" radius={0.055} rotation={[-0.13, 0, 0]} />
    </group>)}
    <Box size={[0.27, 0.28, 0.12]} at={[-0.63, 0.67, -0.09]} color="#f0e5cf" rotation={[0, 0, -0.16]} radius={0.055} />
    <Box size={[0.26, 0.26, 0.12]} at={[0.62, 0.65, -0.08]} color="#a5ad87" rotation={[0, 0, 0.18]} radius={0.05} />
  </group>;
  if (kind === 'chair') return <group>
    <Legs width={0.49} depth={0.49} height={0.38} />
    <Box size={[0.65, 0.09, 0.62]} at={[0, 0.38, 0]} radius={0.07} />
    <Box size={[0.59, 0.13, 0.55]} at={[0, 0.48, 0.02]} color="#ded0b6" radius={0.08} />
    {Array.from({ length: 11 }, (_, i) => {
      const angle = (i / 10 - 0.5) * 2.45;
      return <Box key={i} size={[0.09, 0.34, 0.075]} at={[Math.sin(angle) * 0.33, 0.69, -Math.cos(angle) * 0.3]} rotation={[0, -angle, 0]} radius={0.02} />;
    })}
    {[-1, 1].map(side => <Box key={side} size={[0.075, 0.06, 0.47]} at={[side * 0.31, 0.69, 0.03]} radius={0.025} />)}
    <Box size={[0.42, 0.24, 0.1]} at={[0, 0.66, -0.19]} color="#ddd0b6" radius={0.04} />
  </group>;
  if (kind === 'table') return <group>
    <Legs width={0.71} depth={0.35} height={0.38} />
    <Box size={[1.1, 0.09, 0.65]} at={[0, 0.405, 0]} radius={0.19} color="#c49b72" />
    <Box size={[0.25, 0.035, 0.19]} at={[-0.22, 0.465, 0]} radius={0.004} color="#8f9c82" rotation={[0, 0.12, 0]} />
    <Box size={[0.24, 0.014, 0.18]} at={[-0.22, 0.487, 0]} radius={0.003} color="#f3eddd" rotation={[0, 0.12, 0]} />
    <mesh position={[0.22, 0.49, 0.02]} castShadow><cylinderGeometry args={[0.075, 0.055, 0.08, 24]} /><meshStandardMaterial color="#eee6d4" /></mesh>
  </group>;
  if (kind === 'bed') return <group>
    <Legs width={1.35} depth={1.8} height={0.23} />
    <Box size={[1.6, 0.22, 2.1]} at={[0, 0.28, 0]} radius={0.05} />
    <Box size={[1.56, 0.53, 0.1]} at={[0, 0.53, -1]} color="#c4aa8d" radius={0.06} />
    <Box size={[1.51, 0.21, 1.94]} at={[0, 0.47, 0.02]} color="#f2eddf" radius={0.08} />
    <Box size={[1.54, 0.10, 1.25]} at={[0, 0.58, 0.39]} color="#b9c3aa" radius={0.04} />
    <Box size={[1.55, 0.045, 0.32]} at={[0, 0.65, 0.69]} color="#d3bda1" radius={0.015} />
    {[-1, 1].map(side => <Box key={side} size={[0.58, 0.15, 0.4]} at={[side * 0.39, 0.63, -0.67]} radius={0.09} color="#fcf5e8" />)}
  </group>;
  if (kind === 'desk') return <group>
    <Legs width={1.18} depth={0.43} height={0.71} />
    <Box size={[1.4, 0.065, 0.65]} at={[0, 0.727, 0]} radius={0.025} color="#ceab84" />
    <Box size={[0.46, 0.17, 0.5]} at={[0.39, 0.61, 0]} radius={0.01} />
    <Box size={[0.1, 0.015, 0.012]} at={[0.39, 0.61, 0.26]} color="#766447" radius={0.005} />
    <Box size={[0.4, 0.025, 0.27]} at={[-0.17, 0.775, -0.02]} color="#7c887c" radius={0.005} />
    <Box size={[0.39, 0.25, 0.018]} at={[-0.17, 0.9, -0.14]} color="#758175" rotation={[-0.14, 0, 0]} radius={0.005} />
    <Box size={[0.35, 0.205, 0.01]} at={[-0.17, 0.9, -0.126]} color="#c5d6c6" rotation={[-0.14, 0, 0]} radius={0.005} />
  </group>;
  if (kind === 'shelf') return <group>
    {[-1, 1].map(side => <Box key={side} size={[0.06, 1.65, 0.35]} at={[side * 0.52, 0.825, 0]} radius={0.008} />)}
    {[0.1, 0.58, 1.08, 1.6].map(y => <Box key={y} size={[1.04, 0.055, 0.35]} at={[0, y, 0]} radius={0.008} />)}
    {[0.15, 0.63, 1.13].map((y, row) => <group key={y}>
      {[0, 1, 2, 3, 4].map(i => <Box key={i} size={[0.065, 0.23 + (i % 3) * 0.035, 0.19]} at={[-0.38 + i * 0.085, y + 0.15, 0.02]} color={['#9aa98e', '#e3d3b8', '#b57c62', '#c4b998', '#7b8a80'][(i + row) % 5]} radius={0.004} />)}
      <mesh position={[0.28, y + 0.105, 0]} castShadow><sphereGeometry args={[0.105, 16, 16]} /><meshStandardMaterial color={row === 1 ? '#c1ab89' : '#e8e0cd'} /></mesh>
    </group>)}
  </group>;
  if (kind === 'lamp') return <group>
    <mesh position={[0, 0.035, 0]} receiveShadow castShadow><cylinderGeometry args={[0.22, 0.24, 0.07, 32]} /><meshStandardMaterial color="#a59671" metalness={0.3} roughness={0.5} /></mesh>
    <mesh position={[0, 0.71, 0]} castShadow><cylinderGeometry args={[0.018, 0.018, 1.4, 12]} /><meshStandardMaterial color="#9d8c64" metalness={0.5} roughness={0.4} /></mesh>
    <mesh position={[0, 1.405, 0]} castShadow><cylinderGeometry args={[0.16, 0.25, 0.37, 32, 1, true]} /><meshStandardMaterial color="#f0e1be" side={DoubleSide} roughness={1} emissive="#e0c58f" emissiveIntensity={0.15} /></mesh>
    <mesh position={[0, 1.31, 0]}><sphereGeometry args={[0.055, 12, 12]} /><meshStandardMaterial color="#fff4cc" emissive="#ffe8b1" emissiveIntensity={0.8} /></mesh>
  </group>;
  return <group>
    <mesh position={[0, 0.2, 0]} castShadow receiveShadow><cylinderGeometry args={[0.21, 0.16, 0.39, 24]} /><meshStandardMaterial color="#d2b69a" roughness={1} /></mesh>
    <mesh position={[0, 0.39, 0]}><cylinderGeometry args={[0.185, 0.185, 0.01, 24]} /><meshStandardMaterial color="#675240" /></mesh>
    <mesh position={[0, 0.84, 0]} castShadow><cylinderGeometry args={[0.015, 0.026, 0.9, 10]} /><meshStandardMaterial color="#817655" /></mesh>
    {Array.from({ length: 9 }, (_, i) => {
      const angle = i * 2.4;
      const y = 0.62 + i * 0.077;
      return <mesh key={i} position={[Math.cos(angle) * 0.12, y, Math.sin(angle) * 0.12]} rotation={[0.3 * Math.cos(angle), angle, 0.4 * Math.sin(angle)]} scale={[0.12, 0.19, 0.045]} castShadow>
        <sphereGeometry args={[1, 12, 12]} /><meshStandardMaterial color={i % 2 ? '#82966c' : '#647f53'} roughness={0.9} />
      </mesh>;
    })}
  </group>;
}
