'use client';

import { useState, useEffect, useCallback } from 'react';
import { defaultBuilding } from '@/data/building';
import { SensorType, SENSOR_COLORS, SENSOR_LABELS, TelemetryPoint } from '@/types';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const RANGES = [
  { label: '1h', ms: 3600000 },
  { label: '6h', ms: 21600000 },
  { label: '24h', ms: 86400000 },
  { label: '7d', ms: 604800000 },
  { label: '30d', ms: 2592000000 },
];

const building = defaultBuilding;
const allSensors = building.floors.flatMap((f) => f.sensors);
const totalSqft = building.floors.reduce((s, f) => s + f.sqft, 0);

function sensorsByType(type: SensorType) {
  return allSensors.filter((s) => s.type === type);
}

const chartStyle = {
  backgroundColor: '#111118',
  border: '1px solid #333',
  borderRadius: 8,
  fontSize: 12,
};

function formatTime(v: string) {
  const d = new Date(v);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function Dashboard() {
  const [rangeIdx, setRangeIdx] = useState(2); // default 24h
  const range = RANGES[rangeIdx];
  const [hvacData, setHvacData] = useState<TelemetryPoint[]>([]);
  const [elecData, setElecData] = useState<TelemetryPoint[]>([]);
  const [waterData, setWaterData] = useState<TelemetryPoint[]>([]);
  const [secData, setSecData] = useState<TelemetryPoint[]>([]);

  const fetchData = useCallback(async () => {
    const to = new Date().toISOString();
    const from = new Date(Date.now() - range.ms).toISOString();
    const interval = range.ms > 86400000 ? 60 : range.ms > 3600000 ? 30 : 5;

    const hvacSensors = sensorsByType(SensorType.HVAC);
    const elecSensors = sensorsByType(SensorType.ELECTRICAL);
    const waterSensors = sensorsByType(SensorType.WATER);
    const secSensors = sensorsByType(SensorType.SECURITY);

    // Fetch one representative sensor per type
    const [h, e, w, s] = await Promise.all([
      hvacSensors[0] ? fetch(`/api/telemetry?sensorId=${hvacSensors[0].id}&from=${from}&to=${to}&interval=${interval}`).then(r => r.json()) : [],
      elecSensors[0] ? fetch(`/api/telemetry?sensorId=${elecSensors[0].id}&from=${from}&to=${to}&interval=${interval}`).then(r => r.json()) : [],
      waterSensors[0] ? fetch(`/api/telemetry?sensorId=${waterSensors[0].id}&from=${from}&to=${to}&interval=${interval}`).then(r => r.json()) : [],
      secSensors[0] ? fetch(`/api/telemetry?sensorId=${secSensors[0].id}&from=${from}&to=${to}&interval=${interval}`).then(r => r.json()) : [],
    ]);
    setHvacData(h);
    setElecData(e);
    setWaterData(w);
    setSecData(s);
  }, [range.ms]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const systemTypes = Object.values(SensorType);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto overflow-y-auto h-full" style={{ minHeight: 0 }}>
      {/* Building summary */}
      <div className="bg-[#111118] rounded-lg border border-gray-800 p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{building.name}</h1>
            <p className="text-sm text-gray-500">{building.address}</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <div className="text-gray-500 text-xs">Floors</div>
              <div className="text-white font-semibold">{building.floors.length}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Total Sqft</div>
              <div className="text-white font-semibold">{totalSqft.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Sensors</div>
              <div className="text-white font-semibold">{allSensors.length}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Systems</div>
              <div className="text-white font-semibold">{systemTypes.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Time range selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-gray-500 mr-2">Time Range</span>
        {RANGES.map((r, i) => (
          <button
            key={r.label}
            onClick={() => setRangeIdx(i)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              i === rangeIdx
                ? 'bg-blue-600 text-white'
                : 'bg-[#111118] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* System cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {systemTypes.map((t) => {
          const count = sensorsByType(t).length;
          return (
            <div
              key={t}
              className="bg-[#111118] rounded-lg border border-gray-800 p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: SENSOR_COLORS[t] }}
                />
                <span className="text-xs font-medium text-gray-300">
                  {SENSOR_LABELS[t]}
                </span>
              </div>
              <div className="text-lg font-bold text-white">{count}</div>
              <div className="text-[10px] text-green-400">● All Normal</div>
            </div>
          );
        })}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Temperature */}
        <div className="bg-[#111118] rounded-lg border border-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Temperature (HVAC)</h3>
          <div style={{ width: "100%", height: 192 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hvacData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#333" tick={{ fontSize: 10, fill: '#555' }} interval="preserveStartEnd" />
                <YAxis stroke="#333" tick={{ fontSize: 10, fill: '#555' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={chartStyle} labelFormatter={(v) => new Date(v as string).toLocaleString()} />
                <Line type="monotone" dataKey="value" stroke={SENSOR_COLORS[SensorType.HVAC]} strokeWidth={2} dot={false} name="Temp °F" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Energy */}
        <div className="bg-[#111118] rounded-lg border border-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Energy Consumption</h3>
          <div style={{ width: "100%", height: 192 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={elecData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#333" tick={{ fontSize: 10, fill: '#555' }} interval="preserveStartEnd" />
                <YAxis stroke="#333" tick={{ fontSize: 10, fill: '#555' }} />
                <Tooltip contentStyle={chartStyle} labelFormatter={(v) => new Date(v as string).toLocaleString()} />
                <Area type="monotone" dataKey="value" stroke={SENSOR_COLORS[SensorType.ELECTRICAL]} fill={SENSOR_COLORS[SensorType.ELECTRICAL]} fillOpacity={0.15} strokeWidth={2} name="kW" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Water */}
        <div className="bg-[#111118] rounded-lg border border-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Water Usage</h3>
          <div style={{ width: "100%", height: 192 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#333" tick={{ fontSize: 10, fill: '#555' }} interval="preserveStartEnd" />
                <YAxis stroke="#333" tick={{ fontSize: 10, fill: '#555' }} />
                <Tooltip contentStyle={chartStyle} labelFormatter={(v) => new Date(v as string).toLocaleString()} />
                <Bar dataKey="value" fill={SENSOR_COLORS[SensorType.WATER]} fillOpacity={0.7} name="GPM" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy (from security) */}
        <div className="bg-[#111118] rounded-lg border border-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Access Events (Security)</h3>
          <div style={{ width: "100%", height: 192 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={secData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#333" tick={{ fontSize: 10, fill: '#555' }} interval="preserveStartEnd" />
                <YAxis stroke="#333" tick={{ fontSize: 10, fill: '#555' }} />
                <Tooltip contentStyle={chartStyle} labelFormatter={(v) => new Date(v as string).toLocaleString()} />
                <Line type="monotone" dataKey="value" stroke={SENSOR_COLORS[SensorType.SECURITY]} strokeWidth={2} dot={false} name="Events" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

