import React from 'react';
import './index.css';
import { prettyKW } from '../../lib/format';

export default function CircuitCanvas({
  panels,
  inverters,
  telemetry,
  onRemovePanel,
  onRemoveInverter,
}) {
  // Layout constants
  const WIDTH = 1000;

  const NODE_W = 180; // width of panel/inverter card
  const PANEL_H = 96; // height of panel card
  const INV_H = 96; // height of inverter card
  const BTN_H = 32; // Remove button height
  const GAP = 8; // gap between button and card

  const panelSpacing = Math.max(
    160,
    Math.min(260, Math.floor(WIDTH / Math.max(1, panels.length)))
  );
  const startX = 60;
  const topY = 90; // panels row
  const bottomY = 320; // inverters row
  const invSpacing = 300;

  // Derived anchors (for wires)
  const panelBottomAnchorY = topY + BTN_H + GAP + PANEL_H;
  const invTopAnchorYOffset = BTN_H + GAP;

  const panelPositions = panels.map((p, i) => ({
    id: p.id,
    x: startX + i * panelSpacing,
    y: topY,
    name: p.name,
  }));

  const inverterPositions = inverters.map((inv, i) => ({
    id: inv.id,
    x: startX + i * invSpacing,
    y: bottomY,
    name: inv.name,
  }));

  const primaryInv = inverterPositions[0];

  return (
    <div className='circuit card'>
      <h3 className='circuit__title'>Circuit View</h3>

      <svg className='circuit__svg' viewBox={`0 0 ${WIDTH} 460`}>
        {/* wires */}
        {primaryInv &&
          panelPositions.map((pp) => (
            <line
              key={`wire-${pp.id}`}
              x1={pp.x + NODE_W / 2}
              y1={panelBottomAnchorY}
              x2={primaryInv.x + NODE_W / 2}
              y2={primaryInv.y + invTopAnchorYOffset}
              className='circuit__wire'
            />
          ))}

        {/* panels */}
        {panelPositions.map((pp) => {
          const metrics = telemetry.panels[pp.id] || {};
          return (
            <foreignObject
              key={`panel-${pp.id}`}
              x={pp.x}
              y={pp.y}
              width={NODE_W}
              height={BTN_H + GAP + PANEL_H + 4}
            >
              <div
                xmlns='http://www.w3.org/1999/xhtml'
                className='nodeContainer'
              >
                <button
                  className='removeButton'
                  onClick={() => onRemovePanel(pp.id)}
                >
                  Remove
                </button>
                <div className='nodeBox panelBox'>
                  <div className='nodeTitle'>Panel</div>
                  <div className='nodeSub'>{pp.name}</div>
                  <div className='nodeSub'>{prettyKW(metrics.DC_POWER)}</div>
                </div>
              </div>
            </foreignObject>
          );
        })}

        {/* inverters */}
        {inverterPositions.map((ip) => {
          const metrics = telemetry.inverters[ip.id] || {};
          return (
            <foreignObject
              key={`inv-${ip.id}`}
              x={ip.x}
              y={ip.y}
              width={NODE_W}
              height={BTN_H + GAP + INV_H + 4}
            >
              <div
                xmlns='http://www.w3.org/1999/xhtml'
                className='nodeContainer'
              >
                <button
                  className='removeButton'
                  onClick={() => onRemoveInverter(ip.id)}
                >
                  Remove
                </button>
                <div className='nodeBox invBox'>
                  <div className='nodeTitle'>Inverter</div>
                  <div className='nodeSub'>{ip.name}</div>
                  <div className='nodeSub'>{prettyKW(metrics.AC_POWER)}</div>
                </div>
              </div>
            </foreignObject>
          );
        })}

        <text x='16' y='28' className='hint'>
          Mock circuit — add/remove assets to see layout/stream update
        </text>
      </svg>
    </div>
  );
}
