'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelectedBuildingId } from '@/lib/buildingStore';
import type { BuildingConfig, SensorConfig } from '@/lib/buildingSchema';
import { SensorType, SENSOR_COLORS, SENSOR_LABELS, SENSOR_UNITS, TelemetryPoint } from '@/types';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

function ChartGrid({ hvacData, elecData, waterData, secData }: {
  hvacData: TelemetryPoint[];
  elecData: TelemetryPoint[];
  waterData: TelemetryPoint[];
  secData: TelemetryPoint[];
}) {
  const mounted = useMounted();

  const chartCard = (title: string, chart: React.ReactNode) => (
    <div className="bg-[#111118] rounded-lg border border-gray-800 p-3 sm:p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>
      <div className="w-full h-48 sm:h-48">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            {chart as React.ReactElement}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {chartCard('Temperature (HVAC)',
        <LineChart data={hvacData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
          <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#333" tick={{ fontSize: 10, fill: '#555' }} interval="preserveStartEnd" />
          <YAxis stroke="#333" tick={{ fontSize: 10, fill: '#555' }} domain={['auto', 'auto']} />
          <Tooltip contentStyle={chartStyle} labelFormatter={(v) => new Date(v as string).toLocaleString()} />
          <Line type="monotone" dataKey="value" stroke={SENSOR_COLORS[SensorType.HVAC]} strokeWidth={2} dot={false} name="Temp °F" />
        </LineChart>
      )}
      {chartCard('Energy Consumption',
        <AreaChart data={elecData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
          <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#333" tick={{ fontSize: 10, fill: '#555' }} interval="preserveStartEnd" />
          <YAxis stroke="#333" tick={{ fontSize: 10, fill: '#555' }} />
          <Tooltip contentStyle={chartStyle} labelFormatter={(v) => new Date(v as string).toLocaleString()} />
          <Area type="monotone" dataKey="value" stroke={SENSOR_COLORS[SensorType.ELECTRICAL]} fill={SENSOR_COLORS[SensorType.ELECTRICAL]} fillOpacity={0.15} strokeWidth={2} name="kW" />
        </AreaChart>
      )}
      {chartCard('Water Usage',
        <BarChart data={waterData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
          <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#333" tick={{ fontSize: 10, fill: '#555' }} interval="preserveStartEnd" />
          <YAxis stroke="#333" tick={{ fontSize: 10, fill: '#555' }} />
          <Tooltip contentStyle={chartStyle} labelFormatter={(v) => new Date(v as string).toLocaleString()} />
          <Bar dataKey="value" fill={SENSOR_COLORS[SensorType.WATER]} fillOpacity={0.7} name="GPM" />
        </BarChart>
      )}
      {chartCard('Access Events (Security)',
        <LineChart data={secData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
          <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#333" tick={{ fontSize: 10, fill: '#555' }} interval="preserveStartEnd" />
          <YAxis stroke="#333" tick={{ fontSize: 10, fill: '#555' }} />
          <Tooltip contentStyle={chartStyle} labelFormatter={(v) => new Date(v as string).toLocaleString()} />
          <Line type="monotone" dataKey="value" stroke={SENSOR_COLORS[SensorType.SECURITY]} strokeWidth={2} dot={false} name="Events" />
        </LineChart>
      )}
    </div>
  );
}

// ── Sensor Drill-Down Panel ──────────────────────────────────────────────────

function SensorDrillDown({
  system,
  sensors,
  floors,
  selectedSensor,
  onSelectSensor,
  rangeMs,
}: {
  system: SensorType;
  sensors: SensorConfig[];
  floors: BuildingConfig['floors'];
  selectedSensor: SensorConfig | null;
  onSelectSensor: (s: SensorConfig | null) => void;
  rangeMs: number;
}) {
  const color = SENSOR_COLORS[system];

  // Group sensors by floor
  const sensorsByFloor = useMemo(() => {
    const map = new Map<string, { floorName: string; floorNum: number; sensors: SensorConfig[] }>();
    for (const floor of floors) {
      const floorSensors = sensors.filter((s) => {
        // Match by sensor id prefix or by position (floor Y range)
        return floor.sensors.some((fs) => fs.id === s.id);
      });
      if (floorSensors.length > 0) {
        map.set(floor.id, {
          floorName: floor.name,
          floorNum: floor.number,
          sensors: floorSensors,
        });
      }
    }
    return map;
  }, [sensors, floors]);

  return (
    <div className="mb-6 bg-[#111118] rounded-lg border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }} />
        <h2 className="text-sm font-semibold text-white">{SENSOR_LABELS[system]} Sensors</h2>
        <span className="text-xs text-gray-500">{sensors.length} total</span>
        {selectedSensor && (
          <button
            onClick={() => onSelectSensor(null)}
            className="ml-auto text-xs text-blue-400 hover:text-blue-300 min-h-[44px] px-3 flex items-center"
          >
            ← Back to list
          </button>
        )}
      </div>

      {/* Sensor list or detail view */}
      {!selectedSensor ? (
        <div className="divide-y divide-gray-800/50">
          {Array.from(sensorsByFloor.entries()).map(([floorId, { floorName, sensors: floorSensors }]) => (
            <div key={floorId}>
              <div className="px-4 py-2 bg-[#0d0d14]">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{floorName}</span>
              </div>
              {floorSensors.map((sensor) => (
                <button
                  key={sensor.id}
                  onClick={() => onSelectSensor(sensor)}
                  className="w-full flex items-center gap-3 px-4 py-3 min-h-[52px] hover:bg-[#16161f] active:bg-[#1a1a24] transition-colors text-left"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{sensor.name}</div>
                    <div className="text-[10px] text-gray-500">{sensor.unit} · Range: {sensor.min}–{sensor.max}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      sensor.status === 'normal' ? 'text-green-400 bg-green-400/10' :
                      sensor.status === 'warning' ? 'text-yellow-400 bg-yellow-400/10' :
                      'text-red-400 bg-red-400/10'
                    }`}>
                      {sensor.status}
                    </span>
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <SensorDetail sensor={selectedSensor} rangeMs={rangeMs} color={color} />
      )}
    </div>
  );
}

// ── Individual Sensor Detail View ────────────────────────────────────────────

function SensorDetail({
  sensor,
  rangeMs,
  color,
}: {
  sensor: SensorConfig;
  rangeMs: number;
  color: string;
}) {
  const mounted = useMounted();
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const to = new Date().toISOString();
    const from = new Date(Date.now() - rangeMs).toISOString();
    const interval = rangeMs > 86400000 ? 60 : rangeMs > 3600000 ? 30 : 5;

    fetch(`/api/telemetry?sensorId=${sensor.id}&from=${from}&to=${to}&interval=${interval}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setTelemetry(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sensor.id, rangeMs]);

  // Compute current value (latest point) and stats
  const stats = useMemo(() => {
    if (telemetry.length === 0) return null;
    const values = telemetry.map((p) => p.value);
    return {
      current: values[values.length - 1],
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }, [telemetry]);

  return (
    <div className="p-4">
      {/* Sensor info header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-base font-semibold text-white">{sensor.name}</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded self-start ${
          sensor.status === 'normal' ? 'text-green-400 bg-green-400/10' :
          sensor.status === 'warning' ? 'text-yellow-400 bg-yellow-400/10' :
          'text-red-400 bg-red-400/10'
        }`}>
          {sensor.status}
        </span>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Current', value: stats.current.toFixed(1) },
            { label: 'Min', value: stats.min.toFixed(1) },
            { label: 'Max', value: stats.max.toFixed(1) },
            { label: 'Avg', value: stats.avg.toFixed(1) },
          ].map((s) => (
            <div key={s.label} className="bg-[#0d0d14] rounded-lg p-2 sm:p-3 text-center">
              <div className="text-[10px] text-gray-500">{s.label}</div>
              <div className="text-sm sm:text-base font-bold text-white">{s.value}</div>
              <div className="text-[9px] text-gray-600">{sensor.unit}</div>
            </div>
          ))}
        </div>
      )}

      {/* Telemetry chart */}
      <div className="w-full h-56 sm:h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm animate-pulse">
            Loading telemetry...
          </div>
        ) : mounted && telemetry.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={telemetry}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                stroke="#333"
                tick={{ fontSize: 10, fill: '#555' }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#333"
                tick={{ fontSize: 10, fill: '#555' }}
                domain={[sensor.min, sensor.max]}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                labelFormatter={(v) => new Date(v as string).toLocaleString()}
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)} ${sensor.unit}`, sensor.name]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.15}
                strokeWidth={2}
                name={sensor.unit}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            No telemetry data available
          </div>
        )}
      </div>

      {/* Sensor metadata */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="bg-[#0d0d14] rounded p-2">
          <span className="text-gray-500">ID</span>
          <div className="text-gray-300 font-mono truncate">{sensor.id}</div>
        </div>
        <div className="bg-[#0d0d14] rounded p-2">
          <span className="text-gray-500">Unit</span>
          <div className="text-gray-300">{sensor.unit}</div>
        </div>
        <div className="bg-[#0d0d14] rounded p-2">
          <span className="text-gray-500">Range</span>
          <div className="text-gray-300">{sensor.min} – {sensor.max} {sensor.unit}</div>
        </div>
      </div>
    </div>
  );
}

const chartTooltipStyle = {
  backgroundColor: '#111118',
  border: '1px solid #333',
  borderRadius: 8,
  fontSize: 12,
};

const RANGES = [
  { label: '1h', ms: 3600000 },
  { label: '6h', ms: 21600000 },
  { label: '24h', ms: 86400000 },
  { label: '7d', ms: 604800000 },
  { label: '30d', ms: 2592000000 },
];

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
  const [selectedId] = useSelectedBuildingId();
  const [building, setBuilding] = useState<BuildingConfig | null>(null);

  const [selectedSystem, setSelectedSystem] = useState<SensorType | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<SensorConfig | null>(null);

  const [rangeIdx, setRangeIdx] = useState(2);
  const range = RANGES[rangeIdx];
  const [hvacData, setHvacData] = useState<TelemetryPoint[]>([]);
  const [elecData, setElecData] = useState<TelemetryPoint[]>([]);
  const [waterData, setWaterData] = useState<TelemetryPoint[]>([]);
  const [secData, setSecData] = useState<TelemetryPoint[]>([]);

  // Load building
  useEffect(() => {
    const id = selectedId || 'cascade-commons';
    fetch(`/api/buildings/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setBuilding)
      .catch(() => setBuilding(null));
  }, [selectedId]);

  const allSensors = useMemo(() =>
    building?.floors.flatMap((f) => f.sensors) || [], [building]);

  const totalSqft = useMemo(() =>
    building?.floors.reduce((s, f) => s + f.sqft, 0) || 0, [building]);

  const sensorsByType = useCallback((type: SensorType) =>
    allSensors.filter((s) => s.type === type), [allSensors]);

  const fetchData = useCallback(async () => {
    const to = new Date().toISOString();
    const from = new Date(Date.now() - range.ms).toISOString();
    const interval = range.ms > 86400000 ? 60 : range.ms > 3600000 ? 30 : 5;

    const hvacSensors = sensorsByType(SensorType.HVAC);
    const elecSensors = sensorsByType(SensorType.ELECTRICAL);
    const waterSensors = sensorsByType(SensorType.WATER);
    const secSensors = sensorsByType(SensorType.SECURITY);

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
  }, [range.ms, sensorsByType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const systemTypes = Object.values(SensorType);

  if (!building) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

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
      <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-none">
        <span className="text-xs text-gray-500 mr-2 flex-shrink-0">Time Range</span>
        {RANGES.map((r, i) => (
          <button
            key={r.label}
            onClick={() => setRangeIdx(i)}
            className={`px-3 py-2.5 min-h-[44px] rounded text-xs font-medium transition-colors flex-shrink-0 ${
              i === rangeIdx
                ? 'bg-blue-600 text-white'
                : 'bg-[#111118] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* System cards — tap to drill down */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {systemTypes.map((t) => {
          const sensors = sensorsByType(t);
          const isSelected = selectedSystem === t;
          return (
            <button
              key={t}
              onClick={() => {
                setSelectedSystem(isSelected ? null : t);
                setSelectedSensor(null);
              }}
              className={`bg-[#111118] rounded-lg border p-3 text-left transition-all min-h-[44px] ${
                isSelected
                  ? 'border-blue-500 ring-1 ring-blue-500/30'
                  : 'border-gray-800 hover:border-gray-600 active:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: SENSOR_COLORS[t] }} />
                <span className="text-xs font-medium text-gray-300">{SENSOR_LABELS[t]}</span>
                {isSelected && (
                  <svg className="w-3 h-3 text-blue-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
              <div className="text-lg font-bold text-white">{sensors.length}</div>
              <div className="text-[10px] text-green-400">● All Normal</div>
            </button>
          );
        })}
      </div>

      {/* Sensor drill-down panel */}
      {selectedSystem && (
        <SensorDrillDown
          system={selectedSystem}
          sensors={sensorsByType(selectedSystem)}
          floors={building.floors}
          selectedSensor={selectedSensor}
          onSelectSensor={setSelectedSensor}
          rangeMs={range.ms}
        />
      )}

      {/* Only show overview charts when no system is selected */}
      {!selectedSystem && (
        <ChartGrid hvacData={hvacData} elecData={elecData} waterData={waterData} secData={secData} />
      )}
    </div>
  );
}
