import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon,
  Clock,
  Search,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { 
  dummyPatients, 
  doctorSchedules, 
  appointments,
  getAvailableDoctors 
} from '@/data/dummyReceptionistData';
import Navbar from '@/components/Navbar';
import Alert from '@/components/Alert';

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    doctorId: '',
    date: new Date(),
    time: '09:00',
    type: 'Regular Checkup',
    notes: ''
  });

  // Filter appointments based on date and search term
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date);
    const isSameDate = 
      appointmentDate.getFullYear() === selectedDate.getFullYear() &&
      appointmentDate.getMonth() === selectedDate.getMonth() &&
      appointmentDate.getDate() === selectedDate.getDate();
    
    if (!isSameDate) return false;
    
    if (searchTerm === '') return true;
    
    const patient = dummyPatients.find(p => p.id === appointment.patientId);
    const doctor = doctorSchedules.find(d => d.id === appointment.doctorId);
    
    return (
      patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  useEffect(() => {
    // Update available doctors
    setAvailableDoctors(getAvailableDoctors());
  }, []);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return slots;
  };

  const handleNewAppointment = () => {
    // Here we would normally save the appointment to the database
    // For now, just show a success message
    setShowAlert(true);
    setShowNewAppointment(false);
  };

  const getPatientName = (patientId) => {
    const patient = dummyPatients.find(p => p.id === patientId);
    return patient ? patient.name : 'Unknown Patient';
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctorSchedules.find(d => d.id === doctorId);
    return doctor ? doctor.name : 'Unknown Doctor';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
            <p className="text-muted-foreground">Manage patient appointments</p>
          </div>
          <Button
            onClick={() => navigate('/receptionist/dashboard')}
            variant="outline"
            className="flex items-center gap-2 border-border text-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid md:grid-cols-12 gap-6 max-w-4xl mx-auto">
          {/* Calendar Side */}
          <Card className="md:col-span-4 bg-card border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-card-foreground">Select Date</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="mx-auto"
              />
              <Button 
                className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setShowNewAppointment(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </CardContent>
          </Card>

          {/* Appointments List */}
          <div className="md:col-span-8 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="text-center">
                <CardTitle className="text-card-foreground">
                  Appointments for {selectedDate.toLocaleDateString()}
                </CardTitle>
                <div className="relative max-w-md mx-auto">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search appointments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-input"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredAppointments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center text-muted-foreground">Time</TableHead>
                        <TableHead className="text-center text-muted-foreground">Patient</TableHead>
                        <TableHead className="text-center text-muted-foreground">Doctor</TableHead>
                        <TableHead className="text-center text-muted-foreground">Type</TableHead>
                        <TableHead className="text-center text-muted-foreground">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointments.map((appointment) => (
                        <TableRow key={appointment.id} className="hover:bg-accent">
                          <TableCell className="font-medium text-center text-foreground">
                            {appointment.time}
                          </TableCell>
                          <TableCell className="text-center text-foreground">
                            {getPatientName(appointment.patientId)}
                          </TableCell>
                          <TableCell className="text-center text-foreground">
                            {getDoctorName(appointment.doctorId)}
                          </TableCell>
                          <TableCell className="text-center text-foreground">{appointment.type}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Badge 
                                variant={
                                  appointment.status === 'Scheduled' 
                                    ? 'secondary' 
                                    : appointment.status === 'In Progress'
                                    ? 'default'
                                    : 'outline'
                                }
                                className="text-foreground border-border"
                              >
                                {appointment.status}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No appointments found for this date.</p>
                    <Button 
                      className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => setShowNewAppointment(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Doctors */}
            <Card className="bg-card border-border">
              <CardHeader className="text-center">
                <CardTitle className="text-card-foreground">Available Doctors</CardTitle>
                <CardDescription className="text-muted-foreground">Doctors available for appointments today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {availableDoctors.map(doctor => (
                    <Card key={doctor.id} className="p-4 bg-accent border-border">
                      <div className="flex items-center space-x-4">
                        <div className="rounded-full bg-accent p-2 flex-shrink-0">
                          <CalendarIcon className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{doctor.name}</p>
                          <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {availableDoctors.length === 0 && (
                    <p className="text-muted-foreground col-span-2 text-center py-4">No doctors are currently available.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* New Appointment Form */}
        {showNewAppointment && (
          <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl overflow-auto bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-6 text-center text-card-foreground">Schedule New Appointment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Patient</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background"
                      value={newAppointment.patientId}
                      onChange={(e) => setNewAppointment({ ...newAppointment, patientId: e.target.value })}
                    >
                      <option value="">Select a patient</option>
                      {dummyPatients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Doctor</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background"
                      value={newAppointment.doctorId}
                      onChange={(e) => setNewAppointment({ ...newAppointment, doctorId: e.target.value })}
                    >
                      <option value="">Select a doctor</option>
                      {doctorSchedules.filter(d => d.isAvailable).map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Date</label>
                    <Input
                      type="date"
                      className="border-input"
                      value={newAppointment.date.toISOString().split('T')[0]}
                      onChange={(e) => setNewAppointment({ ...newAppointment, date: new Date(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Time</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background"
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                    >
                      {generateTimeSlots().map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Type</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background"
                      value={newAppointment.type}
                      onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                    >
                      <option value="Regular Checkup">Regular Checkup</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="New Patient">New Patient</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Notes</label>
                    <Input
                      placeholder="Add any additional notes"
                      className="border-input"
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    className="border-border text-foreground hover:bg-accent"
                    onClick={() => setShowNewAppointment(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleNewAppointment}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Schedule Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Alert */}
        {showAlert && (
          <Alert
            type="success"
            title="Appointment Scheduled"
            message="The appointment has been successfully scheduled."
            onClose={() => setShowAlert(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
