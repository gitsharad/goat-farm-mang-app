import React from 'react';
import Sales from '../Sales';

// Wrapper to reuse the generic Sales page under Poultry routes
const PoultrySales = () => {
  return <Sales farmType="poultry" />;
};

export default PoultrySales;
