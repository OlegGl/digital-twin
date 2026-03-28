'use client';

import { useMemo } from 'react';
import { SystemNode, SENSOR_COLORS, SENSOR_LABELS, TelemetryPoint } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  node: SystemNode;
  onClose: () => void;
}

interface NodeMetric {
  label: string;
  value: string;
  unit: string;
  percent: number;
  status: 'good' | 'warn' | 'alert';
}

function computeMetrics(node: SystemNode): NodeMetric[] {
  const rng = seedRandom(node.id);
  const specs = node.specs;

  switch (node.systemType) {
    case 'ELECTRICAL': {
      const amps = Number(specs.amperage || 200);
      const loadPct = 45 + rng() * 35;
      const pf = 0.88 + rng() * 0.1;
      return [
        { label: 'Load', value: `${(amps * loadPct / 100).toFixed(0)}A`, unit: `of ${amps}A`, percent: loadPct, status: loadPct > 80 ? 'warn' : 'good' },
        { label: 'Demand', value: `${loadPct.toFixed(1)}%`, unit: 'capacity', percent: loadPct, status: loadPct > 80 ? 'warn' : 'good' },
        { label: 'Power Factor', value: pf.toFixed(2), unit: '', percent: pf * 100, status: pf < 0.9 ? 'warn' : 'good' },
        { label: 'Temperature', value: `${(85 + rng() * 30).toFixed(0)}°F`, unit: 'enclosure', percent: 60 + rng() * 25, status: 'good' },
      ];
    }
    case 'HVAC': {
      const cfm = Number(specs.cfm || 2500);
      const flowPct = 60 + rng() * 35;
      return [
        { label: 'Airflow', value: `${(cfm * flowPct / 100).toFixed(0)}`, unit: 'CFM', percent: flowPct, status: 'good' },
        { label: 'Supply Temp', value: `${(52 + rng() * 8).toFixed(1)}°F`, unit: '', percent: 45, status: 'good' },
        { label: 'Return Temp', value: `${(72 + rng() * 4).toFixed(1)}°F`, unit: '', percent: 70, status: 'good' },
        { label: 'Filter ΔP', value: `${(0.3 + rng() * 0.8).toFixed(2)}"`, unit: 'WC', percent: 30 + rng() * 40, status: rng() > 0.8 ? 'warn' : 'good' },
      ];
    }
    case 'WATER': {
      const pressure = Number(specs.pressure?.toString().replace(/[^\d.]/g, '') || 55);
      const flow = 5 + rng() * 25;
      return [
        { label: 'Flow Rate', value: flow.toFixed(1), unit: 'GPM', percent: flow / 50 * 100, status: 'good' },
        { label: 'Pressure', value: `${(pressure - 5 + rng() * 10).toFixed(0)}`, unit: 'PSI', percent: pressure / 80 * 100, status: 'good' },
        { label: 'Temperature', value: `${(55 + rng() * 10).toFixed(0)}°F`, unit: 'cold', percent: 40, status: 'good' },
        { label: 'Daily Usage', value: `${(200 + rng() * 500).toFixed(0)}`, unit: 'gallons', percent: 50 + rng() * 30, status: 'good' },
      ];
    }
    case 'GAS': {
      const load = Number(specs.load?.toString().replace(/[^\d.]/g, '') || 200);
      const usePct = 30 + rng() * 50;
      return [
        { label: 'Flow', value: `${(load * usePct / 100 / 100).toFixed(1)}`, unit: 'therms/hr', percent: usePct, status: 'good' },
        { label: 'Pressure', value: `${(6.5 + rng() * 1).toFixed(1)}"`, unit: 'WC', percent: 85, status: 'good' },
        { label: 'Demand', value: `${usePct.toFixed(0)}%`, unit: 'of capacity', percent: usePct, status: usePct > 85 ? 'warn' : 'good' },
        { label: 'Daily Usage', value: `${(5 + rng() * 15).toFixed(1)}`, unit: 'therms', percent: 40 + rng() * 30, status: 'good' },
      ];
    }
    default:
      return [];
  }
}

function seedRandom(str: string): () => number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  let s = Math.abs(h) | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateNodeTelemetry(nodeId: string, systemType: string): TelemetryPoint[] {
  const rng = seedRandom(nodeId);
  const points: TelemetryPoint[] = [];
  const now = Date.now();
  const interval = 30 * 60 * 1000;

  for (let i = 48; i >= 0; i--) {
    const ts = now - i * interval;
    const hour = new Date(ts).getHours();
    const noise = rng();
    let value: number;
    let unit: string;

    switch (systemType) {
      case 'ELECTRICAL':
        unit = 'kW';
        value = 30 + 20 * Math.sin(((hour - 6) / 24) * Math.PI * 2) + (noise - 0.5) * 15;
        break;
      case 'HVAC':
        unit = '°F';
        value = 70 + 4 * Math.sin(((hour - 6) / 24) * Math.PI * 2) + (noise - 0.5) * 3;
        break;
      case 'WATER':
        unit = 'GPM';
        value = 8 + 6 * Math.sin(((hour - 8) / 24) * Math.PI * 2) + noise * 5;
        break;
      case 'GAS':
        unit = 'therms';
        value = 2 + 3 * Math.sin(((hour - 6) / 24) * Math.PI * 2) + noise * 2;
        break;
      default:
        unit = '';
        value = noise * 100;
    }

    points.push({
      timestamp: new Date(ts).toISOString(),
      value: Math.max(0, Math.round(value * 10) / 10),
      unit,
    });
  }

  return points;
}

export default function SystemNodePanel({ node, onClose }: Props) {
  const color = SENSOR_COLORS[node.systemType];
  const metrics = useMemo(() => computeMetrics(node), [node]);
  const telemetry = useMemo(() => generateNodeTelemetry(node.id, node.systemType), [node.id, node.systemType]);
  const specEntries = Object.entries(node.specs);

  const content = (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            {SENSOR_LABELS[node.systemType]}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 uppercase">
            {node.nodeType}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <h2 className="text-lg font-semibold text-white mb-1">{node.name}</h2>
      <p className="text-sm text-gray-500 mb-1">
        Floor {node.floor === 8 ? 'Penthouse' : node.floor} · Status:{' '}
        <span className={node.status === 'normal' ? 'text-green-400' : node.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}>
          {node.status}
        </span>
      </p>
      <p className="text-xs text-gray-600 mb-4 leading-relaxed">{node.description}</p>

      {/* Live Metrics */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-medium">
          Live Performance
        </div>
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((m) => (
            <div key={m.label} className="bg-[#0a0a14] rounded-lg p-3 border border-gray-800">
              <div className="text-[10px] text-gray-500 mb-1">{m.label}</div>
              <div className="text-lg font-bold" style={{ color }}>
                {m.value}
                {m.unit && <span className="text-[10px] text-gray-500 ml-1">{m.unit}</span>}
              </div>
              <div className="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, m.percent)}%`,
                    backgroundColor: m.status === 'good' ? color : m.status === 'warn' ? '#eab308' : '#ef4444',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Telemetry Chart */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-medium">
          Last 24 Hours
        </div>
        <div className="h-40 bg-[#0a0a14] rounded-lg border border-gray-800 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={telemetry}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
                }}
                stroke="#333"
                tick={{ fontSize: 9, fill: '#555' }}
                interval="preserveStartEnd"
              />
              <YAxis stroke="#333" tick={{ fontSize: 9, fill: '#555' }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111118', border: '1px solid #333', borderRadius: 8, fontSize: 11 }}
                labelFormatter={(v) => new Date(v as string).toLocaleTimeString()}
                formatter={(val, _name, props) => {
                  const pt = props.payload as TelemetryPoint;
                  return [`${Number(val).toFixed(1)} ${pt.unit}`, node.name];
                }}
              />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: color }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Specifications */}
      {specEntries.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-medium">
            Specifications
          </div>
          <div className="bg-[#0a0a14] rounded-lg border border-gray-800 overflow-hidden">
            {specEntries.map(([key, value], i) => (
              <div
                key={key}
                className={`flex items-center justify-between px-3 py-2 ${i < specEntries.length - 1 ? 'border-b border-gray-800/50' : ''}`}
              >
                <span className="text-xs text-gray-500 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-xs text-gray-300 font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: side panel */}
      <div className="hidden sm:block absolute top-0 right-0 h-full w-full sm:w-[420px] bg-[#111118]/95 backdrop-blur-md border-l border-gray-800 z-30 overflow-y-auto">
        {content}
      </div>

      {/* Mobile: bottom sheet */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-30 bg-[#111118]/95 backdrop-blur-md border-t border-gray-800 rounded-t-xl max-h-[75vh] overflow-y-auto">
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>
        {content}
      </div>
    </>
  );
}
