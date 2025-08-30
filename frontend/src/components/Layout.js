import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../translations';
import LanguageToggle from './LanguageToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import {
  Home,
  Users,
  Heart,
  Baby,
  Utensils,
  Settings,
  Menu as MenuIcon,
  LogOut,
  User as UserIcon,
  BarChart3,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Bell,
  HelpCircle,
  Egg,
  Milk,
  Bug
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const { language } = useLanguage();
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

  // Get farm-type specific navigation
  const getNavigationForFarmType = (farmType) => {
    const baseNavigation = [];

    switch (farmType) {
      case 'poultry':
        return [
          { name: 'Dashboard Selector', href: '/', icon: Home },
          { name: 'Poultry Dashboard', href: '/dashboard/poultry', icon: Egg },
          { name: 'Poultry', href: '/poultry', icon: Egg },
          { name: 'Health Records', href: '/poultry-health', icon: Heart },
          { name: 'Feed Records', href: '/poultry-feed-records', icon: Utensils },
          { name: 'Sales', href: '/poultry-sales', icon: ShoppingCart },
          { name: 'Reports', href: '/poultry-reports', icon: BarChart3 },
          { name: 'Settings', href: '/settings', icon: Settings },
          ...(hasPermission('canManageUsers') ? [{ name: 'Users', href: '/users', icon: Users }] : []),
          ...(process.env.NODE_ENV !== 'production' ? [{ name: 'Dev Tools', href: '/dev-tools', icon: Bug }] : []),
        ];
      case 'dairy':
        return [
          { name: 'Dashboard Selector', href: '/', icon: Home },
          { name: 'Dairy Dashboard', href: '/dashboard/dairy', icon: Milk },
          { name: 'Dairy', href: '/dairy', icon: Milk },
          { name: 'Health Records', href: '/dairy-health', icon: Heart },
          { name: 'Breeding', href: '/dairy-breeding', icon: Baby },
          { name: 'Feed Records', href: '/dairy-feed-records', icon: Utensils },
          { name: 'Sales', href: '/dairy-sales', icon: ShoppingCart },
          { name: 'Reports', href: '/dairy-reports', icon: BarChart3 },
          { name: 'Settings', href: '/settings', icon: Settings },
          ...(hasPermission('canManageUsers') ? [{ name: 'Users', href: '/users', icon: Users }] : []),
          ...(process.env.NODE_ENV !== 'production' ? [{ name: 'Dev Tools', href: '/dev-tools', icon: Bug }] : []),
        ];
      case 'goat':
      default:
        return [
          { name: 'Dashboard Selector', href: '/', icon: Home },
          { name: 'Goat Dashboard', href: '/dashboard/goat', icon: Users },
          { name: 'Goats', href: '/goats', icon: Users },
          { name: 'Health Records', href: '/goat-health', icon: Heart },
          { name: 'Breeding', href: '/goat-breeding', icon: Baby },
          { name: 'Feed Records', href: '/goat-feed', icon: Utensils },
          { name: 'Sales', href: '/sales', icon: ShoppingCart },
          { name: 'Settings', href: '/settings', icon: Settings },
          ...(hasPermission('canViewReports') ? [{ name: 'Reports', href: '/reports', icon: BarChart3 }] : []),
          ...(hasPermission('canManageUsers') ? [{ name: 'Users', href: '/users', icon: Users }] : []),
          ...(process.env.NODE_ENV !== 'production' ? [{ name: 'Dev Tools', href: '/dev-tools', icon: Bug }] : []),
        ];
    }
  };

  // Determine current farm type based on URL path (context-aware sidebar)
  const path = location.pathname || '';
  let currentFarmType = 'goat'; // default
  
  // Check for dashboard routes first
  if (path.startsWith('/dashboard/')) {
    const match = path.match(/\/dashboard\/([^/]+)/);
    if (match) {
      currentFarmType = match[1];
    }
  } 
  // Check for specific farm type routes
  else if (path.startsWith('/poultry')) {
    currentFarmType = 'poultry';
  } 
  else if (path.startsWith('/dairy')) {
    currentFarmType = 'dairy';
  } 
  // Fallback to user's primaryFarmType if available
  else if (user?.primaryFarmType) {
    currentFarmType = user.primaryFarmType;
  }

  // Build navigation for the current farm type
  const navigation = user ? getNavigationForFarmType(currentFarmType) : [];

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

          {/* Navigation */}
          <nav className="mt-6 px-2 space-y-1">
            {navigation.map((item) => {
              const isItemActive = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isItemActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`flex-shrink-0 h-5 w-5 ${isItemActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
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
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <MenuIcon className="h-6 w-6" />
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">
                {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none">
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none">
                <span className="sr-only">Help</span>
                <HelpCircle className="h-5 w-5" />
              </button>
              <LanguageToggle />
              
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
              name: 'Home', 
              href: currentFarmType === 'goat' ? '/goat' : currentFarmType === 'dairy' ? '/dairy' : '/poultry', 
              icon: Home,
              activePaths: ['/goat', '/dairy', '/poultry']
            },
            { 
              name: 'Animals', 
              href: currentFarmType === 'goat' ? '/goat/animals' : currentFarmType === 'dairy' ? '/dairy/animals' : '/poultry/animals', 
              icon: Users,
              activePaths: ['/goat/animals', '/dairy/animals', '/poultry/animals', '/animals']
            },
            { 
              name: 'Health', 
              href: currentFarmType === 'goat' ? '/goat/health' : currentFarmType === 'dairy' ? '/dairy/health' : '/poultry/health', 
              icon: Heart,
              activePaths: ['/goat/health', '/dairy/health', '/poultry/health', '/health']
            },
            { 
              name: 'Reports', 
              href: currentFarmType === 'goat' ? '/goat/reports' : currentFarmType === 'dairy' ? '/dairy/reports' : '/poultry/reports', 
              icon: BarChart3,
              activePaths: ['/goat/reports', '/dairy/reports', '/poultry/reports', '/reports']
            },
            { 
              name: 'Profile', 
              href: '/profile', 
              icon: UserIcon,
              activePaths: ['/profile', '/settings']
            },
          ].map(item => {
            const isActive = item.activePaths.some(path => window.location.pathname.startsWith(path));
            const handleClick = (e) => {
              // Haptic feedback on supported devices
              if (navigator.vibrate) {
                navigator.vibrate(10);
              }
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