import { SensorType, TelemetryPoint, SENSOR_UNITS } from '@/types';

// Simple deterministic hash for seeding
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Seeded pseudo-random (mulberry32)
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hourOfDay(ts: number): number {
  return new Date(ts).getUTCHours();
}

export function generateTelemetry(
  sensorId: string,
  sensorType: SensorType,
  from: string,
  to: string,
  intervalMinutes: number = 15,
): TelemetryPoint[] {
  const fromTs = new Date(from).getTime();
  const toTs = new Date(to).getTime();
  const points: TelemetryPoint[] = [];
  const unit = SENSOR_UNITS[sensorType];
  const intervalMs = intervalMinutes * 60 * 1000;

  for (let ts = fromTs; ts <= toTs; ts += intervalMs) {
    const seed = hash(`${sensorId}-${ts}`);
    const rng = seededRandom(seed);
    const noise = rng();
    const hour = hourOfDay(ts);
    let value: number;

    switch (sensorType) {
      case SensorType.HVAC: {
        // Sinusoidal day/night: cooler at night (68), warmer midday (76)
        const base = 72 + 4 * Math.sin(((hour - 6) / 24) * Math.PI * 2);
        value = base + (noise - 0.5) * 3;
        value = Math.round(value * 10) / 10;
        break;
      }
      case SensorType.ELECTRICAL: {
        // Check if commercial (Safeway) based on sensor ID
        const isCommercial = sensorId.startsWith('s1-');
        if (isCommercial) {
          // Safeway: high 6am-11pm (~150-300kW), low overnight (~50kW)
          const open = hour >= 6 && hour <= 23;
          const base = open ? 200 + 80 * Math.sin(((hour - 6) / 17) * Math.PI) : 50;
          value = base + (noise - 0.5) * 30;
        } else {
          // Residential: evening peak 5-10pm (~15-30kW), low daytime (~3-8kW)
          const evening = hour >= 17 && hour <= 22;
          const base = evening ? 20 + 10 * Math.sin(((hour - 17) / 5) * Math.PI) : 5;
          value = base + (noise - 0.5) * 4;
        }
        value = Math.round(Math.max(0, value) * 10) / 10;
        break;
      }
      case SensorType.WATER: {
        const isCommercial = sensorId.startsWith('s1-');
        if (isCommercial) {
          const open = hour >= 6 && hour <= 23;
          value = open ? 8 + noise * 6 : 0.5 + noise * 1;
        } else {
          // Residential: morning 6-8am, evening 5-8pm spikes
          const morning = hour >= 6 && hour <= 8;
          const evening = hour >= 17 && hour <= 20;
          const base = morning ? 8 : evening ? 10 : 1;
          value = base + noise * 4;
        }
        value = Math.round(Math.max(0, value) * 10) / 10;
        break;
      }
      case SensorType.FIRE: {
        // Mostly 0, very rare test events
        value = noise > 0.995 ? 1 : 0;
        break;
      }
      case SensorType.ELEVATOR: {
        // Commute patterns: morning 7-9 up, evening 5-7 down, moderate midday
        const morning = hour >= 7 && hour <= 9;
        const evening = hour >= 17 && hour <= 19;
        const base = morning ? 70 : evening ? 65 : hour >= 10 && hour <= 16 ? 30 : 5;
        value = Math.round(Math.max(0, Math.min(100, base + (noise - 0.5) * 20)));
        break;
      }
      case SensorType.SECURITY: {
        // Access events clustered at commute hours and shift changes
        const morning = hour >= 7 && hour <= 9;
        const evening = hour >= 17 && hour <= 19;
        const shift = hour === 6 || hour === 14 || hour === 22;
        const base = morning ? 15 : evening ? 12 : shift ? 8 : 2;
        value = Math.round(Math.max(0, base + (noise - 0.5) * 6));
        break;
      }
      case SensorType.LIGHTING: {
        // Track daylight + occupancy: high during day (300-700), dim at night (10-50)
        const daytime = hour >= 7 && hour <= 19;
        const base = daytime ? 400 + 200 * Math.sin(((hour - 7) / 12) * Math.PI) : 20;
        value = Math.round(Math.max(0, base + (noise - 0.5) * 80));
        break;
      }
      case SensorType.GAS: {
        // Safeway hours: steady usage, low overnight
        const open = hour >= 5 && hour <= 23; // bakery starts early
        value = open ? 3 + noise * 4 : 0.2 + noise * 0.5;
        value = Math.round(Math.max(0, value) * 100) / 100;
        break;
      }
      default:
        value = noise * 100;
    }

    points.push({
      timestamp: new Date(ts).toISOString(),
      value,
      unit,
    });
  }

  return points;
}
