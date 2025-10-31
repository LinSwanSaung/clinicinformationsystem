import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  UserCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Heart,
  AlertTriangle,
  Pill,
  Shield
} from 'lucide-react';
import patientService from '@/services/patientService';
import PageLayout from '@/components/PageLayout';

const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPatient = async () => {
      try {
        setIsLoading(true);
        const response = await patientService.getPatientById(id);
        if (response.success) {
          setPatient(response.data);
        } else {
          setError('Patient not found');
        }
      } catch (error) {
        console.error('Error loading patient:', error);
        setError('Failed to load patient details');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadPatient();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageLayout title="Loading..." subtitle="Please wait">
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-muted-foreground">Loading patient details...</p>
          </div>
        </PageLayout>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-background">
        <PageLayout title="Error" subtitle="Patient not found">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-lg text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/receptionist/patients')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients
            </Button>
          </div>
        </PageLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageLayout 
        title={`${patient.first_name} ${patient.last_name}`}
        subtitle={`Patient #${patient.patient_number}`}
        titleIcon={<UserCircle className="h-8 w-8" />}
      >
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Back Button */}
          <Button 
            variant="outline" 
            onClick={() => navigate('/receptionist/patients')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patient List
          </Button>

          {/* Patient Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UserCircle className="h-6 w-6" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-lg">{patient.first_name} {patient.last_name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Patient Number</p>
                  <p className="text-lg">{patient.patient_number}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p className="text-lg">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p className="text-lg">{patient.gender || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Blood Group</p>
                  {patient.blood_group ? (
                    <Badge variant="secondary" className="text-base">
                      {patient.blood_group}
                    </Badge>
                  ) : (
                    <p className="text-lg text-muted-foreground">Not specified</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                  <p className="text-lg">{patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Phone className="h-6 w-6" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span>{patient.phone || 'No phone number'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span>{patient.email || 'No email address'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                    <span>{patient.address || 'No address provided'}</span>
                  </div>
                </div>
                
                {/* Emergency Contact */}
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Emergency Contact</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {patient.emergency_contact_name || 'Not provided'}</p>
                    <p><strong>Phone:</strong> {patient.emergency_contact_phone || 'Not provided'}</p>
                    <p><strong>Relationship:</strong> {patient.emergency_contact_relationship || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Heart className="h-6 w-6" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <h4 className="font-medium">Allergies</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {patient.allergies || 'No known allergies'}
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">Medical Conditions</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {patient.medical_conditions || 'No known medical conditions'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="h-5 w-5 text-blue-500" />
                      <h4 className="font-medium">Current Medications</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {patient.current_medications || 'No current medications'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6" />
                Insurance Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Insurance Provider</p>
                  <p className="text-lg">{patient.insurance_provider || 'No insurance'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Insurance Number</p>
                  <p className="text-lg">{patient.insurance_number || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button size="lg" onClick={() => navigate('/receptionist/register-patient')}>
              <Calendar className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default PatientDetailPage;
