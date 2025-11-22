import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  UserCheck,
  Stethoscope
} from 'lucide-react';

// Status configurations for different roles
export const STATUS_CONFIGS = {
  // Receptionist actions
  receptionist: {
    actions: (appointment) => {
      const actions = [];
      
      // Ready/Check In - for scheduled or late appointments
      if (['scheduled', 'late'].includes(appointment.status)) {
        actions.push({
          label: appointment.status === 'late' ? 'Check In (Late)' : 'Ready/Check In',
          value: 'mark-ready',
          icon: CheckCircle,
          className: 'text-green-600 focus:text-green-600'
        });
      }
      
      // Mark as Late - only for scheduled appointments (not already marked late)
      if (appointment.status === 'scheduled') {
        actions.push({
          label: 'Mark as Late',
          value: 'mark-late',
          icon: AlertTriangle,
          className: 'text-yellow-600 focus:text-yellow-600'
        });
      }
      
      // Mark as No Show - for any appointment that's not already no-show or completed
      if (!['no_show', 'completed', 'consulting', 'waiting', 'ready_for_doctor'].includes(appointment.status)) {
        actions.push({
          label: 'Mark as No Show',
          value: 'mark-no-show',
          icon: XCircle,
          className: 'text-red-600 focus:text-red-600'
        });
      }
      
      return actions;
    },
    showActions: (appointment) => {
      // Show actions for scheduled, late appointments (pending action)
      // Once checked in (waiting/ready_for_doctor), no more receptionist actions needed
      return ['scheduled', 'late'].includes(appointment.status);
    }
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
    case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'waiting': return 'bg-green-100 text-green-800 border-green-200';
    case 'ready_for_doctor': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'no_show': return 'bg-red-100 text-red-800 border-red-200';
    case 'consulting': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled': return 'bg-gray-100 text-gray-600 border-gray-200';
    // Legacy statuses
    case 'ready': return 'bg-green-100 text-green-800 border-green-200';
    case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'no-show': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusIcon = (status) => {
  switch (status) {
    case 'scheduled': return Clock;
    case 'waiting': return CheckCircle;
    case 'ready_for_doctor': return CheckCircle;
    case 'late': return AlertTriangle;
    case 'no_show': return XCircle;
    case 'consulting': return Stethoscope;
    case 'completed': return CheckCircle;
    case 'cancelled': return XCircle;
    // Legacy statuses
    case 'ready': return CheckCircle;
    case 'pending': return Clock;
    case 'no-show': return XCircle;
    default: return Clock;
  }
};

export const getStatusDisplayName = (status) => {
  switch (status) {
    case 'scheduled': return 'Scheduled';
    case 'waiting': return 'Checked In';
    case 'ready_for_doctor': return 'Ready for Doctor';
    case 'late': return 'Late';
    case 'no_show': return 'No Show';
    case 'consulting': return 'Consulting';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    // Legacy statuses
    case 'pending': return 'Pending';
    case 'ready': return 'Ready/Checked In';
    case 'no-show': return 'No Show';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
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