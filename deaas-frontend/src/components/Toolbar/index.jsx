import React from 'react';
import './index.css';

export default function Toolbar({ onAddPanel, onAddInverter }) {
  return (
    <div className='toolbar card'>
      <div className='toolbar__left'>
        <button className='btn btn--primary' onClick={onAddPanel}>
          + Add Panel
        </button>
        <button className='btn btn--primary' onClick={onAddInverter}>
          + Add Inverter
        </button>
      </div>
    </div>
  );
}
