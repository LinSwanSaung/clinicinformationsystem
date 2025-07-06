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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Textarea } from '@/components/ui/textarea';
import appointmentService from '@/services/appointmentService';
import patientService from '@/services/patientService';
import userService from '@/services/userService';
import Alert from '@/components/Alert';
import PageLayout from '@/components/PageLayout';
import AppointmentCard from '@/components/AppointmentCard';
import AppointmentDetailModal from '@/components/AppointmentDetailModal';

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [doctorsData, patientsData, appointmentsData] = await Promise.all([
        userService.getUsersByRole('doctor'),
        patientService.getAllPatients(),
        appointmentService.getAllAppointments()
      ]);

      setAvailableDoctors(doctorsData?.data || []);
      setPatients(patientsData?.data || []);
      setAppointments(appointmentsData?.data || []);
    } catch (error) {
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter appointments based on date and search term
  const filteredAppointments = appointments.filter(appointment => {
    // Check if date matches - handle both 'date' and 'appointment_date' fields
    const appointmentDate = new Date(appointment.appointment_date || appointment.date);
    const isSameDate = appointmentDate.toDateString() === selectedDate.toDateString();
    if (!isSameDate) return false;
    
    // If no search term, return all appointments for the date
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const patient = patients.find(p => p.id === appointment.patient_id);
    const doctor = availableDoctors.find(d => d.id === appointment.doctor_id);
    
    const searchFields = [
      `${patient?.first_name} ${patient?.last_name}`,
      `${doctor?.first_name} ${doctor?.last_name}`,
      doctor?.specialty,
      appointment.appointment_type,
      patient?.patient_number, // Added patient ID/number search
      patient?.phone, // Added phone number search
      patient?.email // Added email search
    ].filter(Boolean).map(field => field.toLowerCase());
    
    return searchFields.some(field => field.includes(searchLower));
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

    const handleNewAppointment = async () => {
    try {
      const appointmentData = {
        patient_id: newAppointment.patientId,
        doctor_id: newAppointment.doctorId,
        appointment_date: selectedDate.toISOString().split('T')[0],
        appointment_time: newAppointment.time,
        appointment_type: newAppointment.type,
        notes: newAppointment.notes,
        status: 'scheduled'
      };

      const result = await appointmentService.createAppointment(appointmentData);
      
      if (result.success) {
        setShowAlert(true);
        setNewAppointment({
          patientId: '',
          doctorId: '',
          date: new Date(),
          time: '09:00',
          type: 'Regular Checkup',
          notes: ''
        });
        
        // Refresh appointments
        loadData();
        
        setTimeout(() => {
          setShowAlert(false);
          setShowNewAppointment(false);
        }, 2000);
      } else {
        setError('Failed to schedule appointment. Please try again.');
      }
    } catch (error) {
      setError('Failed to schedule appointment. Please try again.');
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      console.log('Frontend: Updating status for appointment', appointmentId, 'to', newStatus);
      const result = await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
      console.log('Frontend: API response:', result);
      
      if (result.success) {
        // Update the appointment in the local state
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        ));
        console.log('Frontend: Status updated successfully');
      } else {
        console.error('Frontend: API returned failure:', result);
        setError('Failed to update appointment status.');
      }
    } catch (error) {
      console.error('Frontend: Error in handleStatusChange:', error);
      setError('Failed to update appointment status.');
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  return (
    <PageLayout
      title="Appointments"
      subtitle="Schedule and manage patient appointments"
      fullWidth
    >
      <div className="space-y-8 p-8">
        {showAlert && (
          <Alert 
            type="success"
            message="Appointment scheduled successfully!"
            onClose={() => setShowAlert(false)}
          />
        )}

        {error && (
          <Alert 
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        <div className="flex justify-between items-center">
          <div className="flex-1" />
          <Button
            onClick={() => setShowNewAppointment(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6 px-8"
          >
            <Plus className="mr-2 h-6 w-6" />
            New Appointment
          </Button>
        </div>

        {showNewAppointment ? (
          <Card className="w-full p-6 bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl mb-2">Schedule New Appointment</CardTitle>
              <CardDescription className="text-lg">Fill in the appointment details below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="text-lg font-medium block mb-2">Patient</label>
                      <SearchableSelect
                        options={patients}
                        value={newAppointment.patientId}
                        onValueChange={(value) => 
                          setNewAppointment(prev => ({ ...prev, patientId: value }))
                        }
                        placeholder="Select patient..."
                        searchPlaceholder="Search patients..."
                        displayField="first_name"
                        secondaryField="last_name"
                        valueField="id"
                        clearable={true}
                        customDisplayRenderer={(option) => 
                          `${option.first_name} ${option.last_name}`
                        }
                        customSearchRenderer={(option, searchTerm) => 
                          `${option.first_name} ${option.last_name}`.toLowerCase().includes(searchTerm)
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-lg font-medium block mb-2">Doctor</label>
                      <SearchableSelect
                        options={availableDoctors}
                        value={newAppointment.doctorId}
                        onValueChange={(value) => 
                          setNewAppointment(prev => ({ ...prev, doctorId: value }))
                        }
                        placeholder="Select doctor..."
                        searchPlaceholder="Search doctors..."
                        displayField="first_name"
                        secondaryField="last_name"
                        valueField="id"
                        clearable={true}
                        customDisplayRenderer={(option) => 
                          `Dr. ${option.first_name} ${option.last_name}${option.specialty ? ` - ${option.specialty}` : ''}`
                        }
                        customSearchRenderer={(option, searchTerm) => {
                          const fullText = `${option.first_name} ${option.last_name} ${option.specialty || ''}`.toLowerCase();
                          return fullText.includes(searchTerm);
                        }}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-lg font-medium block mb-2">Type</label>
                      <Select
                        value={newAppointment.type}
                        onValueChange={(value) => 
                          setNewAppointment(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger className="h-12 text-lg">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Regular Checkup" className="text-lg py-3">Regular Checkup</SelectItem>
                          <SelectItem value="Follow-up" className="text-lg py-3">Follow-up</SelectItem>
                          <SelectItem value="Consultation" className="text-lg py-3">Consultation</SelectItem>
                          <SelectItem value="Emergency" className="text-lg py-3">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-lg font-medium block mb-2">Date</label>
                      <div className="border rounded-lg p-4 bg-background">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => setSelectedDate(date)}
                          className="rounded-md"
                          disabled={(date) => date < new Date()}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-lg font-medium block mb-2">Time</label>
                      <Select
                        value={newAppointment.time}
                        onValueChange={(value) => 
                          setNewAppointment(prev => ({ ...prev, time: value }))
                        }
                      >
                        <SelectTrigger className="h-12 text-lg">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateTimeSlots().map((time) => (
                            <SelectItem key={time} value={time} className="text-lg py-3">
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-lg font-medium block mb-2">Notes</label>
                      <Textarea
                        value={newAppointment.notes}
                        onChange={(e) => 
                          setNewAppointment(prev => ({ ...prev, notes: e.target.value }))
                        }
                        placeholder="Add any additional notes..."
                        className="min-h-[120px] text-lg p-4 border-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewAppointment(false)}
                    className="text-lg py-6 px-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNewAppointment}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6 px-8"
                    disabled={!newAppointment.patientId || !newAppointment.doctorId}
                  >
                    Schedule Appointment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
            <div className="space-y-6">
              <Card className="bg-card p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-xl">
                    Appointments for {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                  <CardDescription>
                    {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-4 top-4 h-6 w-6 text-muted-foreground" />
                      <Input
                        placeholder="Search by patient name, patient ID, phone, doctor, or appointment type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-14 h-14 text-lg"
                      />
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="border rounded-lg p-4 bg-background">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => setSelectedDate(date)}
                        className="rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {isLoading ? (
                <Card className="bg-card p-8">
                  <div className="text-center">
                    <div className="text-lg text-muted-foreground">Loading appointments...</div>
                  </div>
                </Card>
              ) : filteredAppointments.length === 0 ? (
                <Card className="bg-card p-8">
                  <div className="text-center">
                    <div className="text-lg text-muted-foreground">
                      {searchTerm 
                        ? 'No appointments found matching your search.'
                        : 'No appointments scheduled for this date.'
                      }
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAppointments
                    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                    .map((appointment) => {
                      const patient = patients.find(p => p.id === appointment.patient_id);
                      const doctor = availableDoctors.find(d => d.id === appointment.doctor_id);
                      
                      return (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          patient={patient}
                          doctor={doctor}
                          onStatusChange={handleStatusChange}
                          onViewDetails={handleViewDetails}
                          userRole="receptionist"
                        />
                      );
                    })}
                </div>
              )}
            </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        patient={selectedAppointment ? patients.find(p => p.id === selectedAppointment.patient_id) : null}
        doctor={selectedAppointment ? availableDoctors.find(d => d.id === selectedAppointment.doctor_id) : null}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </PageLayout>
  );
};

export default AppointmentsPage;
