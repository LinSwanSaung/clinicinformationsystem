import React from "react";
import ReceptionistPatientCard from "./ReceptionistPatientCard";
import LoadingState from "./LoadingState";
import EmptyState from "./EmptyState";

export default function PatientList({ 
  patients, 
  isLoading, 
  onBookAppointment,
  emptyMessage = "No patients found matching your search criteria.",
  loadingMessage = "Loading patients..."
}) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
  }

  if (!patients || patients.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="grid gap-6">
      {patients.map((patient) => (
        <ReceptionistPatientCard 
          key={patient.id} 
          patient={patient} 
          onBookAppointment={onBookAppointment}
        />
      ))}
    </div>
  );
}
