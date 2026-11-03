import { describe, expect, it, vi, afterEach } from 'vitest';
import { addItem, canPlace, DEFAULT_LAYOUT, footprint, loadLayout, moveItem, parseLayout, PRESETS, removeItem, resizeRoom, rotateItem, saveLayout } from './model';
import type { Layout } from './types';

const empty = (): Layout => ({ version: 1, name: 'Test room', room: { width: 4, depth: 4 }, items: [] });
afterEach(() => vi.unstubAllGlobals());

describe('layout geometry', () => {
  it('ships valid, distinct furnished room presets', () => {
    for (const preset of PRESETS) expect(parseLayout(preset.layout).error).toBeUndefined();
    expect(PRESETS[0].layout.items[0].kind).not.toBe(PRESETS[1].layout.items[0].kind);
  });
  it('swaps the footprint on quarter turns and blocks an out-of-bounds rotation', () => {
    const room = empty();
    room.items = [{ id: 'desk', kind: 'desk', x: 0, z: 1.5, rotation: 0 }];
    expect(footprint({ ...room.items[0], rotation: 90 })).toEqual({ width: 0.65, depth: 1.4 });
    expect(rotateItem(room, 'desk').error).toMatch(/wall/);
    expect(rotateItem(room, 'desk').layout).toBe(room);
    const centered = moveItem(room, 'desk', 0, 0).layout;
    let rotated = centered;
    for (let turn = 0; turn < 4; turn++) rotated = rotateItem(rotated, 'desk').layout;
    expect(rotated.items[0].rotation).toBe(0);
  });
  it('rejects collisions and outside moves without changing the prior room', () => {
    const room: Layout = { ...empty(), items: [
      { id: 'a', kind: 'chair', x: 0, z: 0, rotation: 0 },
      { id: 'b', kind: 'chair', x: 1, z: 0, rotation: 0 },
    ] };
    expect(moveItem(room, 'a', 1, 0).error).toMatch(/overlaps/);
    expect(moveItem(room, 'a', 1, 0).layout).toBe(room);
    expect(moveItem(room, 'a', 10, 0).error).toMatch(/wall/);
    expect(moveItem(room, 'a', NaN, 0).error).toBeTruthy();
    expect(canPlace(room, { ...room.items[0], x: 0.25 })).toBeNull();
    expect(moveItem(room, 'a', -0.62, 0).layout.items[0].x).toBe(-0.5);
  });
  it('finds a free grid location when adding and removes by id', () => {
    const first = addItem(empty(), 'sofa').layout;
    const second = addItem(first, 'sofa').layout;
    expect(second.items).toHaveLength(2);
    expect(canPlace(second, second.items[1])).toBeNull();
    expect(removeItem(second, first.items[0].id).items).toHaveLength(1);
    expect(first.items).toHaveLength(1);
  });
  it('refuses a shrinking room that would lose furniture', () => {
    expect(resizeRoom(DEFAULT_LAYOUT, 3, 3).layout).toBe(DEFAULT_LAYOUT);
    expect(resizeRoom(DEFAULT_LAYOUT, 3, 3).error).toMatch(/Nothing has been removed/);
    expect(resizeRoom(empty(), 8, 8).layout.room.width).toBe(8);
    for (const width of [NaN, 2, 11, 4.1]) expect(resizeRoom(empty(), width, 4).error).toBeTruthy();
  });
});

describe('untrusted import and storage', () => {
  it('rejects malformed, oversized, duplicate, non-finite, off-grid and overlapping data', () => {
    expect(parseLayout('{broken').error).toBeTruthy();
    const valid = JSON.parse(JSON.stringify(DEFAULT_LAYOUT)) as Layout;
    const mutations = [
      { ...valid, version: 2 },
      { ...valid, name: '<'.repeat(81) },
      { ...valid, room: { width: 20, depth: 5 } },
      { ...valid, items: [valid.items[0], valid.items[0]] },
      { ...valid, items: [{ ...valid.items[0], kind: '__proto__' }] },
      { ...valid, items: [{ ...valid.items[0], x: Infinity }] },
      { ...valid, items: [{ ...valid.items[0], x: 0.12 }] },
      { ...valid, items: [{ ...valid.items[0], rotation: 45 }] },
      { ...valid, items: [{ ...valid.items[0], z: 25 }] },
      { ...valid, items: Array.from({ length: 101 }, (_, index) => ({ ...valid.items[0], id: `item-${index}` })) },
      { ...valid, items: [valid.items[0], { ...valid.items[0], id: 'overlapping' }] },
    ];
    for (const data of mutations) expect(parseLayout(data).error).toBeTruthy();
  });
  it('sanitizes extra fields and returns an independent copy', () => {
    const imported = parseLayout({ ...DEFAULT_LAYOUT, unexpected: 'discard' }).layout;
    expect(imported).not.toHaveProperty('unexpected');
    imported.items[0].x = 100;
    expect(DEFAULT_LAYOUT.items[0].x).not.toBe(100);
  });
  it('round-trips saved furniture and handles denied or corrupt storage', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
    expect(saveLayout(DEFAULT_LAYOUT)).toBeNull();
    expect(loadLayout().layout).toEqual(DEFAULT_LAYOUT);
    store.set('room-remix-layout-v1', '{');
    expect(loadLayout().error).toBeTruthy();
    vi.stubGlobal('localStorage', { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } });
    expect(loadLayout().error).toMatch(/unavailable/);
    expect(saveLayout(DEFAULT_LAYOUT)).toMatch(/could not save/);
  });
});
