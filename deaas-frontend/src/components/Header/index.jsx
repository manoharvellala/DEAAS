import React from 'react';
import './index.css';

export default function Header() {
  return (
    <header className='hdr'>
      <h1 className='hdr__title'>
        <span className='highlight'>Distributed Energy</span> as a Service
      </h1>
      <span className='hdr__badge'>Real-time Visualizer</span>
    </header>
  );
}
