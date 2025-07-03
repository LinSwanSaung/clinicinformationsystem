import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Calendar,
  Users,
  UserCircle,
  FileText,
  Star,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import doctorService from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import { appointments } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/PageLayout';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    availableDoctorCount: 0,
    totalPatients: 0
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Get today's appointments
        const today = new Date().toDateString();
        const todayAppts = appointments.filter(
          app => new Date(app.date).toDateString() === today
        ).length;

        // Get available doctors and patients
        const [doctorsResponse, patientsResponse] = await Promise.all([
          doctorService.getAvailableDoctors(),
          patientService.getAllPatients()
        ]);
        
        setStats({
          todayAppointments: todayAppts,
          availableDoctorCount: doctorsResponse.length,
          totalPatients: patientsResponse.length
        });
        
        setAvailableDoctors(doctorsResponse);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setIsLoading(false);
      }
    };

    loadDashboardData();
    // Update available doctors every minute
    const interval = setInterval(loadDashboardData, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleNewPatient = () => {
    navigate('/receptionist/register-patient');
  };

  const handleAppointments = () => {
    navigate('/receptionist/appointments');
  };

  const handlePatientList = () => {
    navigate('/receptionist/patients');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Reception Dashboard"
      subtitle="Welcome to the clinic management system"
      fullWidth
    >
      <div className="space-y-8 p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-medium text-muted-foreground">
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-primary mr-3" />
                <span className="text-3xl font-bold">{stats.todayAppointments}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-medium text-muted-foreground">
                Available Doctors
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="flex items-center">
                <UserCircle className="h-8 w-8 text-primary mr-3" />
                <span className="text-3xl font-bold">{stats.availableDoctorCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-medium text-muted-foreground">
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary mr-3" />
                <span className="text-3xl font-bold">{stats.totalPatients}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Button
            onClick={handleNewPatient}
            className="bg-card hover:bg-accent text-foreground hover:text-accent-foreground border border-border h-28 text-lg"
          >
            <UserPlus className="h-7 w-7 text-primary mr-3" />
            Register New Patient
          </Button>
          <Button
            onClick={handleAppointments}
            className="bg-card hover:bg-accent text-foreground hover:text-accent-foreground border border-border h-28 text-lg"
          >
            <Calendar className="h-7 w-7 text-primary mr-3" />
            Manage Appointments
          </Button>
          <Button
            onClick={handlePatientList}
            className="bg-card hover:bg-accent text-foreground hover:text-accent-foreground border border-border h-28 text-lg"
          >
            <FileText className="h-7 w-7 text-primary mr-3" />
            Patient Records
          </Button>
        </div>

        {/* Available Doctors Section */}
        <Card className="bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold">Available Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableDoctors.map((doctor) => (
                <Card key={doctor.id} className="bg-card text-card-foreground rounded-lg shadow-lg p-6 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-20 h-20">
                      <img
                        src={doctor.image}
                        alt={doctor.name}
                        className="rounded-full object-cover w-full h-full"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/80x80';
                        }}
                      />
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{doctor.name}</h3>
                      <p className="text-lg text-muted-foreground">{doctor.specialization}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-muted-foreground">
                      <Star className="w-5 h-5 mr-2 text-yellow-400" />
                      <span className="text-base">{doctor.rating} Rating</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="w-5 h-5 mr-2" />
                      <span className="text-base">{doctor.patients}+ Patients</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-5 h-5 mr-2" />
                      <span className="text-base">{doctor.availability}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate('/receptionist/appointments', {
                      state: { doctor: doctor }
                    })}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6"
                  >
                    Book Appointment
                  </Button>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ReceptionistDashboard;
