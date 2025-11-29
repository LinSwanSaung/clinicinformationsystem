import { useTranslation } from 'react-i18next';
import { X, User, Stethoscope, Clock, FileText, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const AppointmentDetailModal = ({ appointment, patient, doctor, isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen || !appointment) {
    return null;
  }

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      waiting: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      scheduled: t('receptionist.appointmentDetailModal.statusScheduled'),
      waiting: t('receptionist.appointmentDetailModal.statusWaiting'),
      in_progress: t('receptionist.appointmentDetailModal.statusSeeingDoctor'),
      completed: t('receptionist.appointmentDetailModal.statusCompleted'),
      cancelled: t('receptionist.appointmentDetailModal.statusCancelled'),
      no_show: t('receptionist.appointmentDetailModal.statusNoShow'),
    };
    return labels[status] || status;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">
            {t('receptionist.appointmentDetailModal.title')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Appointment Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t('receptionist.appointmentDetailModal.appointmentInfo')}
              </h3>
              <Badge className={getStatusColor(appointment.status)}>
                {getStatusLabel(appointment.status)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{appointment.appointment_time}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(appointment.appointment_date || appointment.date)}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-medium">
                  {t('receptionist.appointmentDetailModal.type')}: {appointment.appointment_type}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('receptionist.appointmentDetailModal.duration')}:{' '}
                  {appointment.duration_minutes || 30}{' '}
                  {t('receptionist.appointmentDetailModal.minutes')}
                </p>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="space-y-4">
            <h3 className="flex items-center space-x-2 text-lg font-semibold">
              <User className="h-5 w-5" />
              <span>{t('receptionist.appointmentDetailModal.patientInfo')}</span>
            </h3>

            {patient ? (
              <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                <p className="text-lg font-medium">
                  {patient.first_name} {patient.last_name}
                </p>
                {patient.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.patient_number && (
                  <p className="text-sm text-muted-foreground">
                    {t('receptionist.appointmentDetailModal.patientId')}: {patient.patient_number}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                {t('receptionist.appointmentDetailModal.patientNotAvailable')}
              </p>
            )}
          </div>

          {/* Doctor Info */}
          <div className="space-y-4">
            <h3 className="flex items-center space-x-2 text-lg font-semibold">
              <Stethoscope className="h-5 w-5" />
              <span>{t('receptionist.appointmentDetailModal.doctorInfo')}</span>
            </h3>

            {doctor ? (
              <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                <p className="text-lg font-medium">
                  Dr. {doctor.first_name} {doctor.last_name}
                </p>
                {doctor.specialty && <p className="text-muted-foreground">{doctor.specialty}</p>}
                {doctor.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{doctor.email}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                {t('receptionist.appointmentDetailModal.doctorNotAvailable')}
              </p>
            )}
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="space-y-4">
              <h3 className="flex items-center space-x-2 text-lg font-semibold">
                <FileText className="h-5 w-5" />
                <span>{t('receptionist.appointmentDetailModal.notes')}</span>
              </h3>

              <div className="bg-muted/50 rounded-lg p-4">
                <p>{appointment.notes}</p>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end border-t pt-4">
            <Button onClick={onClose}>{t('common.close')}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentDetailModal;
