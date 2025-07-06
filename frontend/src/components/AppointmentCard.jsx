import React from 'react';
import { Clock, User, Stethoscope, FileText, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const AppointmentCard = ({ 
  appointment, 
  patient, 
  doctor, 
  onStatusChange, 
  onViewDetails,
  userRole = 'receptionist' // Default to receptionist role
}) => {
  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'waiting': 'bg-yellow-100 text-yellow-800',
      'ready_for_doctor': 'bg-blue-100 text-blue-800',
      'consulting': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
      'no_show': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'scheduled': 'Scheduled',
      'waiting': 'Waiting',
      'ready_for_doctor': 'Ready for Doctor',
      'consulting': 'Consulting',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'no_show': 'No Show'
    };
    return labels[status] || status;
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'scheduled': 'waiting',  // Reception marks patient as ready/waiting
      'waiting': 'ready_for_doctor',
      'ready_for_doctor': 'consulting',
      'consulting': 'completed'
    };
    return statusFlow[currentStatus];
  };

  const canAdvanceStatus = (status) => {
    // Receptionists can only mark patients as waiting, other status changes are for doctors/nurses
    if (userRole === 'receptionist') {
      return status === 'scheduled'; // Can only move from scheduled to waiting
    }
    return ['scheduled', 'waiting', 'ready_for_doctor', 'consulting'].includes(status);
  };

  const getButtonText = (status) => {
    if (userRole === 'receptionist') {
      if (status === 'scheduled') return 'Mark Ready'; // Changed from "Mark Waiting" to "Mark Ready"
      return null; // No button for other statuses
    }
    
    // For doctors/nurses
    switch (status) {
      case 'scheduled': return 'Mark Ready';
      case 'waiting': return 'Mark Ready for Doctor';
      case 'ready_for_doctor': return 'Start Consultation';
      case 'consulting': return 'Complete';
      default: return null;
    }
  };

  const handleStatusAdvance = async () => {
    try {
      const nextStatus = getNextStatus(appointment.status);
      if (nextStatus) {
        console.log('Updating appointment status:', { id: appointment.id, from: appointment.status, to: nextStatus });
        await onStatusChange(appointment.id, nextStatus);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Failed to update appointment status: ' + error.message);
    }
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {appointment.appointment_time}
              </h3>
              <p className="text-sm text-muted-foreground">
                {appointment.appointment_type}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(appointment.status)}>
            {getStatusLabel(appointment.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Patient Info */}
        <div className="flex items-center space-x-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">
              {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'}
            </p>
            {patient?.phone && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{patient.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Info */}
        <div className="flex items-center space-x-3">
          <Stethoscope className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">
              {doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor'}
            </p>
            {doctor?.specialty && (
              <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="flex items-start space-x-3">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">{appointment.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(appointment)}
          >
            View Details
          </Button>
          
          {canAdvanceStatus(appointment.status) && getButtonText(appointment.status) && (
            <Button
              size="sm"
              onClick={handleStatusAdvance}
              className="bg-primary hover:bg-primary/90"
            >
              {getButtonText(appointment.status)}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;
