import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function TimeSeriesChart({ title, data, series }) {
  // series = [{ key: "totalDC", label: "Total DC (kW)" }, ...]
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        background: 'white',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <h3 style={{ margin: 0 }}>{title}</h3>
      </div>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='t'
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getHours()}:${String(d.getMinutes()).padStart(
                  2,
                  '0'
                )}:${String(d.getSeconds()).padStart(2, '0')}`;
              }}
              minTickGap={24}
            />
            <YAxis />
            <Tooltip labelFormatter={(v) => new Date(v).toLocaleTimeString()} />
            <Legend />
            {series.map((s, idx) => (
              <Line
                key={s.key}
                type='monotone'
                dataKey={s.key}
                name={s.label}
                dot={false}
                strokeWidth={2}
                // letting Recharts pick colors is fine; you can set stroke if you want custom
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
