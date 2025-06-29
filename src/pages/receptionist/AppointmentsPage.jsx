import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  dummyPatients, 
  doctorSchedules, 
  appointments,
  getAvailableDoctors 
} from '@/data/dummyReceptionistData';
import { doctors } from '@/data/dummyDoctorsData';
import Navbar from '@/components/Navbar';
import Alert from '@/components/Alert';
import PageLayout from '@/components/PageLayout';

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState(doctors.filter(d => d.status === 'available'));
  const [newAppointment, setNewAppointment] = useState({
    patientId: location.state?.patient?.id || '',
    doctorId: location.state?.doctor?.id || '',
    date: new Date(),
    time: '09:00',
    type: 'Regular Checkup',
    notes: ''
  });

  useEffect(() => {
    // If we have pre-filled data from navigation
    if (location.state) {
      setShowNewAppointment(true);
      setNewAppointment(prev => ({
        ...prev,
        // Set patient ID if patient data is provided
        ...(location.state.patient && { patientId: location.state.patient.id }),
        // Set doctor ID if doctor data is provided
        ...(location.state.doctor && { doctorId: location.state.doctor.id }),
      }));
    }
  }, [location.state]);

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
    const doctor = availableDoctors.find(d => d.id === appointment.doctorId);
    
    return (
      patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
    const appointment = {
      ...newAppointment,
      id: Math.random().toString(36).substr(2, 9),
      date: selectedDate,
      createdAt: new Date(),
    };
    
    console.log('New appointment:', appointment);
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
      setShowNewAppointment(false);
      // Reset form
      setNewAppointment({
        patientId: '',
        doctorId: '',
        date: new Date(),
        time: '09:00',
        type: 'Regular Checkup',
        notes: ''
      });
    }, 2000);
  };

  return (
    <PageLayout
      title="Appointments"
      subtitle="Schedule and manage patient appointments"
    >
      {showAlert && (
        <Alert 
          type="success"
          message="Appointment scheduled successfully!"
          onClose={() => setShowAlert(false)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Appointments</h2>
            <p className="text-muted-foreground">Schedule and manage patient appointments</p>
          </div>
          <Button
            onClick={() => setShowNewAppointment(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>

        {showNewAppointment ? (
          <Card className="w-full p-6 bg-card">
            <CardHeader>
              <CardTitle>Schedule New Appointment</CardTitle>
              <CardDescription>Fill in the appointment details below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Patient</label>
                    <Select
                      value={newAppointment.patientId}
                      onValueChange={(value) => 
                        setNewAppointment(prev => ({ ...prev, patientId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {dummyPatients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Doctor</label>
                    <Select
                      value={newAppointment.doctorId}
                      onValueChange={(value) => 
                        setNewAppointment(prev => ({ ...prev, doctorId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDoctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name} - {doctor.specialization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Date</label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => setSelectedDate(date)}
                      className="rounded-md border"
                      disabled={(date) => date < new Date()}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Time</label>
                    <Select
                      value={newAppointment.time}
                      onValueChange={(value) => 
                        setNewAppointment(prev => ({ ...prev, time: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeSlots().map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Type</label>
                    <Select
                      value={newAppointment.type}
                      onValueChange={(value) => 
                        setNewAppointment(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regular Checkup">Regular Checkup</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
                        <SelectItem value="Consultation">Consultation</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Notes</label>
                    <Textarea
                      value={newAppointment.notes}
                      onChange={(e) => 
                        setNewAppointment(prev => ({ ...prev, notes: e.target.value }))
                      }
                      placeholder="Add any additional notes..."
                      className="h-24"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewAppointment(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNewAppointment}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={!newAppointment.patientId || !newAppointment.doctorId}
                  >
                    Schedule Appointment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="bg-card p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search appointments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => {
                    const patient = dummyPatients.find(p => p.id === appointment.patientId);
                    const doctor = availableDoctors.find(d => d.id === appointment.doctorId);
                    
                    return (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell>{patient?.name || 'Unknown'}</TableCell>
                        <TableCell>{doctor?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{appointment.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              appointment.status === 'Scheduled' 
                                ? 'bg-green-100 text-green-800'
                                : appointment.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredAppointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No appointments found for this date.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AppointmentsPage;
