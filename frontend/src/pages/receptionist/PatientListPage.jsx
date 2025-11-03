import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import patientService from "@/services/patientService";
import ReceptionistPatientCard from "@/components/ReceptionistPatientCard";
import { useNavigate, Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

export default function PatientListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await patientService.getAllPatients();
      
      if (response.success && response.data) {
        setAllPatients(response.data);
        setFilteredPatients(response.data);
      } else {
        throw new Error(response.error || 'Failed to load patients');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading patients:', error);
      // Check if it's an authentication error
      if (error.message.includes('Access token required') || error.message.includes('401')) {
        setError({ message: 'Please log in to access patient records', isAuthError: true });
      } else if (error.message.includes('Too many requests') || error.message.includes('rate limit')) {
        setError({ message: 'Too many requests. Please wait a moment and try again.', isRateLimit: true });
      } else if (error.message.includes('Failed to fetch')) {
        setError({ message: 'Unable to connect to the server. Please check your connection and try again.', isNetworkError: true });
      } else {
        setError(error);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = allPatients.filter(
      (patient) =>
        patient.first_name?.toLowerCase().includes(term) ||
        patient.last_name?.toLowerCase().includes(term) ||
        patient.patient_number?.toLowerCase().includes(term) ||
        patient.phone?.includes(term) ||
        patient.email?.toLowerCase().includes(term)
    );
    setFilteredPatients(filtered);
  };

  const handleBookAppointment = (patient) => {
    navigate('/receptionist/appointments', {
      state: { 
        patient: patient
      }
    });
  };

  return (
    <PageLayout 
      title="Patient Records"
      subtitle="Search and manage patient information"
      fullWidth
    >
      <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">Patient List</h2>
          <Link to="/receptionist/register-patient">
            <Button className="flex items-center gap-2 sm:gap-3 bg-primary text-primary-foreground hover:bg-primary/90 text-sm sm:text-base md:text-lg py-3 sm:py-4 md:py-6 px-4 sm:px-6 md:px-8 w-full sm:w-auto">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              New Patient
            </Button>
          </Link>
        </div>

        <Card className="bg-card p-3 sm:p-4 md:p-6">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-3 sm:top-4 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search patients by name, ID, contact, or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 sm:pl-12 md:pl-14 w-full bg-background text-foreground placeholder:text-muted-foreground h-10 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg"
            />
          </div>
        </Card>

        <div className="grid gap-3 sm:gap-4 md:gap-6">
          {isLoading ? (
            <Card className="p-6 sm:p-8 md:p-12 text-center bg-card">
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">Loading patients...</p>
            </Card>
          ) : error ? (
            <Card className="p-6 sm:p-8 md:p-12 text-center bg-card">
              <p className="text-base sm:text-lg md:text-xl text-destructive mb-3 sm:mb-4">
                {error.isAuthError ? 'Authentication Required' : 
                 error.isRateLimit ? 'Rate Limit Exceeded' :
                 error.isNetworkError ? 'Connection Error' :
                 'Error loading patients'}
              </p>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-4 sm:mb-6">
                {error.message}
              </p>
              {error.isAuthError ? (
                <Button onClick={() => navigate('/')} className="mr-4">
                  Go to Login
                </Button>
              ) : error.isRateLimit ? (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Please wait 15 minutes before trying again, or clear your browser cache and refresh the page.
                  </p>
                  <Button onClick={() => window.location.reload()} className="mr-4">
                    Refresh Page
                  </Button>
                </div>
              ) : null}
              <Button onClick={loadPatients} variant="outline">
                Try Again
              </Button>
            </Card>
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <ReceptionistPatientCard
                key={patient.id}
                patient={patient}
                onBookAppointment={handleBookAppointment}
              />
            ))
          ) : (
            <Card className="p-6 sm:p-8 md:p-12 text-center bg-card">
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">No patients found matching your search criteria.</p>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
