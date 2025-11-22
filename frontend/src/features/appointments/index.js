// Pages
export { default as AppointmentsPage } from './pages/AppointmentsPage';

// Components
export { default as AppointmentCard } from './components/AppointmentCard';
export { default as AppointmentList } from './components/AppointmentList';
export { default as AppointmentDetailModal } from './components/AppointmentDetailModal';
export { default as AppointmentPatientCard } from './components/AppointmentPatientCard';
export { default as AvailableDoctors } from './components/AvailableDoctors';
export { default as ServiceSelector } from './components/ServiceSelector';
export { default as WalkInModal } from './components/WalkInModal';

// Hooks
export { useAppointments } from './hooks/useAppointments';
export { useCreateAppointment } from './hooks/useCreateAppointment';
export { useCancelAppointment } from './hooks/useCancelAppointment';
export { useUpdateAppointmentStatus } from './hooks/useUpdateAppointmentStatus';

// Services
export { default as appointmentService } from './services/appointmentService';
export { default as doctorAvailabilityService } from './services/doctorAvailabilityService';
