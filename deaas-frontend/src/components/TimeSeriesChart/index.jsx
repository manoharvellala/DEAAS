import React from 'react';
import './index.css';
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
  return (
    <div className='chart card'>
      <div className='chart__title'>{title}</div>
      <div className='chart__canvas'>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='t'
              minTickGap={24}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getHours()}:${String(d.getMinutes()).padStart(
                  2,
                  '0'
                )}:${String(d.getSeconds()).padStart(2, '0')}`;
              }}
            />
            <YAxis />
            <Tooltip labelFormatter={(v) => new Date(v).toLocaleTimeString()} />
            <Legend />
            {series.map((s) => (
              <Line
                key={s.key}
                type='monotone'
                dataKey={s.key}
                name={s.label}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
