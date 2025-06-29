import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, UserCircle, Calendar, FileText } from "lucide-react";
import { dummyPatients } from "@/data/dummyReceptionistData";
import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

export default function PatientListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState(dummyPatients);

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

  return (
    <PageLayout 
      title="Patient Records"
      subtitle="Search and manage patient information"
    >
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Patient List</h2>
          <Link to="/receptionist/register-patient">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Patient
            </Button>
          </Link>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search patients by name, ID, contact, or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 w-full"
            />
          </div>
        </Card>

      <div className="grid gap-4">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="rounded-full bg-gray-100 p-2">
                  <UserCircle className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{patient.name}</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">ID: {patient.id}</p>
                    <p className="text-sm text-gray-600">{patient.contact}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {patient.medicalHistory.map((condition, index) => (
                        <Badge key={index} variant="secondary">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Book Appointment
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  View Records
                </Button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}</p>
              <p className="mt-1">{patient.address}</p>
            </div>
          </Card>
        ))}
        {filteredPatients.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No patients found matching your search criteria.</p>
          </Card>
        )}
      </div>
    </div>
    </PageLayout>
  );
}
