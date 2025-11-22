import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/constants/roles';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  UserCircle,
  Settings,
  ChevronDown,
  Heart,
  UserPlus,
  Calendar,
  FileText,
  Users,
  Home,
  Menu,
  Activity,
  Stethoscope,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { employeeService } from '@/features/admin';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';
import clinicSettingsService from '@/services/clinicSettingsService';
import { APP_CONFIG } from '@/constants/app';
import logger from '@/utils/logger';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // const [showNotifications, setShowNotifications] = useState(false); // TODO: Implement notifications
  const [userDetails, setUserDetails] = useState(null);
  const [clinicSettings, setClinicSettings] = useState({
    clinic_name: null,
    clinic_logo_url: null,
  });

  useEffect(() => {
    const loadUserDetails = async () => {
      if (!user?.role) {
        return;
      }

      // Only fetch employee details for roles that have permission (admin, receptionist, nurse)
      // Cashiers, pharmacists, doctors, and patients should use user data from auth context
      const allowedRoles = [ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.NURSE];

      if (allowedRoles.includes(user.role)) {
        try {
          const employees = await employeeService.getEmployeesByRole(user.role);
          const userDetail = employees.find((emp) => emp.email.includes(user?.role.toLowerCase()));
          setUserDetails(userDetail);
        } catch (error) {
          logger.error('Error loading user details:', error);
          // Fallback: use user from auth context
          setUserDetails({
            name:
              `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || user.role,
          });
        }
      } else {
        // For other roles, use user data from auth context directly
        setUserDetails({
          name:
            `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || user.role,
        });
      }
    };

    loadUserDetails();
  }, [user]);

  useEffect(() => {
    const loadClinicSettings = async () => {
      try {
        const result = await clinicSettingsService.getSettings();
        if (result.success && result.data) {
          const data = result.data.data || result.data;
          logger.debug('Loaded clinic settings:', {
            clinic_name: data.clinic_name,
            clinic_logo_url: data.clinic_logo_url,
          });
          setClinicSettings({
            clinic_name: data.clinic_name || null,
            clinic_logo_url: data.clinic_logo_url || null,
          });
        } else {
          logger.warn('Failed to load clinic settings:', result.error);
        }
      } catch (error) {
        logger.error('Error loading clinic settings:', error);
        // Use defaults if error
      }
    };

    loadClinicSettings();
  }, []);

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
          isActive: location.pathname === '/receptionist/dashboard',
        },
        {
          icon: Activity,
          label: 'Live Queue',
          path: '/receptionist/live-queue',
          isActive:
            location.pathname === '/receptionist/live-queue' ||
            location.pathname.includes('/receptionist/queue/'),
        },
        {
          icon: UserPlus,
          label: 'Register Patient',
          path: '/receptionist/register-patient',
          isActive: location.pathname === '/receptionist/register-patient',
        },
        {
          icon: Calendar,
          label: 'Appointments',
          path: '/receptionist/appointments',
          isActive: location.pathname === '/receptionist/appointments',
        },
        {
          icon: FileText,
          label: 'Patient Records',
          path: '/receptionist/patients',
          isActive: location.pathname === '/receptionist/patients',
        },
      ];
    }

    if (user?.role === ROLES.ADMIN) {
      return [
        {
          icon: Home,
          label: 'Dashboard',
          path: '/admin/dashboard',
          isActive: location.pathname === '/admin/dashboard',
        },
        {
          icon: Users,
          label: 'Manage Staff',
          path: '/admin/employees',
          isActive: location.pathname === '/admin/employees',
        },
        {
          icon: UserPlus,
          label: 'Patient Accounts',
          path: '/admin/patient-accounts',
          isActive: location.pathname === '/admin/patient-accounts',
        },
        {
          icon: Stethoscope,
          label: 'Doctor Availability',
          path: '/admin/schedules',
          isActive: location.pathname === '/admin/schedules',
        },
      ];
    }

    if (user?.role === ROLES.DOCTOR) {
      return [
        {
          icon: Home,
          label: 'Dashboard',
          path: '/doctor/dashboard',
          isActive: location.pathname === '/doctor/dashboard',
        },
        {
          icon: FileText,
          label: 'Medical Records',
          path: '/doctor/medical-records',
          isActive: location.pathname === '/doctor/medical-records',
        },
      ];
    }

    if (user?.role === 'nurse') {
      return [
        {
          icon: Home,
          label: 'Dashboard',
          path: '/nurse/dashboard',
          isActive: location.pathname === '/nurse/dashboard',
        },
        {
          icon: FileText,
          label: 'Patient Records',
          path: '/nurse/emr',
          isActive: location.pathname === '/nurse/emr',
        },
      ];
    }

    if (user?.role === 'cashier' || user?.role === 'pharmacist') {
      return [
        {
          icon: Home,
          label: 'Dashboard',
          path: '/cashier/dashboard',
          isActive: location.pathname === '/cashier/dashboard' || location.pathname === '/cashier',
        },
      ];
    }

    if (user?.role === 'patient') {
      return [
        {
          icon: Home,
          label: 'Dashboard',
          path: '/patient/dashboard',
          isActive: location.pathname === '/patient/dashboard',
        },
        {
          icon: Activity,
          label: 'Live Queue',
          path: '/patient/queue',
          isActive: location.pathname === '/patient/queue',
        },
        {
          icon: FileText,
          label: 'Medical Records',
          path: '/patient/medical-records',
          isActive: location.pathname === '/patient/medical-records',
        },
      ];
    }

    return [];
  };

  const navigationItems = getNavigationItems();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b-2 border-border backdrop-blur"
    >
      <div className="mx-auto flex h-20 w-full items-center justify-between px-3 sm:px-6 md:px-8">
        {/* Logo and Brand */}
        <motion.div
          className="flex min-w-0 cursor-pointer items-center gap-2 sm:gap-3"
          onClick={() =>
            navigate(
              user?.role === 'admin'
                ? '/admin/dashboard'
                : user?.role === 'cashier' || user?.role === 'pharmacist'
                  ? '/cashier/dashboard'
                  : user?.role === 'patient'
                    ? '/patient/dashboard'
                    : '/receptionist/dashboard'
            )
          }
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="flex shrink-0 items-center justify-center rounded-lg bg-primary p-2 transition-all hover:shadow-lg sm:rounded-xl sm:p-3"
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            {clinicSettings.clinic_logo_url ? (
              <img
                src={clinicSettings.clinic_logo_url}
                alt="Clinic Logo"
                className="h-5 max-h-full w-5 max-w-full object-contain sm:h-6 sm:w-6 md:h-7 md:w-7"
                style={{ display: 'block' }}
                onError={(e) => {
                  // Log error for debugging
                  logger.error('Failed to load clinic logo:', clinicSettings.clinic_logo_url);
                  // Hide image on error and show Heart icon as fallback
                  e.target.style.display = 'none';
                  const heartIcon = e.target.nextElementSibling;
                  if (heartIcon) {
                    heartIcon.classList.remove('hidden');
                  }
                }}
                onLoad={() => {
                  logger.debug('Clinic logo loaded successfully:', clinicSettings.clinic_logo_url);
                }}
              />
            ) : null}
            <Heart
              className={`h-5 w-5 text-primary-foreground sm:h-6 sm:w-6 md:h-7 md:w-7 ${
                clinicSettings.clinic_logo_url ? 'hidden' : ''
              }`}
            />
          </motion.div>
          <div className="hidden sm:block">
            {clinicSettings.clinic_name ? (
              <>
                <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
                  {clinicSettings.clinic_name}
                </h1>
                {APP_CONFIG.SHOW_SYSTEM_NAME_IN_NAVBAR && (
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {APP_CONFIG.SYSTEM_NAME} {APP_CONFIG.SYSTEM_DESCRIPTION}
                  </p>
                )}
              </>
            ) : (
              <>
                <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
                  {APP_CONFIG.SYSTEM_NAME}
                </h1>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {APP_CONFIG.SYSTEM_DESCRIPTION}
                </p>
              </>
            )}
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
              className="hidden items-center gap-2 lg:flex"
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
                      variant={item.isActive ? 'default' : 'ghost'}
                      size="lg"
                      onClick={() => navigate(item.path)}
                      className={`flex items-center gap-2 px-4 py-2 text-base font-medium transition-all ${
                        item.isActive
                          ? 'hover:bg-primary/90 bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
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
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 border-2 sm:h-12 sm:w-12"
                  >
                    <Menu className="h-5 w-5 text-muted-foreground sm:h-6 sm:w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel className="text-base font-semibold">
                    Navigation
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`cursor-pointer py-3 text-base ${
                          item.isActive ? 'bg-accent text-accent-foreground' : ''
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

          {/* Language Switcher - Only for non-admin roles */}
          {user?.role !== 'admin' && <LanguageSwitcher />}

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-10 items-center gap-2 border-2 border-border px-3 hover:bg-accent sm:h-12 sm:gap-3 sm:px-6"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative">
                    <UserCircle className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
                    <div
                      className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-background bg-green-500 sm:h-3 sm:w-3`}
                    ></div>
                  </div>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-medium text-foreground sm:text-base">
                      {userDetails?.name || user?.role}
                    </p>
                    <p className="text-xs text-muted-foreground sm:text-sm">{user?.role}</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
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
