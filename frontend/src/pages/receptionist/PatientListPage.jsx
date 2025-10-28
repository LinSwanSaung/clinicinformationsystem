import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, UserCircle, Calendar, FileText } from "lucide-react";
import patientService from "@/services/patientService";
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
              <Card key={patient.id} className="p-3 sm:p-4 md:p-6 bg-card hover:bg-accent hover:text-accent-foreground transition-colors border border-border">
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
                        <p className="text-xs sm:text-sm md:text-lg text-muted-foreground break-all">Patient #: {patient.patient_number}</p>
                        <p className="text-xs sm:text-sm md:text-lg text-muted-foreground break-all">Phone: {patient.phone || 'N/A'}</p>
                        <p className="text-xs sm:text-sm md:text-lg text-muted-foreground break-all">Email: {patient.email || 'N/A'}</p>
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 mt-2 sm:mt-2.5 md:mt-3">
                          {patient.blood_group && (
                            <Badge variant="secondary" className="bg-secondary text-secondary-foreground px-2 sm:px-3 md:px-4 py-0.5 sm:py-0.5 md:py-1 text-xs sm:text-sm md:text-base">
                              Blood: {patient.blood_group}
                            </Badge>
                          )}
                          {patient.allergies && (
                            <Badge variant="destructive" className="px-2 sm:px-3 md:px-4 py-0.5 sm:py-0.5 md:py-1 text-xs sm:text-sm md:text-base">
                              Allergies: {patient.allergies}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2 sm:gap-2.5 md:gap-3 border-border hover:bg-accent hover:text-accent-foreground text-xs sm:text-sm md:text-lg py-2 sm:py-4 md:py-6 px-3 sm:px-6 md:px-8 flex-1 sm:flex-none"
                      onClick={() => handleBookAppointment(patient)}
                    >
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6 text-primary" />
                      <span className="sm:hidden">Book</span>
                      <span className="hidden sm:inline">Book Appointment</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2 sm:gap-2.5 md:gap-3 border-border hover:bg-accent hover:text-accent-foreground text-xs sm:text-sm md:text-lg py-2 sm:py-4 md:py-6 px-3 sm:px-6 md:px-8 flex-1 sm:flex-none"
                      onClick={() => navigate(`/receptionist/patients/${patient.id}`)}
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
