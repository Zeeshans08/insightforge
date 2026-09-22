import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const COLOR_PALETTE = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

export default function ChartRenderer({ chartConfig }) {
  if (!chartConfig || !chartConfig.render || !chartConfig.data || chartConfig.data.length === 0) {
    return null;
  }

  const { chart_type, title, x_key, y_keys, data, explanation } = chartConfig;

  // Key normalization for x_key / y_keys
  const primaryX = x_key || Object.keys(data[0])[0];
  const primaryYKeys = y_keys && y_keys.length > 0 ? y_keys : [Object.keys(data[0])[1] || Object.keys(data[0])[0]];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <BarChart3 size={20} color="#818cf8" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
          {title || 'Visual Insight'}
        </h3>
      </div>

      {explanation && (
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
          {explanation}
        </p>
      )}

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chart_type === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
              <XAxis dataKey={primaryX} stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #6366f1', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              {primaryYKeys.map((key, idx) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]} strokeWidth={3} dot={{ r: 5 }} />
              ))}
            </LineChart>
          ) : chart_type === 'pie' ? (
            <PieChart>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #6366f1', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Pie
                data={data}
                dataKey={primaryYKeys[0]}
                nameKey={primaryX}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            /* Default to Bar chart */
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
              <XAxis dataKey={primaryX} stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #6366f1', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              {primaryYKeys.map((key, idx) => (
                <Bar key={key} dataKey={key} fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
