import React from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Goats from './Goats';
import PoultryDashboard from './Poultry/PoultryDashboard';
import DairyDashboard from './Dairy/DairyDashboard';

const Dashboard = () => {
  const { farmType } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // If no farmType in URL, redirect to dashboard selector
  React.useEffect(() => {
    if (!farmType) {
      navigate('/');
    }
  }, [farmType, navigate]);

  // Render the appropriate dashboard based on URL parameter
  switch (farmType) {
    case 'poultry':
      return <PoultryDashboard />;
    case 'dairy':
      return <DairyDashboard />;
    case 'goat':
    default:
      return <Goats />;
  }
};

export default Dashboard; 