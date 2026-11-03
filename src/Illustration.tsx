import type { FurnitureKind } from './types';

export default function Illustration({ kind, small = false }: { kind: FurnitureKind; small?: boolean }) {
  const wood = '#b58c64', pale = '#d7bd99', dark = '#8e7455';
  return <svg viewBox="0 0 160 110" fill="none" aria-hidden="true" className={small ? 'furniture-illustration small' : 'furniture-illustration'}>
    <ellipse cx="80" cy="94" rx="50" ry="9" fill="#6d694c" opacity=".08" />
    {kind === 'sofa' && <>
      <path d="M37 78v15m87-15v15" stroke={dark} strokeWidth="5" strokeLinecap="round" />
      <path d="m28 49 17-11 84 1 11 13v29l-18 10-94-16Z" fill="#9aaa8d" />
      <path d="M41 45q0-9 10-9h66q10 0 10 10v27H41Z" fill="#b3c3a3" />
      <path d="m40 65 18-9 64 6 7 11-18 12-73-9Z" fill="#c6d3b9" />
      <path d="M28 52q0-6 7-6l8 3q5 1 5 8v22l-20-4Zm94 3q0-6 6-7l7 2q6 1 6 7v24l-19 10Z" fill="#acbd9d" />
      <path d="m52 48 14 2 2 17-15-2Z" fill="#ece0c7" />
      <path d="m104 49 13 3-3 15-14-2Z" fill="#8f9e7c" />
    </>}
    {kind === 'chair' && <>
      <path d="m54 70-5 24m53-25 8 25m-41-34-4 23" stroke={dark} strokeWidth="5" strokeLinecap="round" />
      <path d="M47 36q35-25 69 3v29l-12 9-54-7Z" fill={wood} />
      <path d="M52 39q29-17 58 3v15q-31-13-58-1Z" fill="#e1cfb1" />
      <path d="m50 63 21-12 42 13-21 17-42-9Z" fill="#dfcfb1" />
      <path d="m48 48 2 23m65-20-3 24" stroke={dark} strokeWidth="5" strokeLinecap="round" />
      <path d="m45 51 18 5m38 3 19-8" stroke={wood} strokeWidth="7" strokeLinecap="round" />
    </>}
    {kind === 'table' && <>
      <path d="m48 65-5 27m68-31 6 28M82 61v25" stroke={dark} strokeWidth="6" strokeLinecap="round" />
      <path d="M34 59c0-15 64-29 92-10 33 25-35 45-74 29-11-4-18-11-18-19" fill={wood} />
      <ellipse cx="81" cy="59" rx="49" ry="20" transform="rotate(-8 81 59)" fill={pale} />
      <path d="m57 56 18-5 13 9-19 5Z" fill="#88957c" /><path d="m57 53 18-5 13 9-19 5Z" fill="#cbd3ba" />
      <path d="M100 49v9q5 6 10-1v-8" fill="#f3ead7" /><ellipse cx="105" cy="49" rx="5" ry="2" fill="#8a775a" />
    </>}
    {kind === 'bed' && <>
      <path d="M32 46v42m94-19v24" stroke={dark} strokeWidth="6" />
      <path d="m29 36 42-16 17 7v37L29 69Z" fill={wood} />
      <path d="m31 56 43-18 60 33-43 25-60-26Z" fill={wood} />
      <path d="m31 49 43-17 60 32-43 25-60-26Z" fill="#eee7d7" />
      <path d="m53 62 44-19 37 21-43 25-38-21Z" fill="#b1bfa1" />
      <path d="m45 44 14-6 14 7-13 8Zm20-8 12-5 14 8-12 6Z" fill="#fff9ee" />
      <path d="m78 76 43-21 8 5-43 23Z" fill="#cbb28e" />
    </>}
    {kind === 'desk' && <>
      <path d="M36 57v36m91-38v38M80 43v38" stroke={dark} strokeWidth="5" strokeLinecap="round" />
      <path d="m28 50 58-19 50 20-58 24-50-20Z" fill={wood} />
      <path d="m28 47 58-19 50 20-58 24Z" fill={pale} />
      <path d="m85 69 38-15v18L85 87Z" fill={wood} />
      <path d="m97 72 12-4" stroke={dark} strokeWidth="2" />
      <path d="m54 38 26 6 4 17-26-8Z" fill="#7b8879" />
      <path d="m56 40 22 5 3 12-22-6Z" fill="#bcd1c1" />
      <path d="m58 54 26 7 11-5-26-6Z" fill="#899483" />
    </>}
    {kind === 'shelf' && <>
      <path d="M44 21 55 18v75l-11 4Zm67-5 10 4v77l-10-4Z" fill={wood} />
      {[24, 48, 73, 92].map(y => <path key={y} d={`m45 ${y} 56-8 19 5-57 9-18-2Z`} fill={pale} />)}
      {[29, 53, 78].map((y, i) => <g key={y}><path d={`M61 ${y}v14m7-16v15m8-18v16m7-18v16`} stroke={['#8f9b7f', '#b5856d', '#a8ac90'][i]} strokeWidth="5" /><ellipse cx="102" cy={y + 6} rx="6" ry="8" fill="#e1d4b8" /></g>)}
    </>}
    {kind === 'lamp' && <>
      <ellipse cx="80" cy="94" rx="20" ry="5" fill="#a29473" />
      <path d="M80 41v52" stroke="#958564" strokeWidth="3" />
      <path d="m65 17-12 28q26 12 54 0L95 17Z" fill="#e4d3ad" />
      <ellipse cx="80" cy="17" rx="15" ry="4" fill="#f7ebd1" />
      <ellipse cx="80" cy="45" rx="27" ry="6" fill="#f0dfb8" />
    </>}
    {kind === 'plant' && <>
      <path d="m61 69 5 24q14 10 28-1l6-23" fill="#c4a381" /><ellipse cx="80" cy="69" rx="20" ry="6" fill="#b18c69" />
      <path d="M80 72V23m0 35L65 42m15 7 15-17m-15 8L69 25" stroke="#7d8157" strokeWidth="3" />
      {[[62, 39, -40], [96, 29, 35], [68, 23, -35], [90, 50, 45], [73, 56, -45], [80, 18, 5]].map(([x, y, angle], i) => <ellipse key={i} cx={x} cy={y} rx="8" ry="14" transform={`rotate(${angle} ${x} ${y})`} fill={i % 2 ? '#82936a' : '#6e865d'} />)}
    </>}
  </svg>;
}
