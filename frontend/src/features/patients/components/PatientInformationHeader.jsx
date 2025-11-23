import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Phone, Mail } from 'lucide-react';

const PatientInformationHeader = ({
  patient,
  onBackClick,
  onClearSelection,
  showBackButton = true,
  showClearButton = true,
  className = '',
}) => {
  // Format patient name
  const fullName = patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
  const initials =
    patient.initials ||
    `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center space-x-6">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white ${patient.avatarColor || 'bg-blue-500'}`}
        >
          {initials}
        </div>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
            <div className="flex space-x-3">
              {showBackButton && onBackClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackClick}
                  className="px-4 py-2 text-sm"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Search
                </Button>
              )}
              {showClearButton && onClearSelection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSelection}
                  className="px-4 py-2 text-sm"
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="text-muted-foreground">Patient ID:</span>
              <p className="font-medium text-foreground">{patient.patient_number || patient.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Age:</span>
              <p className="font-medium text-foreground">
                {patient.age ||
                  (patient.date_of_birth
                    ? Math.floor(
                        (new Date() - new Date(patient.date_of_birth)) /
                          (365.25 * 24 * 60 * 60 * 1000)
                      )
                    : 'N/A')}{' '}
                years
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Gender:</span>
              <p className="font-medium text-foreground">{patient.gender}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Blood Type:</span>
              <p className="font-medium text-foreground">
                {patient.blood_group || patient.bloodType || 'Not specified'}
              </p>
            </div>
          </div>

          {(patient.phone || patient.email) && (
            <div className="mt-4 flex space-x-6">
              {patient.phone && (
                <div className="flex items-center space-x-2">
                  <Phone size={16} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center space-x-2">
                  <Mail size={16} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{patient.email}</span>
                </div>
              )}
            </div>
          )}

          {patient.urgency && (
            <div className="mt-4">
              <Badge className="bg-orange-100 px-3 py-1 text-sm text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">
                Priority: {patient.urgency}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PatientInformationHeader;
