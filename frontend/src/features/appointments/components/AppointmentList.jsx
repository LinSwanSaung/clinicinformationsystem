import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import AppointmentCard from './AppointmentCard';

const AppointmentList = ({
  appointments = [],
  onStatusUpdate,
  getStatusColor,
  getStatusIcon,
  getStatusDisplayName,
  isAppointmentOverdue,
  actions = [],
  emptyStateMessage = 'No appointments found',
  emptyStateSubMessage = 'Try adjusting your search or filter criteria',
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <AnimatePresence mode="popLayout">
        {appointments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 text-center text-muted-foreground"
          >
            <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg">{emptyStateMessage}</p>
            <p className="text-sm">{emptyStateSubMessage}</p>
          </motion.div>
        ) : (
          appointments.map((appointment, index) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              index={index}
              onStatusUpdate={onStatusUpdate}
              actions={actions}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              getStatusDisplayName={getStatusDisplayName}
              isAppointmentOverdue={isAppointmentOverdue}
              showActions={actions.length > 0}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppointmentList;
