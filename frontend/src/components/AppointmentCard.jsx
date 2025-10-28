import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  User,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
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
  className = ""
}) => {
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
      className={`bg-background border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-200 ${
        isOverdue ? 'border-orange-200 bg-orange-50' : 'border-border'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isOverdue ? 'bg-orange-500' : 'bg-primary'
            }`}></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-semibold text-foreground text-sm sm:text-base truncate">
                    {appointment.patient_name}
                  </span>
                </div>
                {isOverdue && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center"
                  >
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  </motion.div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span>{appointment.appointment_time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Stethoscope className="h-3 w-3 flex-shrink-0" />
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-medium truncate">
                    {appointment.doctor_name}
                  </span>
                </div>
                <span className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-xs font-medium truncate">
                  {appointment.visit_type}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Badge className={`${getStatusColor(appointment.status)} flex items-center gap-1 w-fit`}>
            <StatusIcon className="h-3 w-3" />
            <span className="text-xs">
              {getStatusDisplayName(appointment.status)}
            </span>
          </Badge>

          {showActions && actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs px-2 h-7"
                >
                  <MoreHorizontal className="h-3 w-3" />
                  <span className="hidden sm:inline">Actions</span>
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
                    <action.icon className="h-3 w-3 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {appointment.status === 'ready' && (
            <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
              <span className="hidden sm:inline">✓ Ready/Checked In</span>
              <span className="sm:hidden">✓ Ready</span>
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AppointmentCard;
