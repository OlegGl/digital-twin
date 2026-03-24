# Digital Twin — Commercial Real Estate

Interactive 3D digital twin for mixed-use commercial buildings. Built with Next.js, Three.js (React Three Fiber), and Recharts.

**Live Demo:** [digital-twin-chi-seven.vercel.app](https://digital-twin-chi-seven.vercel.app)

## Features

### 3D View (`/`)
- Interactive 3D building model with orbit controls (rotate, zoom, pan)
- 114 color-coded sensor cubes across 8 building systems
- Hover tooltips showing sensor name and system type
- Click any sensor to open the detail panel with 24h telemetry chart
- Building configurator panel showing floor details
- Responsive — works on desktop and mobile

### Dashboard (`/dashboard`)
- Building summary: 7 floors, 117,000 sqft, 114 sensors, 8 systems
- System cards with sensor counts and status indicators
- Time range selector: 1h, 6h, 24h, 7d, 30d
- 4 interactive charts:
  - **Temperature (HVAC)** — sinusoidal day/night pattern
  - **Energy Consumption** — commercial vs residential load profiles
  - **Water Usage** — bar chart with usage peaks
  - **Security Events** — access event patterns

### Building: Cascade Commons
A mixed-use building at 1200 Pacific Avenue, Seattle:
- **Floor 1:** Safeway grocery (45,000 sqft, 20ft ceilings) — 24 sensors
- **Floors 2–7:** Residential condos (12,000 sqft each, 10ft ceilings) — 15 sensors per floor

### Sensor Systems (8 types, 114 total)
| System | Color | Count | Unit |
|--------|-------|-------|------|
| HVAC | Cyan | 22 | °F |
| Electrical | Gold | 15 | kW |
| Fire Protection | Red | 30 | status |
| Plumbing/Water | Green | 8 | GPM |
| Elevators | Orange | 6 | % |
| Security | Purple | 15 | events |
| Lighting | Gray | 16 | lux |
| Gas | Brown | 2 | therms |

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React Three Fiber** + **@react-three/drei** (3D rendering)
- **Recharts** (data visualization)
- **Tailwind CSS v4** (styling)
- **TypeScript** (strict mode)

## Telemetry Generation

All sensor data is deterministic (seeded PRNG) — same sensor + same timestamp = same value. No database needed.

Patterns vary by sensor type:
- HVAC: sinusoidal temperature curve (cooler at night, warmer midday)
- Electrical: commercial loads follow store hours, residential peaks in evening
- Water: morning/evening residential spikes, steady commercial during hours
- Security: clustered at commute hours and shift changes
- Lighting: tracks daylight + occupancy
- Gas: bakery starts early, steady during store hours

## API

```
GET /api/telemetry?sensorId={id}&from={ISO}&to={ISO}&interval={minutes}
```

Returns `TelemetryPoint[]` — `{ timestamp, value, unit }`.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

```bash
npx vercel --prod
```
