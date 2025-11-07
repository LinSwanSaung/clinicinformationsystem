import { Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const Breadcrumbs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Generate breadcrumb items based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Add home/dashboard as first item
    if (user?.role) {
      breadcrumbs.push({
        label: 'Dashboard',
        path: `/${user.role}/dashboard`,
        icon: Home,
      });
    }

    // Map path segments to readable labels
    const pathMap = {
      'register-patient': 'Register Patient',
      appointments: 'Appointments',
      patients: 'Patient Records',
      employees: 'Employee Management',
      schedules: 'Doctor Schedules',
      emr: 'Medical Records',
      'patient-record': 'Patient Medical Record',
      queue: 'Queue',
      'live-queue': 'Live Queue',
    };

    // Add subsequent breadcrumbs
    pathSegments.forEach((segment, index) => {
      if (segment !== user?.role && segment !== 'dashboard') {
        const label =
          pathMap[segment] || segment.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

        // Special handling for doctor queue routes
        if (pathSegments[index - 1] === 'queue' && segment.length > 20) {
          // This is likely a doctor UUID, try to get doctor name from context
          // For now, we'll skip this segment and let the page title handle it
          return;
        }

        const path = '/' + pathSegments.slice(0, index + 1).join('/');

        breadcrumbs.push({
          label,
          path,
          icon: null,
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on dashboard pages
  if (location.pathname.endsWith('/dashboard') || breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex items-center space-x-2 text-sm text-muted-foreground"
      role="navigation"
      aria-label="Breadcrumb"
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const Icon = crumb.icon;

        return (
          <Fragment key={crumb.path}>
            <motion.button
              onClick={() => !isLast && navigate(crumb.path)}
              className={`flex items-center gap-1 transition-colors duration-200 ${
                isLast
                  ? 'cursor-default font-medium text-foreground'
                  : 'cursor-pointer hover:text-foreground'
              }`}
              whileHover={!isLast ? { scale: 1.05 } : {}}
              whileTap={!isLast ? { scale: 0.95 } : {}}
              disabled={isLast}
              aria-current={isLast ? 'page' : undefined}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{crumb.label}</span>
            </motion.button>

            {!isLast && <ChevronRight className="text-muted-foreground/50 h-4 w-4" />}
          </Fragment>
        );
      })}
    </motion.nav>
  );
};

export default Breadcrumbs;
