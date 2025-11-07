import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Calendar, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
    <Card className="p-3 sm:p-4 md:p-6 bg-card hover:bg-accent hover:text-accent-foreground transition-colors border border-border">
      <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 md:gap-6">
          <div className="rounded-full bg-muted p-2 sm:p-2.5 md:p-3 shrink-0">
            <UserCircle className="h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg md:text-2xl font-semibold text-card-foreground mb-1 sm:mb-2 break-words">
              {patient.first_name} {patient.last_name}
            </h3>
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <p className="text-xs sm:text-sm md:text-lg text-muted-foreground break-all">
                Patient #: {patient.patient_number}
              </p>
              <p className="text-xs sm:text-sm md:text-lg text-muted-foreground break-all">
                Phone: {patient.phone || 'N/A'}
              </p>
              <p className="text-xs sm:text-sm md:text-lg text-muted-foreground break-all">
                Email: {patient.email || 'N/A'}
              </p>
              <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 mt-2 sm:mt-2.5 md:mt-3">
                {patient.blood_group && (
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground px-2 sm:px-3 md:px-4 py-0.5 sm:py-0.5 md:py-1 text-xs sm:text-sm md:text-base">
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
                        className={`px-2 sm:px-3 md:px-4 py-0.5 sm:py-0.5 md:py-1 text-xs sm:text-sm md:text-base ${
                          allergy.severity === 'life-threatening' ? 'bg-red-600 hover:bg-red-700' :
                          allergy.severity === 'severe' ? 'bg-red-500 hover:bg-red-600' :
                          allergy.severity === 'moderate' ? 'bg-orange-500 hover:bg-orange-600' :
                          'bg-red-400 hover:bg-red-500'
                        }`}
                      >
                        Allergies: {allergy.allergy_name} ({allergy.severity || 'mild'})
                      </Badge>
                    ))}
                  </>
                ) : !loadingAllergies && patient.allergies ? (
                  /* Fallback to old text field if no allergies in database */
                  <Badge variant="destructive" className="px-2 sm:px-3 md:px-4 py-0.5 sm:py-0.5 md:py-1 text-xs sm:text-sm md:text-base">
                    Allergies: {patient.allergies}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 sm:gap-2.5 md:gap-3 border-border hover:bg-accent hover:text-accent-foreground text-xs sm:text-sm md:text-lg py-2 sm:py-4 md:py-6 px-3 sm:px-6 md:px-8 flex-1 sm:flex-none"
            onClick={handleBookAppointment}
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6 text-primary" />
            <span className="sm:hidden">Book</span>
            <span className="hidden sm:inline">Book Appointment</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 sm:gap-2.5 md:gap-3 border-border hover:bg-accent hover:text-accent-foreground text-xs sm:text-sm md:text-lg py-2 sm:py-4 md:py-6 px-3 sm:px-6 md:px-8 flex-1 sm:flex-none"
            onClick={handleViewRecords}
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6 text-primary" />
            <span className="sm:hidden">Records</span>
            <span className="hidden sm:inline">View Records</span>
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-x-6 md:gap-x-8 sm:gap-y-1 md:gap-y-2 pt-2 sm:pt-3 md:pt-4 border-t border-border">
          <p className="text-xs sm:text-sm md:text-lg text-muted-foreground">
            DOB: {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
          </p>
          <p className="text-xs sm:text-sm md:text-lg text-muted-foreground">Gender: {patient.gender || 'N/A'}</p>
          <p className="text-xs sm:text-sm md:text-lg text-muted-foreground break-words">Address: {patient.address || 'N/A'}</p>
        </div>
      </div>
    </Card>
  );
}
