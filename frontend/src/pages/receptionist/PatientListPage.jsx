import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, UserCircle, Calendar, FileText } from "lucide-react";
import { patientService } from "@/services/patientService";
import { Link, useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

export default function PatientListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setIsLoading(true);
        const patients = await patientService.getAllPatients();
        setAllPatients(patients);
        setFilteredPatients(patients);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading patients:', error);
        setIsLoading(false);
      }
    };

    loadPatients();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = allPatients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(term) ||
        patient.id.toLowerCase().includes(term) ||
        patient.contact.includes(term) ||
        patient.email.toLowerCase().includes(term)
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
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="p-6 bg-card hover:bg-accent hover:text-accent-foreground transition-colors border border-border">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex items-start space-x-6">
                  <div className="rounded-full bg-muted p-3">
                    <UserCircle className="h-16 w-16 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-card-foreground mb-2">{patient.name}</h3>
                    <div className="space-y-2">
                      <p className="text-lg text-muted-foreground">ID: {patient.id}</p>
                      <p className="text-lg text-muted-foreground">{patient.contact}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {patient.medicalHistory.map((condition, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-secondary text-secondary-foreground px-4 py-1 text-base"
                          >
                            {condition}
                          </Badge>
                        ))}
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
                  >
                    <FileText className="h-6 w-6 text-primary" />
                    View Records
                  </Button>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
                <p className="text-lg text-muted-foreground">Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}</p>
                <p className="text-lg text-muted-foreground">{patient.address}</p>
              </div>
            </Card>
          ))}
          {filteredPatients.length === 0 && (
            <Card className="p-12 text-center bg-card">
              <p className="text-xl text-muted-foreground">No patients found matching your search criteria.</p>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
