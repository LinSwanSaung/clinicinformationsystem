import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { allergyService } from '@/features/medical';
import logger from '@/utils/logger';

export default function ReceptionistPatientCard({ patient, onBookAppointment }) {
  const navigate = useNavigate();
  const [allergies, setAllergies] = useState([]);
  const [loadingAllergies, setLoadingAllergies] = useState(false);

  // Load patient allergies
  useEffect(() => {
    const loadAllergies = async () => {
      if (patient?.id) {
        try {
          setLoadingAllergies(true);
          const allergiesData = await allergyService.getAllergiesByPatient(patient.id);
          setAllergies(Array.isArray(allergiesData) ? allergiesData : []);
        } catch (error) {
          logger.error('Error loading allergies:', error);
          setAllergies([]);
        } finally {
          setLoadingAllergies(false);
        }
      }
    };

    loadAllergies();
  }, [patient?.id]);

  const handleBookAppointment = () => {
    if (onBookAppointment) {
      onBookAppointment(patient);
    }
  };

  const handleViewRecords = () => {
    navigate(`/receptionist/patients/${patient.id}`);
  };

  return (
    <Card className="border border-border bg-card p-3 transition-colors hover:bg-accent hover:text-accent-foreground sm:p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4 md:gap-6">
          <div className="shrink-0 rounded-full bg-muted p-2 sm:p-2.5 md:p-3">
            <UserCircle className="h-8 w-8 text-primary sm:h-12 sm:w-12 md:h-16 md:w-16" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 break-words text-base font-semibold text-card-foreground sm:mb-2 sm:text-lg md:text-2xl">
              {patient.first_name} {patient.last_name}
            </h3>
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <p className="break-all text-xs text-muted-foreground sm:text-sm md:text-lg">
                Patient #: {patient.patient_number}
              </p>
              <p className="break-all text-xs text-muted-foreground sm:text-sm md:text-lg">
                Phone: {patient.phone || 'N/A'}
              </p>
              <p className="break-all text-xs text-muted-foreground sm:text-sm md:text-lg">
                Email: {patient.email || 'N/A'}
              </p>
              <div className="mt-2 flex flex-wrap gap-1 sm:mt-2.5 sm:gap-1.5 md:mt-3 md:gap-2">
                {patient.blood_group && (
                  <Badge
                    variant="secondary"
                    className="bg-secondary px-2 py-0.5 text-xs text-secondary-foreground sm:px-3 sm:py-0.5 sm:text-sm md:px-4 md:py-1 md:text-base"
                  >
                    Blood: {patient.blood_group}
                  </Badge>
                )}

                {/* Display all allergies from database */}
                {!loadingAllergies && allergies && allergies.length > 0 ? (
                  <>
                    {allergies.map((allergy, index) => (
                      <Badge
                        key={allergy.id || index}
                        variant="destructive"
                        className={`px-2 py-0.5 text-xs sm:px-3 sm:py-0.5 sm:text-sm md:px-4 md:py-1 md:text-base ${
                          allergy.severity === 'life-threatening'
                            ? 'bg-red-600 hover:bg-red-700'
                            : allergy.severity === 'severe'
                              ? 'bg-red-500 hover:bg-red-600'
                              : allergy.severity === 'moderate'
                                ? 'bg-orange-500 hover:bg-orange-600'
                                : 'bg-red-400 hover:bg-red-500'
                        }`}
                      >
                        Allergies: {allergy.allergy_name} ({allergy.severity || 'mild'})
                      </Badge>
                    ))}
                  </>
                ) : !loadingAllergies && patient.allergies ? (
                  /* Fallback to old text field if no allergies in database */
                  <Badge
                    variant="destructive"
                    className="px-2 py-0.5 text-xs sm:px-3 sm:py-0.5 sm:text-sm md:px-4 md:py-1 md:text-base"
                  >
                    Allergies: {patient.allergies}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 md:gap-4">
          <Button
            variant="outline"
            size="sm"
            className="flex flex-1 items-center gap-2 border-border px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground sm:flex-none sm:gap-2.5 sm:px-6 sm:py-4 sm:text-sm md:gap-3 md:px-8 md:py-6 md:text-lg"
            onClick={handleBookAppointment}
          >
            <Calendar className="h-3 w-3 text-primary sm:h-4 sm:w-4 md:h-6 md:w-6" />
            <span className="sm:hidden">Book</span>
            <span className="hidden sm:inline">Book Appointment</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-1 items-center gap-2 border-border px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground sm:flex-none sm:gap-2.5 sm:px-6 sm:py-4 sm:text-sm md:gap-3 md:px-8 md:py-6 md:text-lg"
            onClick={handleViewRecords}
          >
            <FileText className="h-3 w-3 text-primary sm:h-4 sm:w-4 md:h-6 md:w-6" />
            <span className="sm:hidden">Records</span>
            <span className="hidden sm:inline">View Records</span>
          </Button>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-1 sm:pt-3 md:gap-x-8 md:gap-y-2 md:pt-4">
          <p className="text-xs text-muted-foreground sm:text-sm md:text-lg">
            DOB:{' '}
            {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground sm:text-sm md:text-lg">
            Gender: {patient.gender || 'N/A'}
          </p>
          <p className="break-words text-xs text-muted-foreground sm:text-sm md:text-lg">
            Address: {patient.address || 'N/A'}
          </p>
        </div>
      </div>
    </Card>
  );
}
