import type { CatalogEntry } from './types';

export const GRID = 0.25;
export const MIN_ROOM = 3;
export const MAX_ROOM = 10;
export const CATALOG: CatalogEntry[] = [
  { kind: 'sofa', name: 'Sunday sofa', subtitle: 'A softer place to land', width: 2, depth: 0.9, height: 0.85, color: '#b3c5a7', category: 'Living' },
  { kind: 'bed', name: 'Cloud bed', subtitle: 'For slower mornings', width: 1.6, depth: 2.1, height: 0.8, color: '#e5d7c7', category: 'Bedroom' },
  { kind: 'table', name: 'Pebble table', subtitle: 'A gathering of good things', width: 1.1, depth: 0.65, height: 0.45, color: '#b78760', category: 'Living' },
  { kind: 'chair', name: 'Arc lounge chair', subtitle: 'Your new favorite corner', width: 0.75, depth: 0.75, height: 0.88, color: '#c4aa8d', category: 'Living' },
  { kind: 'desk', name: 'Everyday desk', subtitle: 'Room for your next idea', width: 1.4, depth: 0.65, height: 0.76, color: '#c99f76', category: 'Workspace' },
  { kind: 'shelf', name: 'Little library', subtitle: 'Keep your stories close', width: 1.1, depth: 0.35, height: 1.65, color: '#c99f76', category: 'Workspace' },
  { kind: 'lamp', name: 'Halo floor lamp', subtitle: 'A warm kind of glow', width: 0.5, depth: 0.5, height: 1.6, color: '#e8d9b8', category: 'Finishing touches' },
  { kind: 'plant', name: 'Happy fiddle leaf', subtitle: 'A little life goes a long way', width: 0.6, depth: 0.6, height: 1.4, color: '#7c966c', category: 'Finishing touches' },
];
export const getEntry = (kind: string) => CATALOG.find(entry => entry.kind === kind)!;
