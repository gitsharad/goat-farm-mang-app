import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  Container, 
  AppBar,
  Toolbar
} from '@mui/material';
import { 
  Lock as LockIcon, 
  Code as CodeIcon
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dev-tabpanel-${index}`}
      aria-labelledby={`dev-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `dev-tab-${index}`,
    'aria-controls': `dev-tabpanel-${index}`,
  };
}

const DevTools = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [value, setValue] = useState(0);

  // Get the tab from the URL hash
  React.useEffect(() => {
    const tab = location.hash.replace('#', '');
    const tabIndex = tab ? parseInt(tab, 10) : 0;
    if (!isNaN(tabIndex) && tabIndex >= 0) {
      setValue(tabIndex);
    }
  }, [location]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    navigate(`#${newValue}`, { replace: true });
  };

  // Only render in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <LockIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Development Tools Unavailable
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This page is only available in development mode.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ width: '100%' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <CodeIcon sx={{ mr: 1 }} color="primary" />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Developer Tools
            </Typography>
          </Toolbar>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="Developer Tools"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<CodeIcon />} 
              label="API Explorer" 
              iconPosition="start" 
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<LockIcon />} 
              label="Auth Debug" 
              iconPosition="start" 
              disabled 
              {...a11yProps(1)} 
            />
          </Tabs>
        </AppBar>
        
        <TabPanel value={value} index={0}>
          <Box p={3}>
            <Typography variant="h6" gutterBottom>API Explorer</Typography>
            <Typography color="textSecondary">Coming soon - Explore and test your API endpoints</Typography>
          </Box>
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <Box p={3}>
            <Typography variant="h6" gutterBottom>Auth Debug</Typography>
            <Typography color="textSecondary">Coming soon - Debug authentication issues</Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default DevTools;
