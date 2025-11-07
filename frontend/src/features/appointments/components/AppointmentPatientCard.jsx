import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Stethoscope,
  Phone,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
  UserCircle,
  Mail,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const AppointmentPatientCard = ({
  appointment,
  patient,
  doctor,
  onCancel,
  onReschedule,
  onViewDetails,
  className = '',
  index = 0,
}) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Get status color and icon
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return Clock;
      case 'confirmed':
        return CheckCircle;
      case 'in_progress':
        return Activity;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      case 'no_show':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const StatusIcon = getStatusIcon(appointment.status);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    // Convert 24hr to 12hr format
    const [hours, minutes] = time.split(':');
    const hour12 = ((parseInt(hours) + 11) % 12) + 1;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(appointment.id);
    }
    setShowCancelDialog(false);
  };

  if (!patient || !doctor) {
    return (
      <Card className="border-border p-4">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="mx-auto mb-2 h-8 w-8" />
          <p>Patient or doctor information not found</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
        whileHover={{ y: -2 }}
        className={className}
      >
        <Card className="border-border bg-card transition-all duration-200 hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex-shrink-0 rounded-full p-2">
                  <UserCircle className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-sm sm:text-base lg:text-lg">
                    {patient.first_name} {patient.last_name}
                  </CardTitle>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-2 sm:text-sm">
                    <span className="truncate">#{patient.patient_number}</span>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span>{formatTime(appointment.appointment_time)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Badge
                className={`${getStatusColor(appointment.status)} flex w-fit flex-shrink-0 items-center gap-1`}
              >
                <StatusIcon className="h-3 w-3" />
                <span className="text-xs sm:text-sm">
                  {appointment.status.charAt(0).toUpperCase() +
                    appointment.status.slice(1).replace('_', ' ')}
                </span>
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Patient Contact Info */}
              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 sm:text-sm">
                {patient.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                    <span className="truncate">{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
              </div>

              {/* Doctor and Appointment Info */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50 text-xs text-blue-700"
                >
                  <Stethoscope className="mr-1 h-3 w-3" />
                  <span className="truncate">
                    Dr. {doctor.first_name} {doctor.last_name}
                  </span>
                </Badge>
                {doctor.specialty && (
                  <Badge
                    variant="outline"
                    className="border-purple-200 bg-purple-50 text-xs text-purple-700"
                  >
                    <span className="truncate">{doctor.specialty}</span>
                  </Badge>
                )}
                {appointment.appointment_type && (
                  <Badge
                    variant="outline"
                    className="border-green-200 bg-green-50 text-xs text-green-700"
                  >
                    <span className="truncate">{appointment.appointment_type}</span>
                  </Badge>
                )}
              </div>

              {/* Patient Medical Info */}
              {(patient.blood_group || patient.allergies) && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {patient.blood_group && (
                    <Badge
                      variant="outline"
                      className="border-red-200 bg-red-50 text-xs text-red-700"
                    >
                      Blood: {patient.blood_group}
                    </Badge>
                  )}
                  {patient.allergies && (
                    <Badge
                      variant="outline"
                      className="border-orange-200 bg-orange-50 text-orange-700"
                    >
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Allergies: {patient.allergies}
                    </Badge>
                  )}
                </div>
              )}

              {/* Appointment Notes */}
              {appointment.notes && (
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm text-muted-foreground">
                    <FileText className="mr-2 inline h-4 w-4" />
                    {appointment.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 border-t border-border pt-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails?.(appointment)}
                  className="w-full sm:flex-1"
                >
                  <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">View Details</span>
                </Button>

                {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReschedule?.(appointment)}
                      className="w-full sm:flex-1"
                    >
                      <RotateCcw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Reschedule</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCancelDialog(true)}
                      className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 sm:flex-1"
                    >
                      <XCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Cancel</span>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Cancel Appointment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment for {patient.first_name}{' '}
              {patient.last_name}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-md p-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(appointment.appointment_date)}</span>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>{formatTime(appointment.appointment_time)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <Stethoscope className="h-4 w-4" />
                <span>
                  Dr. {doctor.first_name} {doctor.last_name}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                className="flex-1"
              >
                Keep Appointment
              </Button>
              <Button variant="destructive" onClick={handleCancel} className="flex-1">
                Cancel Appointment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentPatientCard;
