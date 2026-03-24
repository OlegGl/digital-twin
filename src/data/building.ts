import { Building, Floor, Sensor, SensorType, SENSOR_UNITS } from '@/types';

function makeSensor(
  id: string,
  name: string,
  type: SensorType,
  floorId: string,
  x: number,
  y: number,
  z: number,
  min: number,
  max: number,
): Sensor {
  return {
    id,
    name,
    type,
    floorId,
    position: { x, y, z },
    unit: SENSOR_UNITS[type],
    min,
    max,
    status: 'normal',
  };
}

// Ground floor: Safeway — 150x300 ft footprint, centered at origin, y=10 (midpoint of 20ft height)
// Tower: 80x200 ft, centered on podium, floors 2-7 each 10ft
// 3D scale: 1 unit = 1 ft

function safewayFloor(): Floor {
  const fid = 'f1';
  const y = 10; // midpoint of 20ft ground floor
  const sensors: Sensor[] = [
    // HVAC — 4 units spread across store
    makeSensor('s1-hvac-1', 'HVAC Zone A (Produce)', SensorType.HVAC, fid, -50, y, -100, 65, 78),
    makeSensor('s1-hvac-2', 'HVAC Zone B (Deli)', SensorType.HVAC, fid, 50, y, -100, 65, 78),
    makeSensor('s1-hvac-3', 'HVAC Zone C (Aisles)', SensorType.HVAC, fid, -30, y, 50, 65, 78),
    makeSensor('s1-hvac-4', 'HVAC Zone D (Bakery)', SensorType.HVAC, fid, 50, y, 80, 65, 78),
    // Electrical — 3 panels
    makeSensor('s1-elec-1', 'Main Electrical Panel', SensorType.ELECTRICAL, fid, -70, y, -140, 0, 400),
    makeSensor('s1-elec-2', 'Refrigeration Panel', SensorType.ELECTRICAL, fid, 60, y, -50, 0, 250),
    makeSensor('s1-elec-3', 'Lighting Panel', SensorType.ELECTRICAL, fid, 0, y, 130, 0, 100),
    // Fire — 6 detectors
    makeSensor('s1-fire-1', 'Smoke Detector Entrance', SensorType.FIRE, fid, 0, y + 8, -145, 0, 1),
    makeSensor('s1-fire-2', 'Smoke Detector Aisle 1', SensorType.FIRE, fid, -40, y + 8, -50, 0, 1),
    makeSensor('s1-fire-3', 'Smoke Detector Aisle 5', SensorType.FIRE, fid, 40, y + 8, -50, 0, 1),
    makeSensor('s1-fire-4', 'Sprinkler Zone A', SensorType.FIRE, fid, -50, y + 8, 50, 0, 1),
    makeSensor('s1-fire-5', 'Sprinkler Zone B', SensorType.FIRE, fid, 50, y + 8, 50, 0, 1),
    makeSensor('s1-fire-6', 'Fire Alarm Panel', SensorType.FIRE, fid, -70, y, -130, 0, 1),
    // Water — 2 meters
    makeSensor('s1-water-1', 'Main Water Meter', SensorType.WATER, fid, -70, y - 5, 0, 0, 50),
    makeSensor('s1-water-2', 'Hot Water Heater', SensorType.WATER, fid, 65, y - 5, 100, 0, 30),
    // Security — 3 points
    makeSensor('s1-sec-1', 'Main Entrance Access', SensorType.SECURITY, fid, 0, y, -148, 0, 100),
    makeSensor('s1-sec-2', 'Loading Dock Camera', SensorType.SECURITY, fid, 0, y, 148, 0, 100),
    makeSensor('s1-sec-3', 'Emergency Exit Sensor', SensorType.SECURITY, fid, -74, y, 0, 0, 100),
    // Lighting — 4 zones
    makeSensor('s1-light-1', 'Storefront Lighting', SensorType.LIGHTING, fid, 0, y + 8, -140, 0, 1000),
    makeSensor('s1-light-2', 'Aisle Lighting North', SensorType.LIGHTING, fid, -30, y + 8, -30, 0, 800),
    makeSensor('s1-light-3', 'Aisle Lighting South', SensorType.LIGHTING, fid, 30, y + 8, 60, 0, 800),
    makeSensor('s1-light-4', 'Back Office Lighting', SensorType.LIGHTING, fid, 60, y + 8, 130, 0, 600),
    // Gas — 2 meters (bakery + deli)
    makeSensor('s1-gas-1', 'Bakery Gas Meter', SensorType.GAS, fid, 50, y - 5, 90, 0, 10),
    makeSensor('s1-gas-2', 'Deli Gas Meter', SensorType.GAS, fid, 50, y - 5, -110, 0, 10),
  ];
  return {
    id: fid,
    number: 1,
    name: 'Safeway',
    type: 'commercial',
    sqft: 45000,
    height: 20,
    sensors,
  };
}

function condoFloor(floorNum: number): Floor {
  const fid = `f${floorNum}`;
  const yBase = 20 + (floorNum - 2) * 10; // stack on top of 20ft ground floor
  const y = yBase + 5; // midpoint of 10ft floor
  const sensors: Sensor[] = [
    // HVAC — 3
    makeSensor(`s${floorNum}-hvac-1`, `HVAC Unit ${floorNum}A`, SensorType.HVAC, fid, -25, y, -60, 65, 78),
    makeSensor(`s${floorNum}-hvac-2`, `HVAC Unit ${floorNum}B`, SensorType.HVAC, fid, 25, y, 0, 65, 78),
    makeSensor(`s${floorNum}-hvac-3`, `HVAC Unit ${floorNum}C`, SensorType.HVAC, fid, -10, y, 60, 65, 78),
    // Electrical — 2
    makeSensor(`s${floorNum}-elec-1`, `Electrical Panel ${floorNum}A`, SensorType.ELECTRICAL, fid, -38, y, -80, 0, 50),
    makeSensor(`s${floorNum}-elec-2`, `Electrical Panel ${floorNum}B`, SensorType.ELECTRICAL, fid, 38, y, 80, 0, 50),
    // Fire — 4
    makeSensor(`s${floorNum}-fire-1`, `Smoke Detector ${floorNum} Hall`, SensorType.FIRE, fid, 0, y + 3, -70, 0, 1),
    makeSensor(`s${floorNum}-fire-2`, `Smoke Detector ${floorNum} East`, SensorType.FIRE, fid, 30, y + 3, 30, 0, 1),
    makeSensor(`s${floorNum}-fire-3`, `Sprinkler ${floorNum} West`, SensorType.FIRE, fid, -30, y + 3, 30, 0, 1),
    makeSensor(`s${floorNum}-fire-4`, `Fire Alarm ${floorNum}`, SensorType.FIRE, fid, -38, y, -90, 0, 1),
    // Water — 1
    makeSensor(`s${floorNum}-water-1`, `Water Riser ${floorNum}`, SensorType.WATER, fid, 38, y - 3, -90, 0, 20),
    // Elevator — 1
    makeSensor(`s${floorNum}-elev-1`, `Elevator ${floorNum}`, SensorType.ELEVATOR, fid, 0, y, -90, 0, 100),
    // Security — 2
    makeSensor(`s${floorNum}-sec-1`, `Hallway Access ${floorNum}`, SensorType.SECURITY, fid, 0, y, -95, 0, 50),
    makeSensor(`s${floorNum}-sec-2`, `Stairwell ${floorNum}`, SensorType.SECURITY, fid, -38, y, 90, 0, 50),
    // Lighting — 2
    makeSensor(`s${floorNum}-light-1`, `Hallway Lights ${floorNum}`, SensorType.LIGHTING, fid, 0, y + 3, 0, 0, 500),
    makeSensor(`s${floorNum}-light-2`, `Common Area ${floorNum}`, SensorType.LIGHTING, fid, 20, y + 3, -50, 0, 500),
  ];
  return {
    id: fid,
    number: floorNum,
    name: `Residential Floor ${floorNum}`,
    type: 'residential',
    sqft: 12000,
    height: 10,
    sensors,
  };
}

export const defaultBuilding: Building = {
  id: 'cascade-commons',
  name: 'Cascade Commons',
  address: '1200 Pacific Avenue, Seattle, WA 98101',
  floors: [
    safewayFloor(),
    condoFloor(2),
    condoFloor(3),
    condoFloor(4),
    condoFloor(5),
    condoFloor(6),
    condoFloor(7),
  ],
};
