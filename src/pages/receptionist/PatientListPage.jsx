import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, UserCircle, Calendar, FileText } from "lucide-react";
import { dummyPatients } from "@/data/dummyReceptionistData";
import { Link, useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

export default function PatientListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState(dummyPatients);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = dummyPatients.filter(
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
    >
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground">Patient List</h2>
          <Link to="/receptionist/register-patient">
            <Button className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              New Patient
            </Button>
          </Link>
        </div>

        <Card className="bg-card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search patients by name, ID, contact, or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 w-full bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </Card>

        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="p-4 bg-card hover:bg-accent hover:text-accent-foreground transition-colors border border-border">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-muted p-2">
                    <UserCircle className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground">{patient.name}</h3>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">ID: {patient.id}</p>
                      <p className="text-sm text-muted-foreground">{patient.contact}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {patient.medicalHistory.map((condition, index) => (
                          <Badge key={index} variant="secondary" className="bg-secondary text-secondary-foreground">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2 border-border hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleBookAppointment(patient)}
                  >
                    <Calendar className="h-4 w-4 text-primary" />
                    Book Appointment
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-border hover:bg-accent hover:text-accent-foreground">
                    <FileText className="h-4 w-4 text-primary" />
                    View Records
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}</p>
                <p className="mt-1 text-sm text-muted-foreground">{patient.address}</p>
              </div>
            </Card>
          ))}
          {filteredPatients.length === 0 && (
            <Card className="p-8 text-center bg-card">
              <p className="text-muted-foreground">No patients found matching your search criteria.</p>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
