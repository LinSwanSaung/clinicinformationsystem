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
      <div className="space-y-8 p-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-foreground">Patient List</h2>
          <Link to="/receptionist/register-patient">
            <Button className="flex items-center gap-3 bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6 px-8">
              <Plus className="h-6 w-6" />
              New Patient
            </Button>
          </Link>
        </div>

        <Card className="bg-card p-6">
          <div className="relative">
            <Search className="absolute left-4 top-4 h-6 w-6 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search patients by name, ID, contact, or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-14 w-full bg-background text-foreground placeholder:text-muted-foreground h-14 text-lg"
            />
          </div>
        </Card>

        <div className="grid gap-6">
          {isLoading ? (
            <Card className="p-12 text-center bg-card">
              <p className="text-xl text-muted-foreground">Loading patients...</p>
            </Card>
          ) : error ? (
            <Card className="p-12 text-center bg-card">
              <p className="text-xl text-destructive mb-4">
                {error.isAuthError ? 'Authentication Required' : 
                 error.isRateLimit ? 'Rate Limit Exceeded' :
                 error.isNetworkError ? 'Connection Error' :
                 'Error loading patients'}
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                {error.message}
              </p>
              {error.isAuthError ? (
                <Button onClick={() => navigate('/')} className="mr-4">
                  Go to Login
                </Button>
              ) : error.isRateLimit ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
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
              <Card key={patient.id} className="p-6 bg-card hover:bg-accent hover:text-accent-foreground transition-colors border border-border">
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
                        <p className="text-lg text-muted-foreground">Patient #: {patient.patient_number}</p>
                        <p className="text-lg text-muted-foreground">Phone: {patient.phone || 'N/A'}</p>
                        <p className="text-lg text-muted-foreground">Email: {patient.email || 'N/A'}</p>
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
                      onClick={() => handleBookAppointment(patient)}
                    >
                      <Calendar className="h-6 w-6 text-primary" />
                      Book Appointment
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="flex items-center gap-3 border-border hover:bg-accent hover:text-accent-foreground text-lg py-6 px-8"
                      onClick={() => navigate(`/receptionist/patients/${patient.id}`)}
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
            ))
          ) : (
            <Card className="p-12 text-center bg-card">
              <p className="text-xl text-muted-foreground">No patients found matching your search criteria.</p>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
