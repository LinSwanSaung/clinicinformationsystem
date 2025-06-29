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
import { doctors } from '@/data/dummyDoctorsData';
import { 
  dummyPatients, 
  appointments 
} from '@/data/dummyReceptionistData';
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
    const loadDashboardData = () => {
      try {
        // Get today's appointments
        const today = new Date().toDateString();
        const todayAppts = appointments.filter(
          app => new Date(app.date).toDateString() === today
        ).length;

        // Get available doctors
        const availDoctors = doctors.filter(doc => doc.status === 'available');
        
        setStats({
          todayAppointments: todayAppts,
          availableDoctorCount: availDoctors.length,
          totalPatients: dummyPatients.length
        });
        
        setAvailableDoctors(availDoctors);
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
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card">
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-primary mr-2" />
                <span className="text-2xl font-bold">{stats.todayAppointments}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Doctors
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="flex items-center">
                <UserCircle className="h-8 w-8 text-primary mr-2" />
                <span className="text-2xl font-bold">{stats.availableDoctorCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary mr-2" />
                <span className="text-2xl font-bold">{stats.totalPatients}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Button
            onClick={handleNewPatient}
            className="bg-card hover:bg-accent text-foreground hover:text-accent-foreground border border-border h-24"
          >
            <UserPlus className="h-6 w-6 text-primary mr-2" />
            Register New Patient
          </Button>
          <Button
            onClick={handleAppointments}
            className="bg-card hover:bg-accent text-foreground hover:text-accent-foreground border border-border h-24"
          >
            <Calendar className="h-6 w-6 text-primary mr-2" />
            Manage Appointments
          </Button>
          <Button
            onClick={handlePatientList}
            className="bg-card hover:bg-accent text-foreground hover:text-accent-foreground border border-border h-24"
          >
            <FileText className="h-6 w-6 text-primary mr-2" />
            Patient Records
          </Button>
        </div>

        {/* Available Doctors Section */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Available Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableDoctors.map((doctor) => (
                <Card key={doctor.id} className="bg-card text-card-foreground rounded-lg shadow-lg p-6 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16">
                      <img
                        src={doctor.image}
                        alt={doctor.name}
                        className="rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/64x64';
                        }}
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{doctor.name}</h3>
                      <p className="text-muted-foreground">{doctor.specialization}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-muted-foreground">
                      <Star className="w-4 h-4 mr-2 text-yellow-400" />
                      <span>{doctor.rating} Rating</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{doctor.patients}+ Patients</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{doctor.availability}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate('/receptionist/appointments', {
                      state: { doctor: doctor }
                    })}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
