import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate, Outlet, matchPath } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import { 
  LayoutDashboard, 
  Egg, 
  Heart, 
  Utensils, 
  Baby, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Users, 
  Bug,
  Github as Goat,
  Milk,
  Home,
  Menu as MenuIcon,
  LogOut,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Bell,
  HelpCircle
} from 'lucide-react';
import { FARM_TYPES, getFarmTypeFromPath } from '../utils/navigation';

const Layout = ({ children }) => {
  const { t, i18n } = useTranslation();
  
  // Debug: Log current language and a test translation
  console.log('Current language:', i18n.language);
  console.log('Test translation:', t('navigation.dashboard'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  

  // Debug logging
  useEffect(() => {
    console.log('Layout rendered', {
      path: location.pathname,
      user: user ? { id: user._id, role: user.role } : 'no user',
      isMobile,
      sidebarOpen,
      collapsed
    });
  }, [location.pathname, user, isMobile, sidebarOpen, collapsed]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation configuration with icons and translation keys
  const navConfig = {
    // Dashboard
    dashboard: { 
      icon: LayoutDashboard, 
      key: 'dashboard',
      getLabel: (t, farmType) => t(`navigation.${farmType}.dashboard`, { defaultValue: t('navigation.dashboard') })
    },
  
    // Animals
    animals: {
      icon: Goat,
      key: 'animals',
      getLabel: (t, farmType) => {
        // Special case for goat to maintain backward compatibility
        if (farmType === 'goat') {
          return t('navigation.goat.animals', { defaultValue: t('navigation.goats', { defaultValue: 'Goats' }) });
        }
        return t(`navigation.${farmType}.animals`, { defaultValue: t('navigation.animals') });
      }
    },
  
    // Health
    health: {
      icon: Heart,
      key: 'health',
      getLabel: (t, farmType) => t(`navigation.${farmType}.health`, { 
        defaultValue: t('navigation.healthRecords', { defaultValue: 'Health' }) 
      })
    },
  
    // Feed
    feed: {
      icon: Utensils,
      key: 'feed',
      getLabel: (t, farmType) => t(`navigation.${farmType}.feed`, { 
        defaultValue: t('navigation.feedRecords', { defaultValue: 'Feed' }) 
      })
    },
  
    // Breeding
    breeding: {
      icon: Baby,
      key: 'breeding',
      getLabel: (t, farmType) => t(`navigation.${farmType}.breeding`, { 
        defaultValue: t('navigation.breedingRecords', { defaultValue: 'Breeding' }) 
      })
    },
  
    // Sales
    sales: {
      icon: ShoppingCart,
      key: 'sales',
      getLabel: (t, farmType) => t(`navigation.${farmType}.sales`, { 
        defaultValue: t('navigation.sales', { defaultValue: 'Sales' }) 
      })
    },
  
    // Reports
    reports: {
      icon: BarChart3,
      key: 'reports',
      getLabel: (t, farmType) => t(`navigation.${farmType}.reports`, { 
        defaultValue: t('navigation.reports', { defaultValue: 'Reports' }) 
      })
    },
  
    // Settings
    settings: {
      icon: Settings,
      key: 'settings',
      getLabel: (t) => t('navigation.settings', { defaultValue: 'Settings' })
    },
  
    // Users (admin)
    users: { 
      icon: Users, 
      key: 'users',
      getLabel: (t) => t('navigation.users', { defaultValue: 'Users' })
    },
  
    // Developer Tools
    devTools: { 
      icon: Bug, 
      key: 'devTools',
      getLabel: (t) => t('navigation.devTools', { defaultValue: 'Developer Tools' })
    }  
  };

  // Get farm-type specific navigation with translations
  const getNavigationForFarmType = useCallback((farmType) => {
    if (!farmType) return [];
    
    // If we're on the dashboard selector page, return empty navigation
    if (location.pathname === '/dashboard-selector') {
      return [];
    }
    
    const getNavItem = (type, path) => {
      const item = navConfig[type];
      
      if (!item) {
        console.warn(`Navigation item not found for type: ${type}`);
        return null;
      }
      
      const label = typeof item.getLabel === 'function' ? item.getLabel(t, farmType) : type;
      
      return {
        title: label,
        path: path,
        icon: item.icon,
        key: item.key || type,
        id: `${farmType}-${item.key || type}`,
        name: label  // Ensure name is set for display
      };
    };

    // Helper function to generate paths based on farm type
    const getPath = (basePath) => {
      if (farmType === 'goat') {
        return `/${basePath}`; // Goat uses root paths
      }
      return `/${farmType}/${basePath}`; // Other farm types use prefixed paths
    };

    const navItems = [
      getNavItem('dashboard', `/${farmType}/dashboard`),
      getNavItem('animals', farmType === 'goat' ? '/goats' : `/${farmType}/animals`),
      getNavItem('health', `/${farmType}/health`),
      getNavItem('feed', `/${farmType}/feed`),
      getNavItem('breeding', `/${farmType}/breeding`),
      getNavItem('sales', `/${farmType}/sales`),
      getNavItem('reports', `/${farmType}/reports`)
    ];

    return navItems.filter(Boolean);
  }, [t]);

  // Determine current farm type based on URL path
  const currentFarmType = getFarmTypeFromPath(location.pathname) || user?.primaryFarmType || FARM_TYPES.GOAT;

  // Helper function to create a navigation item with translations
  const getTranslatedNavItem = useCallback((type, path, icon) => {
    const navItem = navConfig[type] || {};
    const getLabel = () => {
      if (typeof navItem.getLabel === 'function') {
        return navItem.getLabel(t, currentFarmType);
      }
      return t(`navigation.${type}`, { defaultValue: type });
    };

    return {
      ...navItem,
      name: getLabel(),
      path: path,
      icon: icon || navItem.icon || HelpCircle,
      key: `${currentFarmType}-${type}`,
      id: `${currentFarmType}-${type}`
    };
  }, [t, currentFarmType]);

  // Generate navigation items based on current farm type and permissions
  const navigation = useMemo(() => {
    if (!currentFarmType) return [];
    
    const navItems = [];
    const isGoat = currentFarmType === 'goat';
    const isPoultry = currentFarmType === 'poultry';
    const isDairy = currentFarmType === 'dairy';
    
    // Helper to determine if a path matches the current location
    const isActive = (path, exact = false) => {
      if (exact) {
        return location.pathname === path;
      }
      return location.pathname.startsWith(path) && (path !== '/' || location.pathname === '/');
    };
    
    // Define navigation items based on farm type
    const getPath = (type) => {
      // Goat farm paths
      if (isGoat) {
        switch (type) {
          case 'dashboard': return { path: '/dashboard', exact: true };
          case 'animals': return { path: '/goats' };
          case 'health': return { path: '/goats/health' };
          case 'feed': return { path: '/goats/feed' };
          case 'breeding': return { path: '/goats/breeding' };
          case 'sales': return { path: '/sales' };
          case 'reports': return { path: '/reports' };
          default: return { path: `/${type}` };
        }
      }
      
      // Poultry farm paths
      if (isPoultry) {
        switch (type) {
          case 'dashboard': return { path: '/dashboard/poultry', exact: true };
          case 'animals': return { path: '/dashboard/poultry/animals' };
          case 'health': return { path: '/dashboard/poultry/health' };
          case 'feed': return { path: '/dashboard/poultry/feed' };
          case 'breeding': return { path: '/dashboard/poultry/breeding' };
          case 'sales': return { path: '/dashboard/poultry/sales' };
          case 'reports': return { path: '/dashboard/poultry/reports' };
          default: return { path: `/dashboard/poultry/${type}` };
        }
      }
      
      // Dairy farm paths
      if (isDairy) {
        switch (type) {
          case 'dashboard': return { path: '/dashboard/dairy', exact: true };
          case 'animals': return { path: '/dairy/animals' };
          case 'health': return { path: '/dairy/health' };
          case 'feed': return { path: '/dairy/feed' };
          case 'breeding': return { path: '/dairy/breeding' };
          case 'sales': return { path: '/dairy/sales' };
          case 'reports': return { path: '/dairy/reports' };
          default: return { path: `/${type}` };
        }
      }
      
      return { path: `/${currentFarmType}/${type}` };
    };

    // Define navigation items configuration
    const navItemsConfig = [
      { key: 'dashboard', path: getPath('dashboard') },
      { key: 'animals', path: getPath('animals') },
      { key: 'health', path: getPath('health') },
      { key: 'feed', path: getPath('feed') }
    ];
    
    // Add breeding only for goat and dairy
    if (isGoat || isDairy) {
      navItemsConfig.push({ key: 'breeding', path: getPath('breeding') });
    }
    
    // Add sales and reports for all
    navItemsConfig.push(
      { key: 'sales', path: getPath('sales') },
      { key: 'reports', path: getPath('reports') }
    );

    // Generate navigation items based on config
    navItemsConfig.forEach(({ key, path }) => {
      if (!path) return;
      
      const navItem = getTranslatedNavItem(key, path.path);
      if (navItem) {
        navItems.push({
          ...navItem,
          path: path.path,
          exact: path.exact || false,
          key: `${currentFarmType}-${key}`,
          id: `${currentFarmType}-${key}`
        });
      }
    });

    // Add divider
    navItems.push({ type: 'divider', key: `${currentFarmType}-divider` });

    // Common bottom items
    const bottomItems = [
      getTranslatedNavItem('settings', '/settings', Settings)
    ];

    // Add admin menu if user has permission
    if (hasPermission('admin:access')) {
      bottomItems.push({
        ...getTranslatedNavItem('users', '/admin/users', Users),
        items: [
          {
            title: t('navigation.users'),
            path: '/admin/users',
            key: 'users-list'
          },
          {
            title: t('navigation.devTools'),
            path: '/dev-tools',
            key: 'dev-tools'
          }
        ]
      });
    }
    
    if (process.env.NODE_ENV !== 'production') {
      bottomItems.push(getTranslatedNavItem('devTools', '/dev-tools'));
    }

    // Combine all items with a divider
    return [
      ...navItems,
      { type: 'divider' },
      ...bottomItems
    ];
  }, [currentFarmType, t, hasPermission]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const sidebarWidth = collapsed ? 'w-20' : 'w-64';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: isMobile ? '-100%' : 0 }}
        animate={{ x: sidebarOpen || !isMobile ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed lg:relative z-50 h-screen ${sidebarWidth} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out`}
      >
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Logo */}
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} h-16 px-4 border-b border-gray-200`}>
            {!collapsed && (
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-primary-600">
                  {currentFarmType === 'poultry' ? 'PoultryFarm' :
                   currentFarmType === 'dairy' ? 'DairyFarm' : 'GoatFarm'}
                </span>
              </Link>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              data-tooltip-id="collapse-tooltip"
              data-tooltip-content={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Dashboard Switcher Link - Always visible */}
          <div className="px-2 mb-4">
            <Link
              to="/dashboard-selector"
              onClick={() => setSidebarOpen(false)} // Close mobile menu on click
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                location.pathname === '/dashboard-selector'
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              <Home className={`h-5 w-5 ${location.pathname === '/dashboard-selector' ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-500'}`} />
              {!collapsed && (
                <span className="ml-3">
                  {t('navigation.switchDashboard', 'Switch Dashboard')}
                </span>
              )}
              {!collapsed && location.pathname === '/dashboard-selector' && (
                <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {t('common.current', 'Current')}
                </span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="mt-6 px-2 space-y-1">
            {navigation.map((item) => {
              // Handle divider
              if (item.type === 'divider') {
                return <div key={item.key || 'divider'} className="border-t border-gray-200 my-2" />;
              }

              const isItemActive = isActive(item.path, item.exact);
              const isDashboardItem = item.path === '/dashboard' || item.path === '/dashboard/';
              return (
                <Link
                  key={item.id || item.path}
                  to={item.path}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isItemActive
                      ? 'bg-primary-50 text-primary-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  <item.icon 
                    className={`flex-shrink-0 h-5 w-5 ${
                      isItemActive 
                        ? 'text-primary-600' 
                        : 'text-gray-500 group-hover:text-gray-700'
                    }`} 
                  />
                  {!collapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile */}
        <div className={`p-4 border-t border-gray-200 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'flex-col space-y-2' : 'justify-between w-full'}`}>
            <div className={`flex items-center ${collapsed ? 'flex-col' : ''}`}>
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                <UserIcon className="h-4 w-4" />
              </div>
              {!collapsed && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.role || 'Admin'}</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-500"
                data-tooltip-id="logout-tooltip"
                data-tooltip-content="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <MenuIcon className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none">
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none">
                <span className="sr-only">Help</span>
                <HelpCircle className="h-5 w-5" />
              </button>
              
              {/* Language Switcher */}
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>
              
              
              {/* Mobile user menu */}
              <div className="lg:hidden ml-4 relative">
                <button
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <UserIcon className="h-4 w-4" />
                  </div>
                </button>
                
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6 pb-16 lg:pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Bottom mobile nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5">
          {[
            { 
              name: t('navigation.dashboard', 'Dashboard'),
              href: `/${currentFarmType}/dashboard`,
              icon: LayoutDashboard,
              activePaths: [`/${currentFarmType}/dashboard`]
            },
            { 
              name: currentFarmType === 'goat' 
                ? t('navigation.goat.animals', 'Goats')
                : t(`navigation.${currentFarmType}.animals`, 'Animals'),
              href: currentFarmType === 'goat' ? '/goats' : `/${currentFarmType}/animals`,
              icon: currentFarmType === 'goat' ? Goat : Users,
              activePaths: [
                currentFarmType === 'goat' ? '/goats' : `/${currentFarmType}/animals`,
                `/${currentFarmType}/animals`
              ]
            },
            { 
              name: t(`navigation.${currentFarmType}.health`, 'Health'),
              href: `/${currentFarmType}/health`,
              icon: Heart,
              activePaths: [`/${currentFarmType}/health`]
            },
            { 
              name: t(`navigation.${currentFarmType}.reports`, 'Reports'),
              href: `/${currentFarmType}/reports`,
              icon: BarChart3,
              activePaths: [`/${currentFarmType}/reports`]
            },
            { 
              name: t('navigation.settings', 'Settings'),
              href: '/settings',
              icon: Settings,
              activePaths: ['/settings', '/profile']
            },
          ].map((item) => {
            // Helper function to check if a path is active
            const isActive = (path) => {
              const currentPath = location.pathname;
              
              // Special case for dashboard
              if (path === '/dashboard' || path === '/dashboard/') {
                return currentPath === '/' || 
                       currentPath === '/dashboard' || 
                       currentPath.startsWith('/dashboard/');
              }
              
              // Special case for goats
              if (path === '/goats' || path === '/goats/') {
                return currentPath === '/goats' || 
                       currentPath.startsWith('/goats/') ||
                       currentPath.startsWith('/dashboard/goat');
              }
              
              // Special case for farm-specific routes
              if (path.startsWith(`/${currentFarmType}/`)) {
                return currentPath.startsWith(path);
              }
              
              // Exact match for other paths
              return currentPath === path;
            };

            const handleClick = (e) => {
              e.preventDefault();
              
              // Haptic feedback on supported devices
              if (navigator.vibrate) {
                navigator.vibrate(10);
              }
              
              // Navigate to the new path
              navigate(item.href);
              
              // Close mobile menu if open
              setSidebarOpen(false);
              
              // Smooth scroll to top
              window.scrollTo({ top: 0, behavior: 'smooth' });
            };

            return (
              <Link 
                key={item.href} 
                to={item.href} 
                onClick={handleClick}
                className={`flex flex-col items-center justify-center py-3 px-1 min-h-[64px] transition-colors duration-200 ${
                  isActive 
                    ? 'text-primary-600 bg-primary-50/50' 
                    : 'text-gray-500 hover:text-primary-500 active:bg-gray-50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={`p-2 rounded-full ${isActive ? 'bg-primary-100' : ''}`}>
                  <item.icon className={`h-6 w-6 ${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-200`} />
                </div>
                <span className="text-xs font-medium mt-1">{item.name}</span>
                {isActive && (
                  <div className="absolute bottom-0 w-1/2 h-1 bg-primary-600 rounded-t-full"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Tooltips */}
      <Tooltip id="collapse-tooltip" place="right" effect="solid" />
      <Tooltip id="logout-tooltip" place="top" effect="solid" />
    </div>
  );
};

export default Layout; 