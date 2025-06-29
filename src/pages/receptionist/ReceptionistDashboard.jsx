import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Calendar,
  Users,
  UserCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  dummyPatients, 
  doctorSchedules, 
  appointments,
  getAvailableDoctors 
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
        const availDoctors = getAvailableDoctors();
        
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Reception Dashboard"
      subtitle="Welcome to the clinic management system"
    >

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-primary mr-2" />
                <div className="text-2xl font-bold">{stats.todayAppointments}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Doctors
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary mr-2" />
                <div className="text-2xl font-bold">{stats.availableDoctorCount}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="flex items-center">
                <UserCircle className="h-8 w-8 text-primary mr-2" />
                <div className="text-2xl font-bold">{stats.totalPatients}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 mb-6">
          <Card className="col-span-full">
            <CardHeader className="text-center">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <Button 
                  onClick={handleNewPatient}
                  className="flex items-center justify-center gap-2 h-24"
                >
                  <UserPlus className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">Register Patient</div>
                    <div className="text-sm text-muted-foreground">Add new patient</div>
                  </div>
                </Button>
                
                <Button 
                  onClick={handleAppointments}
                  className="flex items-center justify-center gap-2 h-24"
                  variant="secondary"
                >
                  <Calendar className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">Appointments</div>
                    <div className="text-sm text-muted-foreground">Manage schedule</div>
                  </div>
                </Button>

                <Button 
                  onClick={handlePatientList}
                  className="flex items-center justify-center gap-2 h-24"
                  variant="secondary"
                >
                  <FileText className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">Patient Records</div>
                    <div className="text-sm text-muted-foreground">View all patients</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Available Doctors Section */}
        <Card className="col-span-full">
          <CardHeader className="text-center">
            <CardTitle>Currently Available Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {availableDoctors.map(doctor => (
                <Card key={doctor.id} className="flex items-start p-4 gap-4">
                  <div className="rounded-full bg-gray-100 p-2">
                    <UserCircle className="h-10 w-10 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{doctor.name}</h3>
                    <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                    <Badge variant="secondary" className="mt-2">
                      Available
                    </Badge>
                  </div>
                </Card>
              ))}
              {availableDoctors.length === 0 && (
                <p className="text-center text-muted-foreground py-4 col-span-full">
                  No doctors are currently available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </PageLayout>
  );
};

export default ReceptionistDashboard;
