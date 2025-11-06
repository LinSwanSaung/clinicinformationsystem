import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/library/feedback/ErrorState';
import AppointmentDetailModal from '@/components/AppointmentDetailModal';
import { Calendar, Clock, MapPin, Eye } from 'lucide-react';

const statusVariant = {
  confirmed: 'bg-green-100 text-green-800 border border-green-200',
  scheduled: 'bg-blue-100 text-blue-800 border border-blue-200',
  pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  default: 'bg-gray-100 text-gray-800 border border-gray-200'
};

// Myanmar date translation
const formatDateMyanmar = (date) => {
  const weekdays = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];
  const months = ['ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'];
  
  const weekday = weekdays[date.getDay()];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${weekday}၊ ${month} ${day}၊ ${year}`;
};

const AppointmentSkeleton = () => (
  <Card className="p-6">
    <Skeleton className="h-6 w-48 mb-6" />
    <div className="space-y-4">
      {[0, 1].map((idx) => (
        <div key={idx} className="rounded-lg border border-border/70 p-4 space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-56" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const AppointmentCard = ({ appointment, t, onViewDetails, i18n }) => {
  const appointmentDate = appointment?.appointment_date
    ? new Date(appointment.appointment_date)
    : null;
  
  const formattedDate = appointmentDate
    ? i18n.language === 'my'
      ? formatDateMyanmar(appointmentDate)
      : appointmentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
    : t('patient.appointmentsList.unknownDate');

  const status = appointment?.status?.toLowerCase() ?? 'default';
  const statusClass = statusVariant[status] ?? statusVariant.default;
  
  // Map status to translation keys
  const statusTranslationKey = {
    'confirmed': 'patient.appointmentsList.statusConfirmed',
    'scheduled': 'patient.appointmentsList.statusScheduled',
    'pending': 'patient.appointmentsList.statusPending',
    'default': 'patient.appointmentsList.statusDefault'
  }[status] || 'patient.appointmentsList.statusDefault';

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg border border-border/60 bg-background p-4 shadow-xs focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>{formattedDate}</span>
            {appointment?.appointment_time && (
              <>
                <span className="text-muted-foreground/70">•</span>
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>{appointment.appointment_time}</span>
              </>
            )}
          </div>
          <Badge className={statusClass}>{t(statusTranslationKey)}</Badge>
        </div>

        <div className="space-y-2">
          <p className="text-base font-semibold text-foreground">
            {appointment?.doctor
              ? `Dr. ${appointment.doctor.first_name} ${appointment.doctor.last_name}`
              : appointment?.doctor_name ?? t('patient.appointmentsList.unknownDoctor')}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>{appointment?.doctor?.specialty ?? appointment?.department ?? t('patient.appointmentsList.unknownDepartment')}</span>
          </div>
        </div>

        <div className="pt-2">
          <Button 
            variant="default" 
            size="sm"
            className="text-sm flex items-center gap-2"
            onClick={() => onViewDetails(appointment)}
          >
            <Eye className="h-4 w-4" />
            {t('patient.appointmentsList.viewDetails')}
          </Button>
        </div>
      </div>
    </motion.li>
  );
};

const UpcomingAppointments = ({ appointments, loading, error, onRetry }) => {
  const { t, i18n } = useTranslation();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };
  
  if (loading) {
    return <AppointmentSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message={t('patient.appointmentsList.errorTitle')}
        description={t('patient.appointmentsList.errorDescription')}
        onRetry={onRetry}
      />
    );
  }

  const items = Array.isArray(appointments) ? appointments : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">
              {t('patient.appointmentsList.title')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('patient.appointmentsList.subtitle')}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/10 p-6 text-center space-y-4">
              <p className="text-lg font-medium text-foreground">{t('patient.appointmentsList.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground">Please contact the reception to book an appointment</p>
            </div>
          ) : (
            <>
              <div className="max-h-[400px] overflow-y-auto pr-2">
                <ul className="space-y-3">
                  <AnimatePresence>
                    {items.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        t={t}
                        i18n={i18n}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
              <div className="mt-4 md:hidden">
                <Button variant="default" className="w-full">
                  {t('patient.appointmentsList.book')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AppointmentDetailModal
        appointment={selectedAppointment}
        patient={null}
        doctor={selectedAppointment?.doctor || null}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </motion.div>
  );
};

export default UpcomingAppointments;

