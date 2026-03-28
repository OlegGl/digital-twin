import { z } from 'zod';
import { SensorType } from '@/types';

// ─── Building Schema with Zod validation ─────────────────────────────────────

export const BuildingTypeEnum = z.enum(['commercial', 'mixed-use', 'residential', 'industrial']);
export type BuildingType = z.infer<typeof BuildingTypeEnum>;

export const FloorTypeEnum = z.enum([
  'commercial', 'residential', 'parking', 'mechanical', 'retail', 'office', 'lobby',
]);
export type FloorType = z.infer<typeof FloorTypeEnum>;

export const SensorTypeEnum = z.nativeEnum(SensorType);

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const SensorStatusEnum = z.enum(['normal', 'warning', 'alert']);

export const SensorConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: SensorTypeEnum,
  position: PositionSchema,
  unit: z.string(),
  min: z.number(),
  max: z.number(),
  status: SensorStatusEnum,
});
export type SensorConfig = z.infer<typeof SensorConfigSchema>;

export const FloorConfigSchema = z.object({
  id: z.string(),
  number: z.number(),
  name: z.string(),
  type: FloorTypeEnum,
  height: z.number().positive(),
  outline: z.array(z.tuple([z.number(), z.number()])).min(3),
  sqft: z.number().nonnegative(),
  sensors: z.array(SensorConfigSchema),
});
export type FloorConfig = z.infer<typeof FloorConfigSchema>;

export const MEPNodeTypeEnum = z.enum([
  'source', 'junction', 'panel', 'valve', 'meter', 'equipment', 'terminal', 'riser',
]);

export const SystemNodeConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  systemType: SensorTypeEnum,
  nodeType: MEPNodeTypeEnum,
  position: PositionSchema,
  floor: z.number(),
  description: z.string(),
  specs: z.record(z.string(), z.union([z.string(), z.number()])),
  status: SensorStatusEnum,
});
export type SystemNodeConfig = z.infer<typeof SystemNodeConfigSchema>;

export const SystemPipeConfigSchema = z.object({
  id: z.string(),
  systemType: SensorTypeEnum,
  fromNode: z.string(),
  toNode: z.string(),
  waypoints: z.array(z.tuple([z.number(), z.number(), z.number()])),
  diameter: z.number().positive(),
  label: z.string().optional(),
});
export type SystemPipeConfig = z.infer<typeof SystemPipeConfigSchema>;

export const SystemConfigSchema = z.object({
  type: SensorTypeEnum,
  nodes: z.array(SystemNodeConfigSchema),
  pipes: z.array(SystemPipeConfigSchema),
});
export type SystemConfig = z.infer<typeof SystemConfigSchema>;

export const DefaultViewSchema = z.object({
  cameraPosition: z.tuple([z.number(), z.number(), z.number()]),
  cameraTarget: z.tuple([z.number(), z.number(), z.number()]),
});

export const BuildingConfigSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'ID must be a lowercase slug'),
  name: z.string().min(1),
  address: z.string(),
  type: BuildingTypeEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
  defaultView: DefaultViewSchema,
  floors: z.array(FloorConfigSchema),
  systems: z.array(SystemConfigSchema),
});
export type BuildingConfig = z.infer<typeof BuildingConfigSchema>;

export const BuildingIndexEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  type: BuildingTypeEnum,
});
export type BuildingIndexEntry = z.infer<typeof BuildingIndexEntrySchema>;

export const BuildingIndexSchema = z.array(BuildingIndexEntrySchema);

// ─── Helper: generate unique ID ──────────────────────────────────────────────
export function generateId(prefix: string = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}-${rand}` : rand;
}

// ─── Helper: slugify a name ──────────────────────────────────────────────────
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Helper: default rectangle outline ───────────────────────────────────────
export function defaultRectOutline(width: number, depth: number): [number, number][] {
  const hw = width / 2;
  const hd = depth / 2;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]];
}

// ─── Helper: create empty building config ────────────────────────────────────
export function createEmptyBuilding(name: string, type: BuildingType = 'commercial'): BuildingConfig {
  const now = new Date().toISOString();
  return {
    id: slugify(name),
    name,
    address: '',
    type,
    createdAt: now,
    updatedAt: now,
    defaultView: {
      cameraPosition: [250, 150, 250],
      cameraTarget: [0, 40, 0],
    },
    floors: [
      {
        id: 'f1',
        number: 1,
        name: 'Ground Floor',
        type: 'commercial',
        height: 12,
        outline: defaultRectOutline(100, 100),
        sqft: 10000,
        sensors: [],
      },
    ],
    systems: [],
  };
}
