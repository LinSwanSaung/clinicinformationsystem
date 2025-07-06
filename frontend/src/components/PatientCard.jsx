import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Calendar, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PatientCard({ patient, onBookAppointment }) {
  const navigate = useNavigate();

  const handleBookAppointment = () => {
    if (onBookAppointment) {
      onBookAppointment(patient);
    }
  };

  const handleViewRecords = () => {
    navigate(`/receptionist/patients/${patient.id}`);
  };

  return (
    <Card className="p-6 bg-card hover:bg-accent hover:text-accent-foreground transition-colors border border-border">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="flex items-start space-x-6">
          <div className="rounded-full bg-muted p-3">
            <UserCircle className="h-16 w-16 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-card-foreground mb-2">
              {patient.first_name} {patient.last_name}
            </h3>
            <div className="space-y-2">
              <p className="text-lg text-muted-foreground">
                Patient #: {patient.patient_number}
              </p>
              <p className="text-lg text-muted-foreground">
                Phone: {patient.phone || 'N/A'}
              </p>
              <p className="text-lg text-muted-foreground">
                Email: {patient.email || 'N/A'}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {patient.blood_group && (
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground px-4 py-1 text-base">
                    Blood: {patient.blood_group}
                  </Badge>
                )}
                {patient.allergies && (
                  <Badge variant="destructive" className="px-4 py-1 text-base">
                    Allergies: {patient.allergies}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            className="flex items-center gap-3 border-border hover:bg-accent hover:text-accent-foreground text-lg py-6 px-8"
            onClick={handleBookAppointment}
          >
            <Calendar className="h-6 w-6 text-primary" />
            Book Appointment
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="flex items-center gap-3 border-border hover:bg-accent hover:text-accent-foreground text-lg py-6 px-8"
            onClick={handleViewRecords}
          >
            <FileText className="h-6 w-6 text-primary" />
            View Records
          </Button>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
        <p className="text-lg text-muted-foreground">
          DOB: {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
        </p>
        <p className="text-lg text-muted-foreground">Gender: {patient.gender || 'N/A'}</p>
        <p className="text-lg text-muted-foreground">Address: {patient.address || 'N/A'}</p>
      </div>
    </Card>
  );
}
