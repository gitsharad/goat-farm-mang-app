import React from 'react';

function TestComponent() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      zIndex: 9999,
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Test Component</h1>
        <p>If you can see this, React is working!</p>
      </div>
    </div>
  );
}

export default TestComponent;
