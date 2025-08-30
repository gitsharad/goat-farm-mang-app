import React from 'react';
import { Outlet } from 'react-router-dom';

const SimpleLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="min-h-screen">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default SimpleLayout;
