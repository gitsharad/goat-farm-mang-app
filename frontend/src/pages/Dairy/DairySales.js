import React from 'react';
import Sales from '../Sales';

// Wrapper to reuse the generic Sales page under Dairy routes
const DairySales = () => {
  return <Sales farmType="dairy" />;
};

export default DairySales;
