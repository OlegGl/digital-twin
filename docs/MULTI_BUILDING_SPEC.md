# Multi-Building Management & Configuration Editor

## Overview
Transform the digital twin from a single hardcoded building into a multi-building platform with visual configuration tools. Buildings are stored as JSON files and can be created, edited, and switched between via the UI.

## Architecture

### Storage
- Buildings stored as individual JSON files in `public/buildings/` directory
- Index file: `public/buildings/index.json` — array of `{ id, name, address, type }` for the building picker
- Per-building file: `public/buildings/{id}.json` — full building config (floors, sensors, nodes, pipes)
- API routes for CRUD: `src/app/api/buildings/` (Next.js route handlers reading/writing JSON files)
- The existing Cascade Commons building should be migrated to this format as the default/demo building

### Schema (flexible — supports commercial, mixed-use, residential)

```typescript
// Building types
type BuildingType = 'commercial' | 'mixed-use' | 'residential' | 'industrial';
type FloorType = 'commercial' | 'residential' | 'parking' | 'mechanical' | 'retail' | 'office' | 'lobby';

interface BuildingConfig {
  id: string;                    // slug, used as filename
  name: string;
  address: string;
  type: BuildingType;
  createdAt: string;             // ISO date
  updatedAt: string;
  // Overall building dimensions (for 3D default view)
  defaultView: {
    cameraPosition: [number, number, number];
    cameraTarget: [number, number, number];
  };
  floors: FloorConfig[];
  systems: SystemConfig[];       // MEP system definitions
}

interface FloorConfig {
  id: string;
  number: number;                // 0 = ground, -1 = basement, etc.
  name: string;
  type: FloorType;
  height: number;                // ceiling height in feet
  // Floor shape as 2D polygon (x, z coordinates — y is computed from floor stacking)
  // This allows different shapes per floor (e.g., podium wider than tower)
  outline: [number, number][];   // closed polygon vertices [[x,z], [x,z], ...]
  sqft: number;                  // auto-calculated or manual override
  sensors: SensorConfig[];
}

interface SensorConfig {
  id: string;
  name: string;
  type: SensorType;              // reuse existing enum
  position: { x: number; y: number; z: number };  // relative to floor
  unit: string;
  min: number;
  max: number;
  status: 'normal' | 'warning' | 'alert';
}

interface SystemConfig {
  type: SensorType;
  nodes: SystemNodeConfig[];
  pipes: SystemPipeConfig[];
}

// SystemNodeConfig and SystemPipeConfig reuse existing types
```

## UI Components

### 1. Building Selector (top bar)
- Dropdown in the nav bar showing all buildings
- Current building highlighted
- "+ New Building" option at bottom of dropdown
- Click to switch — loads that building's JSON and updates 3D view + dashboard

### 2. Building Manager Page (`/buildings`)
- Card grid showing all buildings
- Each card: name, address, type badge, floor count, sensor count, thumbnail (optional later)
- Actions: Edit, Delete, Duplicate
- "Create New Building" prominent button

### 3. Building Creator/Editor (`/buildings/[id]/edit`)
A multi-step wizard or tabbed editor:

#### Tab 1: Basic Info
- Name, address, building type dropdown
- This is simple form fields

#### Tab 2: Floors
- List of floors (sortable by number)
- Add/remove floors
- Per floor: number, name, type, height
- **Floor Shape Editor**: 2D canvas where you draw the floor outline
  - Click to place vertices of the polygon
  - Drag vertices to adjust
  - Each floor starts with a default rectangle
  - Different floors can have different shapes (e.g., podium vs tower)
  - Grid/snap for precision
  - Shows dimensions (width x depth) as you draw

#### Tab 3: Systems & Sensors (the main editor)
- 2D top-down view of the selected floor
- Floor outline shown as background
- Floor selector on the side to switch between floors
- **System type palette** on the left (HVAC, Electrical, Water, Gas, Fire, etc.)
- **Press and hold** (or long-press) on the floor plan to place a sensor node
  - Opens a mini form: name, system type (pre-selected from palette), specs
  - Node appears as a colored dot matching system type
- **Draw lines** between nodes:
  - Click a node, then click another node to draw a pipe/conduit between them
  - System type inherited from source node (or selectable)
  - Line snaps to right angles (matching our axis-aligned routing)
- **Cross-floor connections**: 
  - Nodes near the same X,Z position on adjacent floors auto-suggest vertical risers
  - Or manually connect nodes across floors via a "Connect to floor" option

#### Tab 4: Preview
- Full 3D preview of the configured building (reuses existing BuildingScene)
- Toggle wireframe/MEP view
- Verify everything looks right before saving

### 4. Integration with Existing Views
- `page.tsx` (3D view) loads the selected building from JSON instead of hardcoded data
- `/dashboard` adapts to whichever building is selected
- Building selector persists selection in localStorage

## Implementation Notes

### File-based Storage (Phase 1)
- JSON files in `public/buildings/` — simple, works with Vercel
- API routes handle read/write via `fs` (works in dev, read-only on Vercel static)
- For Vercel deployment: buildings are bundled at build time; runtime editing needs a future DB

### 2D Floor Editor
- Use HTML5 Canvas or SVG for the floor plan editor
- No heavy dependencies — keep it vanilla canvas with React state
- Grid overlay with configurable scale (default: 1 unit = 1 foot)
- Pan and zoom with mouse wheel / drag

### Migration
- Convert existing `building.ts` and `mepSystems.ts` data into a `cascade-commons.json`
- Keep backward compat: if no building selected, load Cascade Commons as default

### Key Interactions
- **Place node**: Long press (500ms) on floor plan → opens node creation popover
- **Select node**: Single click → highlights, shows properties panel on right
- **Draw pipe**: Click node A → line follows cursor → click node B → pipe created
- **Delete**: Select node/pipe → Delete key or trash icon
- **Move node**: Drag an existing node to reposition

## File Structure (new/modified)

```
src/
├── app/
│   ├── buildings/
│   │   ├── page.tsx                    # Building manager (list all)
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx            # Building editor wizard
│   ├── api/
│   │   └── buildings/
│   │       ├── route.ts                # GET list, POST create
│   │       └── [id]/
│   │           └── route.ts            # GET one, PUT update, DELETE
│   └── page.tsx                        # Updated: loads selected building
├── components/
│   ├── buildings/
│   │   ├── BuildingCard.tsx            # Card for building list
│   │   ├── BuildingSelector.tsx        # Dropdown in nav
│   │   ├── BuildingInfoForm.tsx        # Tab 1: basic info
│   │   ├── FloorManager.tsx            # Tab 2: floor list + shape editor
│   │   ├── FloorShapeEditor.tsx        # 2D polygon drawing canvas
│   │   ├── SystemEditor.tsx            # Tab 3: node/pipe placement
│   │   ├── FloorPlanCanvas.tsx         # 2D canvas for sensor placement
│   │   └── BuildingPreview.tsx         # Tab 4: 3D preview
│   └── Nav.tsx                         # Updated: add building selector
├── lib/
│   ├── buildingSchema.ts              # TypeScript types + Zod validation
│   └── buildingStore.ts               # Client-side building state management
├── types/
│   └── index.ts                        # Updated with new types
public/
└── buildings/
    ├── index.json                      # Building index
    └── cascade-commons.json            # Migrated default building
```

## Priority Order
1. Schema + types + API routes + JSON storage
2. Building selector dropdown + manager page (list/create/delete)
3. Building info form (tab 1) + floor manager (tab 2) with shape editor
4. System editor (tab 3) — node placement + pipe drawing
5. Integration: 3D view loads from JSON, dashboard adapts
6. Preview tab
7. Cascade Commons migration to JSON format
