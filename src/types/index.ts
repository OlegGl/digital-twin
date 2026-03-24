export enum SensorType {
  HVAC = 'HVAC',
  ELECTRICAL = 'ELECTRICAL',
  FIRE = 'FIRE',
  WATER = 'WATER',
  ELEVATOR = 'ELEVATOR',
  SECURITY = 'SECURITY',
  LIGHTING = 'LIGHTING',
  GAS = 'GAS',
}

export const SENSOR_COLORS: Record<SensorType, string> = {
  [SensorType.HVAC]: '#00BFFF',
  [SensorType.ELECTRICAL]: '#FFD700',
  [SensorType.FIRE]: '#FF4444',
  [SensorType.WATER]: '#44BB44',
  [SensorType.ELEVATOR]: '#FF8C00',
  [SensorType.SECURITY]: '#9944FF',
  [SensorType.LIGHTING]: '#CCCCCC',
  [SensorType.GAS]: '#8B4513',
};

export const SENSOR_LABELS: Record<SensorType, string> = {
  [SensorType.HVAC]: 'HVAC',
  [SensorType.ELECTRICAL]: 'Electrical',
  [SensorType.FIRE]: 'Fire Protection',
  [SensorType.WATER]: 'Plumbing / Water',
  [SensorType.ELEVATOR]: 'Elevators',
  [SensorType.SECURITY]: 'Security',
  [SensorType.LIGHTING]: 'Lighting',
  [SensorType.GAS]: 'Gas',
};

export const SENSOR_UNITS: Record<SensorType, string> = {
  [SensorType.HVAC]: '°F',
  [SensorType.ELECTRICAL]: 'kW',
  [SensorType.FIRE]: 'status',
  [SensorType.WATER]: 'GPM',
  [SensorType.ELEVATOR]: '%',
  [SensorType.SECURITY]: 'events',
  [SensorType.LIGHTING]: 'lux',
  [SensorType.GAS]: 'therms',
};

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  floorId: string;
  position: Position;
  unit: string;
  min: number;
  max: number;
  status: 'normal' | 'warning' | 'alert';
}

export interface Floor {
  id: string;
  number: number;
  name: string;
  type: 'commercial' | 'residential';
  sqft: number;
  height: number;
  sensors: Sensor[];
}

export interface Building {
  id: string;
  name: string;
  address: string;
  floors: Floor[];
}

export interface TelemetryPoint {
  timestamp: string;
  value: number;
  unit: string;
}
