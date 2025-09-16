// Supported farm types
export const FARM_TYPES = {
  GOAT: 'goat',
  POULTRY: 'poultry',
  DAIRY: 'dairy'
};

// Base paths for each farm type
const FARM_PATHS = {
  [FARM_TYPES.GOAT]: ['/goat', '/goats', '/dashboard/goat'],
  [FARM_TYPES.POULTRY]: ['/poultry', '/dashboard/poultry'],
  [FARM_TYPES.DAIRY]: ['/dairy', '/dashboard/dairy']
};

// Determine the current farm type based on the path
export const getFarmTypeFromPath = (path) => {
  // Check for exact matches first
  for (const [type, paths] of Object.entries(FARM_PATHS)) {
    if (paths.some(p => path === p || path.startsWith(`${p}/`))) {
      return type;
    }
  }
  
  // Check for dashboard routes
  const dashboardMatch = path.match(/\/dashboard\/([^/]+)/);
  if (dashboardMatch && FARM_TYPES[dashboardMatch[1].toUpperCase()]) {
    return dashboardMatch[1].toLowerCase();
  }
  
  return FARM_TYPES.GOAT; // Default to goat
};

// Get the base path for a farm type
export const getBasePath = (farmType) => {
  return FARM_PATHS[farmType]?.[0] || '/';
};
