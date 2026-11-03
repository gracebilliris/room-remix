export type FurnitureKind = 'sofa' | 'bed' | 'table' | 'chair' | 'desk' | 'shelf' | 'lamp' | 'plant';
export type Rotation = 0 | 90 | 180 | 270;
export interface Room { width: number; depth: number }
export interface FurnitureItem {
  id: string;
  kind: FurnitureKind;
  x: number;
  z: number;
  rotation: Rotation;
}
export interface Layout {
  version: 1;
  name: string;
  room: Room;
  items: FurnitureItem[];
}
export interface CatalogEntry {
  kind: FurnitureKind;
  name: string;
  subtitle: string;
  width: number;
  depth: number;
  height: number;
  color: string;
  category: 'Living' | 'Bedroom' | 'Workspace' | 'Finishing touches';
}
export interface LayoutResult { layout: Layout; error?: string }
