import React from 'react';
import './index.css';
import { prettyKW, prettyV, prettyA } from '../../lib/format';

export default function Sidebar({ panels, inverters, telemetry }) {
  return (
    <aside className='side card'>
      <h3 className='side__title'>Live Metrics</h3>

      <section>
        <h4>Panels</h4>
        <div className='grid'>
          {panels.map((p) => {
            const m = telemetry.panels[p.id] || {};
            return (
              <div key={p.id} className='tile'>
                <div className='tile__head'>
                  <strong>{p.name}</strong>
                  <small>#{p.id}</small>
                </div>
                <div>Power: {prettyKW(m.DC_POWER)}</div>
                <div>Voltage: {prettyV(m.VOLTAGE)}</div>
                <div>Current: {prettyA(m.CURRENT)}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h4>Inverters</h4>
        <div className='grid'>
          {inverters.map((i) => {
            const m = telemetry.inverters[i.id] || {};
            const status = m.STATUS;
            const text = status === 2 ? 'FAULT' : status === 1 ? 'ON' : 'OFF';
            const cls =
              status === 2
                ? 'tile tile--fault'
                : status === 1
                ? 'tile tile--ok'
                : 'tile';
            return (
              <div key={i.id} className={cls}>
                <div className='tile__head'>
                  <strong>{i.name}</strong>
                  <small>#{i.id}</small>
                </div>
                <div>AC Power: {prettyKW(m.AC_POWER)}</div>
                <div>Status: {text}</div>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
