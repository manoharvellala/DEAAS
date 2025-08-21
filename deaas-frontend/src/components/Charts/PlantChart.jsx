import React from 'react';
import TimeSeriesChart from '../TimeSeriesChart';
import './PlantChart.css';

export default function PlantChart({ data }) {
  const series = [
    { key: 'totalDC', label: 'Total DC (kW)' },
    { key: 'totalAC', label: 'Total AC (kW)' },
  ];
  return (
    <TimeSeriesChart title='Plant Power (live)' data={data} series={series} />
  );
}
