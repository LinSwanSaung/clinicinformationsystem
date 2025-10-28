import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  UserCheck,
  FileText,
  Stethoscope
} from 'lucide-react';

// Status configurations for different roles
export const STATUS_CONFIGS = {
  // Receptionist actions
  receptionist: {
    actions: (appointment) => [
      ...(appointment.status !== 'ready' ? [{
        label: 'Ready/Check In',
        value: 'ready',
        icon: CheckCircle,
        className: 'text-green-600 focus:text-green-600'
      }] : []),
      ...(appointment.status !== 'late' ? [{
        label: 'Mark as Late',
        value: 'late',
        icon: AlertTriangle,
        className: 'text-yellow-600 focus:text-yellow-600'
      }] : []),
      ...(appointment.status !== 'no-show' ? [{
        label: 'Mark as No Show',
        value: 'no-show',
        icon: XCircle,
        className: 'text-red-600 focus:text-red-600'
      }] : [])
    ],
    showActions: (appointment) => appointment.status !== 'ready'
  },

  // Doctor actions (for future doctor queue implementation)
  doctor: {
    actions: (appointment) => [
      ...(appointment.status === 'ready' ? [{
        label: 'Start Consultation',
        value: 'consulting',
        icon: Stethoscope,
        className: 'text-blue-600 focus:text-blue-600'
      }] : []),
      ...(appointment.status === 'consulting' ? [{
        label: 'Complete Consultation',
        value: 'completed',
        icon: CheckCircle,
        className: 'text-green-600 focus:text-green-600'
      }] : []),
      ...(appointment.status !== 'no-show' && appointment.status !== 'completed' ? [{
        label: 'Mark as No Show',
        value: 'no-show',
        icon: XCircle,
        className: 'text-red-600 focus:text-red-600'
      }] : [])
    ],
    showActions: (appointment) => ['ready', 'consulting'].includes(appointment.status)
  },

  // Nurse actions (for future nurse interface)
  nurse: {
    actions: (appointment) => [
      ...(appointment.status === 'ready' ? [{
        label: 'Take Vitals',
        value: 'vitals-taken',
        icon: UserCheck,
        className: 'text-blue-600 focus:text-blue-600'
      }] : []),
      ...(appointment.status === 'vitals-taken' ? [{
        label: 'Ready for Doctor',
        value: 'ready-for-doctor',
        icon: CheckCircle,
        className: 'text-green-600 focus:text-green-600'
      }] : [])
    ],
    showActions: (appointment) => ['ready', 'vitals-taken'].includes(appointment.status)
  }
};

// Status display configurations
export const getStatusColor = (status) => {
  switch (status) {
    case 'ready': return 'bg-green-100 text-green-800 border-green-200';
    case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'no-show': return 'bg-red-100 text-red-800 border-red-200';
    case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'consulting': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'vitals-taken': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'ready-for-doctor': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusIcon = (status) => {
  switch (status) {
    case 'ready': return CheckCircle;
    case 'late': return AlertTriangle;
    case 'no-show': return XCircle;
    case 'pending': return Clock;
    case 'consulting': return Stethoscope;
    case 'completed': return CheckCircle;
    case 'vitals-taken': return UserCheck;
    case 'ready-for-doctor': return CheckCircle;
    default: return Clock;
  }
};

export const getStatusDisplayName = (status) => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'ready': return 'Ready/Checked In';
    case 'late': return 'Late';
    case 'no-show': return 'No Show';
    case 'consulting': return 'Consulting';
    case 'completed': return 'Completed';
    case 'vitals-taken': return 'Vitals Taken';
    case 'ready-for-doctor': return 'Ready for Doctor';
    default: return 'Unknown';
  }
};

// Helper function to get actions for a role
export const getActionsForRole = (role, appointment) => {
  const config = STATUS_CONFIGS[role];
  return config ? config.actions(appointment) : [];
};

// Helper function to check if actions should be shown
export const shouldShowActions = (role, appointment) => {
  const config = STATUS_CONFIGS[role];
  return config ? config.showActions(appointment) : false;
};