import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Clock, User, Stethoscope, AlertCircle, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AppointmentCard = ({
  appointment,
  index = 0,
  onStatusUpdate,
  actions = [],
  getStatusColor,
  getStatusIcon,
  getStatusDisplayName,
  isAppointmentOverdue,
  showActions = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const StatusIcon = getStatusIcon(appointment.status);
  const isOverdue = isAppointmentOverdue ? isAppointmentOverdue(appointment) : false;

  return (
    <motion.div
      key={appointment.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className={`rounded-lg border bg-background p-3 transition-all duration-200 hover:shadow-md sm:p-4 ${
        isOverdue
          ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30'
          : 'border-border'
      } ${className}`}
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div
              className={`h-2 w-2 flex-shrink-0 rounded-full ${
                isOverdue ? 'bg-orange-500' : 'bg-primary'
              }`}
            ></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 flex-shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                  <span className="truncate text-sm font-semibold text-foreground sm:text-base">
                    {appointment.patient_name}
                  </span>
                </div>
                {isOverdue && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center"
                  >
                    <Badge className="border-orange-200 bg-orange-100 text-xs text-orange-800 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-200">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {t('receptionist.appointment.overdue')}
                    </Badge>
                  </motion.div>
                )}
              </div>
              <div className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-4 sm:text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span>{appointment.appointment_time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Stethoscope className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
                    {appointment.doctor_name}
                  </span>
                </div>
                <span className="truncate rounded-md border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                  {appointment.appointment_type ||
                    appointment.visit_type ||
                    t('receptionist.dashboard.consultation')}
                </span>
              </div>
              {appointment.reason_for_visit && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium">{t('receptionist.appointment.reason')}:</span>{' '}
                  {appointment.reason_for_visit}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Badge className={`${getStatusColor(appointment.status)} flex w-fit items-center gap-1`}>
            <StatusIcon className="h-3 w-3" />
            <span className="text-xs">{getStatusDisplayName(appointment.status)}</span>
          </Badge>

          {showActions && actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex h-7 items-center gap-1 px-2 text-xs"
                >
                  <MoreHorizontal className="h-3 w-3" />
                  <span className="hidden sm:inline">{t('receptionist.dashboard.actions')}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {actions.map((action, actionIndex) => (
                  <DropdownMenuItem
                    key={actionIndex}
                    onClick={() => onStatusUpdate(appointment.id, action.value)}
                    className={`text-xs ${action.className}`}
                  >
                    <action.icon className="mr-2 h-3 w-3" />
                    {action.labelKey ? t(action.label) : action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {(appointment.status === 'waiting' || appointment.status === 'ready_for_doctor') && (
            <Badge className="border-green-200 bg-green-50 text-xs text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200">
              <span className="hidden sm:inline">
                ✓ {t('receptionist.appointment.readyCheckedIn')}
              </span>
              <span className="sm:hidden">✓ {t('receptionist.walkIn.available')}</span>
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AppointmentCard;
