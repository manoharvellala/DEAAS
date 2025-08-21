import React, { useMemo } from 'react';
import TimeSeriesChart from '../TimeSeriesChart';
import './PerPanelChart.css';

export default function PerPanelChart({ perPanelHistory, panels }) {
  const ids = panels.map((p) => p.id).slice(0, 6);
  const data = useMemo(() => {
    const timeline = new Map();
    ids.forEach((id) => {
      (perPanelHistory[id] || []).forEach((pt) => {
        if (!timeline.has(pt.t)) timeline.set(pt.t, { t: pt.t });
        timeline.get(pt.t)[`P${id}`] = pt.power;
      });
    });
    return Array.from(timeline.values()).sort((a, b) => a.t - b.t);
  }, [perPanelHistory, ids.join(',')]);

  const series = useMemo(
    () =>
      ids.map((id) => {
        const name = panels.find((p) => p.id === id)?.name || `P${id}`;
        return { key: `P${id}`, label: `${name} (kW)` };
      }),
    [ids.join(','), panels]
  );

  return (
    <TimeSeriesChart
      title='Per-Panel DC Power (live)'
      data={data}
      series={series}
    />
  );
}
