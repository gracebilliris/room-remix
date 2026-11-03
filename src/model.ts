import { CATALOG, getEntry, GRID, MAX_ROOM, MIN_ROOM } from './catalog';
import type { FurnitureItem, FurnitureKind, Layout, LayoutResult, Rotation } from './types';

const STORAGE_KEY = 'room-remix-layout-v1';
const EPSILON = 0.00001;
const snap = (value: number) => Math.round(value / GRID) * GRID;
const copy = (layout: Layout): Layout => JSON.parse(JSON.stringify(layout));

export const PRESETS: { id: string; name: string; description: string; layout: Layout }[] = [
  {
    id: 'living', name: 'Sunday living', description: 'Slow afternoons. Good company.',
    layout: {
      version: 1, name: 'Sunday living', room: { width: 6, depth: 5 },
      items: [
        { id: 'living-sofa', kind: 'sofa', x: -0.75, z: -1.5, rotation: 0 },
        { id: 'living-table', kind: 'table', x: -0.75, z: 0, rotation: 0 },
        { id: 'living-chair', kind: 'chair', x: 1, z: 0.25, rotation: 270 },
        { id: 'living-shelf', kind: 'shelf', x: 1.5, z: -2, rotation: 0 },
        { id: 'living-plant', kind: 'plant', x: -2.25, z: -1.75, rotation: 0 },
        { id: 'living-lamp', kind: 'lamp', x: 0.5, z: -1.75, rotation: 0 },
      ],
    },
  },
  {
    id: 'bedroom', name: 'Slow mornings', description: 'A restful little retreat.',
    layout: {
      version: 1, name: 'Slow mornings', room: { width: 5, depth: 5 },
      items: [
        { id: 'bedroom-bed', kind: 'bed', x: -0.5, z: -0.75, rotation: 0 },
        { id: 'bedroom-desk', kind: 'desk', x: 1.75, z: -0.5, rotation: 90 },
        { id: 'bedroom-chair', kind: 'chair', x: 0.75, z: 1.25, rotation: 180 },
        { id: 'bedroom-lamp', kind: 'lamp', x: -1.75, z: -1.5, rotation: 0 },
        { id: 'bedroom-plant', kind: 'plant', x: 1.75, z: -1.75, rotation: 0 },
      ],
    },
  },
];
export const DEFAULT_LAYOUT = PRESETS[0].layout;

export function footprint(item: FurnitureItem) {
  const entry = getEntry(item.kind);
  return item.rotation === 90 || item.rotation === 270
    ? { width: entry.depth, depth: entry.width }
    : { width: entry.width, depth: entry.depth };
}

export function canPlace(layout: Layout, item: FurnitureItem): string | null {
  if (!CATALOG.some(entry => entry.kind === item.kind) ||
      ![item.x, item.z, item.rotation].every(Number.isFinite) ||
      ![0, 90, 180, 270].includes(item.rotation)) return 'That furniture position is not valid.';
  const box = footprint(item);
  if (Math.abs(item.x) + box.width / 2 > layout.room.width / 2 + EPSILON ||
      Math.abs(item.z) + box.depth / 2 > layout.room.depth / 2 + EPSILON) {
    return 'A little too close to the wall. Keep the whole piece inside the room.';
  }
  for (const other of layout.items) {
    if (other.id === item.id) continue;
    const otherBox = footprint(other);
    if (Math.abs(item.x - other.x) < (box.width + otherBox.width) / 2 - EPSILON &&
        Math.abs(item.z - other.z) < (box.depth + otherBox.depth) / 2 - EPSILON) {
      return `That spot overlaps the ${getEntry(other.kind).name.toLowerCase()}. Try a little more space.`;
    }
  }
  return null;
}

export function addItem(layout: Layout, kind: FurnitureKind): LayoutResult {
  if (layout.items.length >= 100) return { layout, error: 'This room has reached its 100-piece limit.' };
  if (!CATALOG.some(entry => entry.kind === kind)) return { layout, error: 'Choose a piece from the collection.' };
  const item: FurnitureItem = { id: crypto.randomUUID(), kind, x: 0, z: 0, rotation: 0 };
  const candidates: { x: number; z: number }[] = [];
  for (let x = -layout.room.width / 2; x <= layout.room.width / 2; x += GRID) {
    for (let z = -layout.room.depth / 2; z <= layout.room.depth / 2; z += GRID) candidates.push({ x: snap(x), z: snap(z) });
  }
  candidates.sort((a, b) => a.x ** 2 + a.z ** 2 - b.x ** 2 - b.z ** 2);
  for (const position of candidates) {
    const candidate = { ...item, ...position };
    if (!canPlace(layout, candidate)) return { layout: { ...layout, items: [...layout.items, candidate] } };
  }
  return { layout, error: 'No free spot for this piece. Move something, remove a piece, or make the room bigger.' };
}

export function moveItem(layout: Layout, id: string, x: number, z: number): LayoutResult {
  const item = layout.items.find(piece => piece.id === id);
  if (!item) return { layout, error: 'Select a piece to move.' };
  const candidate = { ...item, x: snap(x), z: snap(z) };
  const error = canPlace(layout, candidate);
  return error ? { layout, error } : { layout: { ...layout, items: layout.items.map(piece => piece.id === id ? candidate : piece) } };
}

export function rotateItem(layout: Layout, id: string): LayoutResult {
  const item = layout.items.find(piece => piece.id === id);
  if (!item) return { layout, error: 'Select a piece to rotate.' };
  const candidate = { ...item, rotation: ((item.rotation + 90) % 360) as Rotation };
  const error = canPlace(layout, candidate);
  return error ? { layout, error } : { layout: { ...layout, items: layout.items.map(piece => piece.id === id ? candidate : piece) } };
}

export function removeItem(layout: Layout, id: string): Layout {
  return { ...layout, items: layout.items.filter(piece => piece.id !== id) };
}

export function resizeRoom(layout: Layout, width: number, depth: number): LayoutResult {
  if (![width, depth].every(value => Number.isFinite(value) && value >= MIN_ROOM && value <= MAX_ROOM && Math.abs(snap(value) - value) < EPSILON)) {
    return { layout, error: 'Choose room dimensions from 3–10 m, in 0.25 m steps.' };
  }
  const resized = { ...layout, room: { width, depth } };
  if (layout.items.some(item => canPlace(resized, item))) {
    return { layout, error: 'Some furniture would be outside this smaller room. Move those pieces inward first. Nothing has been removed.' };
  }
  return { layout: resized };
}

export function parseLayout(input: unknown): LayoutResult {
  const fail = (): LayoutResult => ({ layout: copy(DEFAULT_LAYOUT), error: 'This layout is not valid. Use a Room Remix JSON export with non-overlapping furniture inside a 3–10 m room.' });
  try {
    const data = typeof input === 'string' ? JSON.parse(input) : input;
    if (!data || typeof data !== 'object' || data.version !== 1 || typeof data.name !== 'string' ||
        !data.name.trim() || data.name.length > 80 || !data.room ||
        !Array.isArray(data.items) || data.items.length > 100) return fail();
    const room = { width: data.room.width, depth: data.room.depth };
    if (![room.width, room.depth].every(value => typeof value === 'number' && Number.isFinite(value) && value >= MIN_ROOM && value <= MAX_ROOM && Math.abs(snap(value) - value) < EPSILON)) return fail();
    const ids = new Set<string>();
    const items: FurnitureItem[] = [];
    for (const item of data.items) {
      if (!item || typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(item.id) ||
          ids.has(item.id) || !CATALOG.some(entry => entry.kind === item.kind) ||
          ![item.x, item.z].every(value => typeof value === 'number' && Number.isFinite(value) && Math.abs(snap(value) - value) < EPSILON) ||
          ![0, 90, 180, 270].includes(item.rotation)) return fail();
      ids.add(item.id);
      items.push({ id: item.id, kind: item.kind, x: item.x, z: item.z, rotation: item.rotation });
    }
    const layout: Layout = { version: 1, name: data.name.trim(), room, items };
    if (items.some(item => canPlace(layout, item))) return fail();
    return { layout };
  } catch {
    return fail();
  }
}

export function loadLayout(): LayoutResult {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseLayout(stored) : { layout: copy(DEFAULT_LAYOUT) };
  } catch {
    return { layout: copy(DEFAULT_LAYOUT), error: 'Browser storage is unavailable. You can still design and export your room.' };
  }
}

export function saveLayout(layout: Layout): string | null {
  const checked = parseLayout(layout);
  if (checked.error) return checked.error;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked.layout));
    return null;
  } catch {
    return 'Your browser could not save this room. Export a JSON copy to keep your design.';
  }
}
