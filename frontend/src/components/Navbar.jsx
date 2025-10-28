import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  UserCircle,
  BellRing,
  Settings,
  ChevronDown,
  Heart,
  UserPlus,
  Calendar,
  FileText,
  Users,
  Home,
  Menu,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import employeeService from '@/services/employeeService';
import NotificationBell from '@/components/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const loadUserDetails = async () => {
      if (user?.role) {
        try {
          const employees = await employeeService.getEmployeesByRole(user.role);
          const userDetail = employees.find(
            emp => emp.email.includes(user?.role.toLowerCase())
          );
          setUserDetails(userDetail);
        } catch (error) {
          console.error('Error loading user details:', error);
        }
      }
    };

    loadUserDetails();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (user?.role === 'receptionist') {
      return [
        {
          icon: Home,
          label: 'Dashboard',
          path: '/receptionist/dashboard',
          isActive: location.pathname === '/receptionist/dashboard'
        },
        {
          icon: Activity,
          label: 'Live Queue',
          path: '/receptionist/live-queue',
          isActive: location.pathname === '/receptionist/live-queue' || location.pathname.includes('/receptionist/queue/')
        },
        {
          icon: UserPlus,
          label: 'Register Patient',
          path: '/receptionist/register-patient',
          isActive: location.pathname === '/receptionist/register-patient'
        },
        {
          icon: Calendar,
          label: 'Appointments',
          path: '/receptionist/appointments',
          isActive: location.pathname === '/receptionist/appointments'
        },
        {
          icon: FileText,
          label: 'Patient Records',
          path: '/receptionist/patients',
          isActive: location.pathname === '/receptionist/patients'
        }
      ];
    }
    
    if (user?.role === 'admin') {
      return [
        {
          icon: Home,
          label: 'Dashboard',
          path: '/admin/dashboard',
          isActive: location.pathname === '/admin/dashboard'
        },
        {
          icon: Users,
          label: 'Employees',
          path: '/admin/employees',
          isActive: location.pathname === '/admin/employees'
        }
      ];
    }

    if (user?.role === 'doctor') {
      return [
        {
          icon: Home,
          label: 'Dashboard',
          path: '/doctor/dashboard',
          isActive: location.pathname === '/doctor/dashboard'
        },
        {
          icon: FileText,
          label: 'Medical Records',
          path: '/doctor/medical-records',
          isActive: location.pathname === '/doctor/medical-records'
        }
      ];
    }

    if (user?.role === 'nurse') {
      return [
        {
          icon: Home,
          label: 'Dashboard',
          path: '/nurse/dashboard',
          isActive: location.pathname === '/nurse/dashboard'
        },
        {
          icon: FileText,
          label: 'Patient Records',
          path: '/nurse/emr',
          isActive: location.pathname === '/nurse/emr'
        }
      ];
    }

    if (user?.role === 'cashier' || user?.role === 'pharmacist') {
      return [
        {
          icon: Home,
          label: 'Dashboard',
          path: '/cashier/dashboard',
          isActive: location.pathname === '/cashier/dashboard' || location.pathname === '/cashier'
        },
        {
          icon: FileText,
          label: 'Invoices',
          path: '/cashier',
          isActive: location.pathname === '/cashier' || location.pathname.includes('/cashier/invoice/')
        }
      ];
    }
    
    return [];
  };

  const navigationItems = getNavigationItems();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="sticky top-0 z-50 w-full border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="w-full px-3 sm:px-6 md:px-8 mx-auto flex h-20 items-center justify-between">
        {/* Logo and Brand */}
        <motion.div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" 
          onClick={() => navigate(
            user?.role === 'admin' ? '/admin/dashboard' : 
            user?.role === 'cashier' || user?.role === 'pharmacist' ? '/cashier/dashboard' :
            '/receptionist/dashboard'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div 
            className="bg-primary p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all hover:shadow-lg shrink-0"
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Heart className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary-foreground" />
          </motion.div>
          <div className="hidden sm:block">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight">RealCIS</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Healthcare System</p>
          </div>
        </motion.div>

        {/* Navigation Items - Only show for receptionist and admin */}
        <AnimatePresence>
          {navigationItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="hidden lg:flex items-center gap-2"
            >
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.2 }}
                  >
                    <Button
                      variant={item.isActive ? "default" : "ghost"}
                      size="lg"
                      onClick={() => navigate(item.path)}
                      className={`flex items-center gap-2 px-4 py-2 text-base font-medium transition-all ${
                        item.isActive 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </Button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Side Navigation */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          {/* Mobile Navigation Menu - Show navigation items for smaller screens */}
          {navigationItems.length > 0 && (
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 border-2">
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel className="text-base font-semibold">Navigation</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`py-3 text-base cursor-pointer ${
                          item.isActive ? "bg-accent text-accent-foreground" : ""
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Notifications */}
          <NotificationBell />

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 sm:gap-3 border-2 border-border hover:bg-accent px-3 sm:px-6 h-10 sm:h-12">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative">
                    <UserCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    <div className={`absolute bottom-0 right-0 h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-green-500 border-2 border-background`}></div>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm sm:text-base font-medium text-foreground">
                      {userDetails?.name || user?.role}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {user?.role}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem className="py-3 text-base">
                <Settings className="mr-2 h-5 w-5" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="py-3 text-base text-red-500 focus:text-red-500" 
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
