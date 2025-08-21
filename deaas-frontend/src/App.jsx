import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './styles/variables.css';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import CircuitCanvas from './components/CircuitCanvas';
import Sidebar from './components/Sidebar';
import PlantChart from './components/Charts/PlantChart';
import PerPanelChart from './components/Charts/PerPanelChart';
import { createSocket, http } from './lib/api';

export default function App() {
  const [panels, setPanels] = useState([]);
  const [inverters, setInverters] = useState([]);
  const [telemetry, setTelemetry] = useState({ panels: {}, inverters: {} });
  const [history, setHistory] = useState({
    plant: [],
    perPanel: {},
    perInverter: {},
    maxPoints: 120,
  });

  // assets
  useEffect(() => {
    (async () => {
      const assets = await http('/api/assets');
      setPanels(assets.panels.filter((p) => p.active));
      setInverters(assets.inverters.filter((i) => i.active));
    })();
  }, []);

  // socket + live updates
  useEffect(() => {
    const s = createSocket();
    const handler = (payload) => {
      setTelemetry((t) => {
        if (payload.type === 'panel') {
          return {
            ...t,
            panels: { ...t.panels, [payload.id]: payload.metrics },
          };
        } else if (payload.type === 'inverter') {
          return {
            ...t,
            inverters: { ...t.inverters, [payload.id]: payload.metrics },
          };
        }
        return t;
      });

      setHistory((h) => {
        const now = Date.now(),
          maxPoints = h.maxPoints;
        const next = {
          plant: h.plant,
          perPanel: { ...h.perPanel },
          perInverter: { ...h.perInverter },
          maxPoints,
        };

        if (payload.type === 'panel') {
          const kw = Number(payload.metrics?.DC_POWER ?? 0) / 1000;
          const arr = next.perPanel[payload.id]
            ? [...next.perPanel[payload.id]]
            : [];
          arr.push({ t: now, power: kw });
          if (arr.length > maxPoints) arr.shift();
          next.perPanel[payload.id] = arr;
        } else if (payload.type === 'inverter') {
          const kw = Number(payload.metrics?.AC_POWER ?? 0) / 1000;
          const arr = next.perInverter[payload.id]
            ? [...next.perInverter[payload.id]]
            : [];
          arr.push({ t: now, power: kw, status: payload.metrics?.STATUS });
          if (arr.length > maxPoints) arr.shift();
          next.perInverter[payload.id] = arr;
        }

        // compute totals from latest telemetry snapshot
        const totalDC = Object.values(telemetry.panels).reduce(
          (s, m) => s + Number(m?.DC_POWER ?? 0) / 1000,
          0
        );
        const totalAC = Object.values(telemetry.inverters).reduce(
          (s, m) => s + Number(m?.AC_POWER ?? 0) / 1000,
          0
        );
        if (totalDC || totalAC) {
          const plant = [...h.plant, { t: now, totalDC, totalAC }];
          if (plant.length > maxPoints) plant.shift();
          next.plant = plant;
        }
        return next;
      });
    };
    s.on('telemetry', handler);
    return () => {
      s.off('telemetry', handler);
      s.disconnect();
    };
  }, [telemetry.panels, telemetry.inverters]);

  // initial poll
  useEffect(() => {
    (async () => {
      if (panels.length) {
        const ids = panels.map((p) => p.id).join(',');
        try {
          const { data } = await http(`/api/telemetry?type=panel&ids=${ids}`);
          setTelemetry((t) => ({
            ...t,
            panels: Object.fromEntries(data.map((d) => [d.id, d.metrics])),
          }));
        } catch {}
      }
      if (inverters.length) {
        const ids = inverters.map((i) => i.id).join(',');
        try {
          const { data } = await http(
            `/api/telemetry?type=inverter&ids=${ids}`
          );
          setTelemetry((t) => ({
            ...t,
            inverters: Object.fromEntries(data.map((d) => [d.id, d.metrics])),
          }));
        } catch {}
      }
    })();
  }, [panels, inverters]);

  // actions
  async function addPanel() {
    const name = prompt('Panel name', `Roof-P${panels.length + 1}`);
    if (!name) return;
    const p = await http('/api/panels', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    setPanels((prev) => [...prev, p]);
  }
  async function removePanel(id) {
    if (!confirm(`Remove panel ${id}?`)) return;
    await http(`/api/panels/${id}`, { method: 'DELETE' });
    setPanels((prev) => prev.filter((p) => p.id !== id));
    setTelemetry((t) => {
      const n = { ...t.panels };
      delete n[id];
      return { ...t, panels: n };
    });
    setHistory((h) => {
      const n = { ...h, perPanel: { ...h.perPanel } };
      delete n.perPanel[id];
      return n;
    });
  }
  async function addInverter() {
    const name = prompt('Inverter name', `INV-${inverters.length + 1}`);
    if (!name) return;
    const inv = await http('/api/inverters', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    setInverters((prev) => [...prev, inv]);
  }
  async function removeInverter(id) {
    if (!confirm(`Remove inverter ${id}?`)) return;
    await http(`/api/inverters/${id}`, { method: 'DELETE' });
    setInverters((prev) => prev.filter((i) => i.id !== id));
    setTelemetry((t) => {
      const n = { ...t.inverters };
      delete n[id];
      return { ...t, inverters: n };
    });
    setHistory((h) => {
      const n = { ...h, perInverter: { ...h.perInverter } };
      delete n.perInverter[id];
      return n;
    });
  }

  // charts data
  const plantData = history.plant;
  const perPanelHistory = history.perPanel;

  return (
    <div className='app'>
      <Header />
      <Toolbar onAddPanel={addPanel} onAddInverter={addInverter} />

      <div className='grid-body'>
        {/* BELOW: Circuit + Metrics */}
        <div className='grid grid--2 top-gap'>
          <CircuitCanvas
            panels={panels}
            inverters={inverters}
            telemetry={telemetry}
            onRemovePanel={removePanel}
            onRemoveInverter={removeInverter}
          />
          <Sidebar
            panels={panels}
            inverters={inverters}
            telemetry={telemetry}
          />
        </div>

        {/* CHARTS FIRST */}
        <div className='grid grid--2'>
          <PlantChart data={plantData} />
          <PerPanelChart perPanelHistory={perPanelHistory} panels={panels} />
        </div>
      </div>

      <div className='footer'>
        Data from Flask REST + Socket.IO. Charts keep a rolling ~2 min buffer.
      </div>
    </div>
  );
}
