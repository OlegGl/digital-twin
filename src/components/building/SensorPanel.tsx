'use client';

import { useEffect, useState } from 'react';
import { Sensor, TelemetryPoint, SENSOR_COLORS, SENSOR_LABELS } from '@/types';
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
  sensor: Sensor;
  onClose: () => void;
}

export default function SensorPanel({ sensor, onClose }: Props) {
  const [data, setData] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const color = SENSOR_COLORS[sensor.type];

  useEffect(() => {
    setLoading(true);
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    fetch(`/api/telemetry?sensorId=${sensor.id}&from=${from}&to=${to}&interval=30`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sensor.id]);

  const currentValue = data.length > 0 ? data[data.length - 1].value : '--';

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-[#111118]/95 backdrop-blur-md border-l border-gray-800 z-30 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              {SENSOR_LABELS[sensor.type]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <h2 className="text-lg font-semibold text-white mb-1">{sensor.name}</h2>
        <p className="text-sm text-gray-500 mb-4">
          Floor {sensor.floorId.replace('f', '')} · Status:{' '}
          <span
            className={
              sensor.status === 'normal'
                ? 'text-green-400'
                : sensor.status === 'warning'
                  ? 'text-yellow-400'
                  : 'text-red-400'
            }
          >
            {sensor.status}
          </span>
        </p>

        <div className="bg-[#0a0a14] rounded-lg p-4 mb-4 border border-gray-800">
          <div className="text-xs text-gray-500 mb-1">Current Reading</div>
          <div className="text-3xl font-bold" style={{ color }}>
            {typeof currentValue === 'number' ? currentValue.toFixed(1) : currentValue}
            <span className="text-sm text-gray-500 ml-1">{sensor.unit}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Range: {sensor.min} – {sensor.max} {sensor.unit}
          </div>
        </div>

        <div className="mb-2">
          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
            Last 24 Hours
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
              Loading telemetry...
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
                    }}
                    stroke="#333"
                    tick={{ fontSize: 10, fill: '#555' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#333"
                    tick={{ fontSize: 10, fill: '#555' }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111118',
                      border: '1px solid #333',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelFormatter={(v) => new Date(v as string).toLocaleTimeString()}
                    formatter={(val) => [`${Number(val).toFixed(1)} ${sensor.unit}`, sensor.name]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: color }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
