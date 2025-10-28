import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon,
  Clock,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight
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
import doctorAvailabilityService from '@/services/doctorAvailabilityService';
import clinicSettingsService from '@/services/clinicSettingsService';
import Alert from '@/components/Alert';
import PageLayout from '@/components/PageLayout';
import AppointmentCard from '@/components/AppointmentCard';
import AppointmentPatientCard from '@/components/AppointmentPatientCard';
import AppointmentDetailModal from '@/components/AppointmentDetailModal';

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Consultation duration in minutes (fetched from clinic_settings table)
  const [consultationDuration, setConsultationDuration] = useState(15); // Default fallback
  
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 9, 28)); // October 28, 2025
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
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorAvailability, setDoctorAvailability] = useState([]);
  const [availableWeekdays, setAvailableWeekdays] = useState([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  
  // Smart time slots state
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [timeSlotError, setTimeSlotError] = useState('');
  
  const [calendarMonth, setCalendarMonth] = useState(() => {
    // Force to current date - October 28, 2025
    const today = new Date(2025, 9, 28); // Month is 0-indexed, so 9 = October
    console.log('Calendar initialized to:', today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    return today;
  });
  const [newAppointment, setNewAppointment] = useState({
    patientId: location.state?.patient?.id || '',
    doctorId: location.state?.doctor?.id || '',
    date: new Date(2025, 9, 28), // Initialize to current date
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

      // Fetch consultation duration from clinic settings
      try {
        const duration = await clinicSettingsService.getConsultationDuration();
        setConsultationDuration(duration);
        console.log('Consultation duration loaded:', duration, 'minutes');
      } catch (settingsError) {
        console.warn('Could not load consultation duration, using default:', settingsError);
        // Keep default value of 15
      }
    } catch (error) {
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Debug: Log current calendar month
  useEffect(() => {
    console.log('Current calendar month:', calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    console.log('Current selected date:', selectedDate.toLocaleDateString());
  }, [calendarMonth]);

  // Reset selected time when doctor or availability changes
  useEffect(() => {
    if (selectedDoctor && doctorAvailability.length > 0) {
      // Reset time to ensure it's valid for the new doctor/availability
      setNewAppointment(prev => ({ ...prev, time: '' }));
    }
  }, [selectedDoctor, doctorAvailability]);

  // Load available time slots when doctor or date changes
  useEffect(() => {
    const loadAvailableTimeSlots = async () => {
      if (!newAppointment.doctorId || !selectedDate) {
        console.log('[AppointmentsPage] Cannot load slots - missing doctorId or date:', {
          doctorId: newAppointment.doctorId,
          selectedDate
        });
        setAvailableTimeSlots([]);
        return;
      }

      try {
        setIsLoadingTimeSlots(true);
        setTimeSlotError('');
        
        const dateStr = selectedDate.toISOString().split('T')[0];
        console.log('[AppointmentsPage] Loading time slots for:', {
          doctorId: newAppointment.doctorId,
          date: dateStr,
          dayOfWeek: selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
        });
        
        const result = await doctorAvailabilityService.getAvailableTimeSlots(
          newAppointment.doctorId,
          dateStr
        );

        console.log('[AppointmentsPage] Available time slots result:', result);

        if (result && result.slots) {
          setAvailableTimeSlots(result.slots);
          
          // If current selected time is not available, clear it
          if (newAppointment.time && !result.slots.includes(newAppointment.time)) {
            console.log('[AppointmentsPage] Selected time not available, clearing:', newAppointment.time);
            setNewAppointment(prev => ({ ...prev, time: '' }));
          }
          
          // Show message if no slots available
          if (result.slots.length === 0) {
            const errorMsg = result.message || 'No available time slots for this doctor on the selected date';
            console.log('[AppointmentsPage] No slots available:', errorMsg);
            setTimeSlotError(errorMsg);
          }
        } else {
          console.warn('[AppointmentsPage] Invalid result structure:', result);
          setTimeSlotError('Failed to load time slots - invalid response');
        }
      } catch (error) {
        console.error('[AppointmentsPage] Error loading time slots:', error);
        setTimeSlotError(`Failed to load available time slots: ${error.message || 'Unknown error'}`);
        setAvailableTimeSlots([]);
      } finally {
        setIsLoadingTimeSlots(false);
      }
    };

    loadAvailableTimeSlots();
  }, [newAppointment.doctorId, selectedDate]);

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
    // If no doctor selected or no availability data, show default slots
    if (!selectedDoctor || !doctorAvailability.length || !selectedDate) {
      const slots = [];
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += consultationDuration) {
          const formattedHour = hour.toString().padStart(2, '0');
          const formattedMinute = minute.toString().padStart(2, '0');
          slots.push(`${formattedHour}:${formattedMinute}`);
        }
      }
      return slots;
    }

    // Get the day of week for selected date
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const selectedDayName = dayNames[selectedDate.getDay()];
    
    // Find availability for the selected day
    const dayAvailability = doctorAvailability.find(
      schedule => schedule.day_of_week.toLowerCase() === selectedDayName
    );
    
    if (!dayAvailability) {
      return []; // No availability for this day
    }

    // Generate time slots based on doctor's availability and consultation duration
    const slots = [];
    const startTime = dayAvailability.start_time; // e.g., "09:00:00"
    const endTime = dayAvailability.end_time;     // e.g., "17:00:00"
    
    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Generate slots based on consultation duration within the available time range
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    // Calculate end time in minutes for easier comparison
    const endTimeMinutes = endHour * 60 + endMinute;
    
    while (true) {
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      // Stop if we've reached or passed the end time
      if (currentTimeMinutes >= endTimeMinutes) {
        break;
      }
      
      // Add the current slot
      const formattedHour = currentHour.toString().padStart(2, '0');
      const formattedMinute = currentMinute.toString().padStart(2, '0');
      slots.push(`${formattedHour}:${formattedMinute}`);
      
      // Add consultation duration minutes for next slot
      currentMinute += consultationDuration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    
    return slots;
  };

  // Get available time slots (excluding already booked appointments)
  const getAvailableTimeSlots = () => {
    const allSlots = generateTimeSlots();
    
    if (!selectedDoctor || !selectedDate) {
      return allSlots;
    }

    // Get appointments for selected doctor and date
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const doctorAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_date || appointment.date);
      const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
      return appointment.doctor_id === selectedDoctor.id && 
             appointmentDateStr === selectedDateStr &&
             appointment.status !== 'cancelled'; // Don't exclude cancelled appointments
    });

    // Filter out booked time slots
    const bookedTimes = doctorAppointments.map(apt => apt.appointment_time);
    return allSlots.filter(slot => !bookedTimes.includes(slot));
  };

  // Handle doctor selection and load their availability
  const handleDoctorSelect = async (doctorId) => {
    const doctor = availableDoctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor);
    setNewAppointment(prev => ({ ...prev, doctorId }));

    if (doctorId) {
      await loadDoctorAvailability(doctorId);
    } else {
      setDoctorAvailability([]);
      setAvailableWeekdays([]);
    }
  };

  // Load doctor's availability schedule
  const loadDoctorAvailability = async (doctorId) => {
    try {
      setIsLoadingAvailability(true);
      const response = await doctorAvailabilityService.getDoctorAvailability(doctorId);
      
      console.log('[AppointmentsPage] Doctor availability response:', response);
      
      if (response.success && response.data) {
        setDoctorAvailability(response.data);
        
        console.log('[AppointmentsPage] Raw availability data:', response.data);
        
        // Extract available weekdays (0 = Sunday, 1 = Monday, etc.)
        const weekdays = response.data
          .filter(schedule => schedule.is_active) // Only include active schedules
          .map(schedule => {
            const dayMap = {
              'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
              'friday': 5, 'saturday': 6, 'sunday': 0
            };
            const dayIndex = dayMap[schedule.day_of_week.toLowerCase()];
            console.log('[AppointmentsPage] Mapping day:', schedule.day_of_week, '→', dayIndex);
            return dayIndex;
          })
          .filter(day => day !== undefined);
        
        console.log('[AppointmentsPage] Available weekday indices:', weekdays);
        setAvailableWeekdays(weekdays);
      } else {
        console.warn('No availability data found for doctor:', doctorId);
        // Fallback - assume Monday to Friday availability
        setAvailableWeekdays([1, 2, 3, 4, 5]);
      }
    } catch (error) {
      console.error('Error loading doctor availability:', error);
      // Fallback - assume Monday to Friday availability
      setAvailableWeekdays([1, 2, 3, 4, 5]);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Check if a date is available for the selected doctor
  const isDateAvailable = (date) => {
    if (!selectedDoctor || availableWeekdays.length === 0) return false;
    
    const today = new Date(2025, 9, 28); // October 28, 2025
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates and today
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    if (dateToCheck <= today) return false;
    
    // Check if the day of the week is available
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const isAvailable = availableWeekdays.includes(dayOfWeek);
    
    // Log for debugging (only for dates in current month to reduce noise)
    if (date.getMonth() === new Date().getMonth()) {
      console.log(`[isDateAvailable] ${date.toDateString()} (${dayNames[dayOfWeek]}, index ${dayOfWeek}):`, 
        isAvailable ? '✓ Available' : '✗ Not available',
        '| Available weekdays:', availableWeekdays);
    }
    
    return isAvailable;
  };

  // Custom day renderer for calendar to highlight available days
  const renderDay = (date) => {
    const isAvailable = isDateAvailable(date);
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    const isPast = date < new Date();
    
    return (
      <div className={`
        w-full h-full flex items-center justify-center relative
        ${isPast ? 'text-muted-foreground cursor-not-allowed' : ''}
        ${isAvailable && !isPast ? 'bg-primary/10 text-primary font-medium' : ''}
        ${isSelected ? 'bg-primary text-primary-foreground' : ''}
        ${!isAvailable && !isPast && selectedDoctor ? 'text-muted-foreground bg-muted/30' : ''}
      `}>
        {date.getDate()}
        {isAvailable && !isPast && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
          </div>
        )}
      </div>
    );
  };

  // Generate calendar days for current month view
  const generateCalendarDays = (month) => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 41); // 6 weeks
    
    for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    
    // Get current date for comparison - October 28, 2025
    const today = new Date(2025, 9, 28);
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Prevent navigation to months before current month
    if (direction < 0 && newMonth < currentMonth) {
      console.log('Cannot navigate to past months');
      return;
    }
    
    setCalendarMonth(newMonth);
    console.log('Calendar navigated to:', newMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  };

  const goToToday = () => {
    const today = new Date(2025, 9, 28); // October 28, 2025
    setCalendarMonth(new Date(today)); // Create new Date object
    setSelectedDate(new Date(today)); // Create new Date object
    console.log('Calendar reset to today:', today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  };

  // Check if we can navigate to previous month
  const canNavigatePrevious = () => {
    const today = new Date(2025, 9, 28); // October 28, 2025
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const calendarMonthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    return calendarMonthStart > currentMonth;
  };

    const handleNewAppointment = async () => {
    try {
      // Validate that a time slot is selected
      if (!newAppointment.time) {
        setError('Please select a time slot');
        return;
      }

      // Validate that the selected time is still available
      if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(newAppointment.time)) {
        setError('The selected time slot is no longer available. Please choose another time.');
        return;
      }

      setError(''); // Clear any previous errors

      const appointmentData = {
        patient_id: newAppointment.patientId,
        doctor_id: newAppointment.doctorId,
        appointment_date: selectedDate.toISOString().split('T')[0],
        appointment_time: newAppointment.time,
        appointment_type: newAppointment.type,
        notes: newAppointment.notes,
        status: 'scheduled'
      };

      console.log('[AppointmentsPage] Creating appointment:', appointmentData);

      const result = await appointmentService.createAppointment(appointmentData);
      
      if (result.success) {
        setShowAlert(true);
        
        // Reset all form states
        setNewAppointment({
          patientId: '',
          doctorId: '',
          date: new Date(),
          time: '',
          type: 'Regular Checkup',
          notes: ''
        });
        
        // Reset time slots state
        setAvailableTimeSlots([]);
        setTimeSlotError('');
        setIsLoadingTimeSlots(false);
        
        // Reset doctor-related states
        setSelectedDoctor(null);
        setDoctorAvailability([]);
        setAvailableWeekdays([]);
        
        // Reset selected date to today
        const today = new Date(2025, 9, 28);
        setSelectedDate(new Date(today));
        setCalendarMonth(new Date(today));
        
        // Refresh appointments
        loadData();
        
        setTimeout(() => {
          setShowAlert(false);
          setShowNewAppointment(false);
        }, 2000);
      } else {
        setError(result.message || 'Failed to schedule appointment. Please try again.');
      }
    } catch (error) {
      console.error('[AppointmentsPage] Error creating appointment:', error);
      setError(error.message || 'Failed to schedule appointment. Please try again.');
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

  const handleCancelAppointment = async (appointmentId) => {
    try {
      console.log('[AppointmentsPage] Cancelling appointment:', appointmentId);
      const result = await appointmentService.updateAppointmentStatus(appointmentId, 'cancelled');
      console.log('[AppointmentsPage] Cancel result:', result);
      
      if (result.success) {
        console.log('Appointment cancelled successfully');
        // Reload appointments to get fresh data
        await loadData();
        // Show success message
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      } else {
        console.error('[AppointmentsPage] Cancel failed:', result);
        setError(result.message || 'Failed to cancel appointment. Please try again.');
      }
    } catch (error) {
      console.error('[AppointmentsPage] Error cancelling appointment:', error);
      setError(error.response?.data?.message || error.message || 'Failed to cancel appointment. Please try again.');
    }
  };

  const handleRescheduleAppointment = async (appointment) => {
    // Pre-fill the appointment form with existing data for rescheduling
    console.log('[AppointmentsPage] Rescheduling appointment:', appointment);
    const patient = patients.find(p => p.id === appointment.patient_id);
    const doctor = availableDoctors.find(d => d.id === appointment.doctor_id);
    
    if (!patient) {
      console.error('[AppointmentsPage] Patient not found:', appointment.patient_id);
      setError('Patient not found. Please refresh the page.');
      return;
    }
    
    if (!doctor) {
      console.error('[AppointmentsPage] Doctor not found:', appointment.doctor_id);
      setError('Doctor not found. Please refresh the page.');
      return;
    }
    
    if (patient && doctor) {
      console.log('[AppointmentsPage] Setting up reschedule with patient:', patient.first_name, 'and doctor:', doctor.first_name);
      
      // First cancel the existing appointment
      console.log('[AppointmentsPage] Cancelling original appointment before rescheduling');
      await handleCancelAppointment(appointment.id);
      
      // Then set up the form for new appointment
      setNewAppointment({
        patientId: appointment.patient_id,
        doctorId: appointment.doctor_id,
        date: new Date(appointment.appointment_date),
        time: appointment.appointment_time,
        type: appointment.appointment_type || 'Regular Checkup',
        notes: appointment.notes || ''
      });
      
      // Set the selected doctor and date
      setSelectedDoctor(doctor);
      setSelectedDate(new Date(appointment.appointment_date));
      
      // Load doctor availability
      await loadDoctorAvailability(appointment.doctor_id);
      
      // Show the new appointment form
      setShowNewAppointment(true);
    }
  };

  return (
    <PageLayout
      title="Appointments"
      subtitle="Schedule and manage patient appointments"
      fullWidth
    >
      <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-4 md:p-8">
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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1" />
          <Button
            onClick={() => setShowNewAppointment(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm md:text-base py-2 sm:py-3 px-3 sm:px-4 w-full sm:w-auto"
          >
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">New Appointment</span>
            <span className="sm:hidden">New Appointment</span>
          </Button>
        </div>

        {showNewAppointment ? (
          <Card className="w-full p-3 sm:p-4 lg:p-6 bg-card">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl mb-2 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                Schedule New Appointment
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Select a doctor first to see their available dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4 sm:space-y-6">
                
                {/* Step 1: Doctor Selection */}
                <div className="p-3 sm:p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-medium">
                      1
                    </div>
                    <h3 className="text-base sm:text-lg font-medium sm:font-semibold text-primary">Select Doctor</h3>
                  </div>
                  <SearchableSelect
                    options={availableDoctors}
                    value={newAppointment.doctorId}
                    onValueChange={handleDoctorSelect}
                    placeholder="Choose a doctor to see available dates..."
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
                    className="w-full text-xs sm:text-sm"
                    triggerClassName="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                  
                  {selectedDoctor && (
                    <div className="mt-3 p-3 bg-background rounded-md border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                        </div>
                        <div>
                          <p className="font-medium">Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</p>
                          <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
                        </div>
                      </div>
                      
                      {isLoadingAvailability ? (
                        <div className="mt-2 text-sm text-muted-foreground">Loading availability...</div>
                      ) : availableWeekdays.length > 0 ? (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Available: {availableWeekdays.map(day => {
                            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            return days[day];
                          }).join(', ')}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-amber-600">
                          ⚠️ No availability schedule found - defaulting to Mon-Fri
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  
                  {/* Left Column - Patient & Type */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="p-3 sm:p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs sm:text-sm font-medium">
                          2
                        </div>
                        <h3 className="text-base sm:text-lg font-medium">Patient Details</h3>
                      </div>
                      
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="text-xs sm:text-sm font-medium block mb-1 sm:mb-2">Patient *</label>
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
                              `${option.first_name} ${option.last_name} ${option.phone || ''}`.toLowerCase().includes(searchTerm)
                            }
                            className="w-full text-xs sm:text-sm"
                            triggerClassName="h-9 sm:h-10 text-xs sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs sm:text-sm font-medium block mb-1 sm:mb-2">Appointment Type *</label>
                          <Select
                            value={newAppointment.type}
                            onValueChange={(value) => 
                              setNewAppointment(prev => ({ ...prev, type: value }))
                            }
                          >
                            <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Regular Checkup" className="text-xs sm:text-sm">Regular Checkup</SelectItem>
                              <SelectItem value="Follow-up" className="text-xs sm:text-sm">Follow-up</SelectItem>
                              <SelectItem value="Consultation" className="text-xs sm:text-sm">Consultation</SelectItem>
                              <SelectItem value="Emergency" className="text-xs sm:text-sm">Emergency</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-xs sm:text-sm font-medium block mb-1 sm:mb-2">Notes</label>
                          <Textarea
                            value={newAppointment.notes}
                            onChange={(e) => 
                              setNewAppointment(prev => ({ ...prev, notes: e.target.value }))
                            }
                            placeholder="Add any additional notes..."
                            className="min-h-[80px] sm:min-h-[100px] text-xs sm:text-sm p-2 sm:p-3"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Date & Time Selection */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className={`p-3 sm:p-4 border rounded-lg ${!selectedDoctor ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                          selectedDoctor ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          3
                        </div>
                        <h3 className="text-base sm:text-lg font-medium">Date & Time</h3>
                      </div>

                      {!selectedDoctor ? (
                        <div className="text-center py-6 sm:py-8 text-muted-foreground">
                          <CalendarIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm sm:text-base">Please select a doctor first</p>
                          <p className="text-xs sm:text-sm">Available dates will be highlighted</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Info message about same-day appointments */}
                          <div className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-start gap-2 text-blue-800">
                              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
                              <div className="text-xs sm:text-sm">
                                <p className="font-medium mb-1">Appointment Scheduling Policy</p>
                                <p className="text-blue-700">Same-day appointments are not allowed. Please schedule for tomorrow or later for better management.</p>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-xs sm:text-sm font-medium block mb-1 sm:mb-2">
                              Date * 
                              <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 sm:ml-2">
                                (Highlighted days are available)
                              </span>
                            </label>
                            <div className="border rounded-lg p-1 sm:p-2 md:p-3 lg:p-4 bg-background shadow-sm">
                              {/* Custom Calendar */}
                              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                                {/* Month Navigation */}
                                <div className="flex items-center justify-between">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigateMonth(-1)}
                                    disabled={!canNavigatePrevious()}
                                    className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={!canNavigatePrevious() ? "Cannot go to past months" : "Previous month"}
                                  >
                                    <ChevronLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                                  </Button>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1 md:gap-2 text-center">
                                    <h3 className="font-medium text-xs sm:text-sm md:text-base lg:text-lg leading-tight">
                                      {calendarMonth.toLocaleDateString('en-US', { 
                                        month: 'long', 
                                        year: 'numeric' 
                                      })}
                                    </h3>
                                    <Button
                                      type="button"
                                      variant="default"
                                      size="sm"
                                      onClick={goToToday}
                                      className="h-5 sm:h-6 md:h-7 px-1.5 sm:px-2 md:px-3 text-[10px] sm:text-xs md:text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-normal"
                                      title="Go to current month"
                                    >
                                      <span className="hidden sm:inline">Current Month</span>
                                      <span className="sm:hidden">Now</span>
                                    </Button>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigateMonth(1)}
                                    className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 hover:bg-primary/10"
                                    title="Next month"
                                  >
                                    <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                                  </Button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="space-y-1 sm:space-y-2">
                                  {/* Day headers */}
                                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                      <div key={idx} className="h-5 sm:h-6 md:h-8 lg:h-9 flex items-center justify-center text-[10px] sm:text-xs font-medium text-muted-foreground">
                                        <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}</span>
                                        <span className="sm:hidden">{day}</span>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Calendar days */}
                                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                                    {generateCalendarDays(calendarMonth).map((date, index) => {
                                      const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                                      const isAvailable = isDateAvailable(date);
                                      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                                      const today = new Date(2025, 9, 28); // October 28, 2025
                                      today.setHours(0, 0, 0, 0);
                                      const dateToCheck = new Date(date);
                                      dateToCheck.setHours(0, 0, 0, 0);
                                      const isPast = dateToCheck < today;
                                      const isToday = dateToCheck.getTime() === today.getTime();
                                      const isDisabled = isPast || isToday; // Disable past dates AND today
                                      
                                      return (
                                        <button
                                          key={index}
                                          type="button"
                                          onClick={() => {
                                            if (isAvailable && !isDisabled) {
                                              setSelectedDate(date);
                                              // Reset time when date changes to ensure selected time is available
                                              setNewAppointment(prev => ({ ...prev, time: '' }));
                                            }
                                          }}
                                          disabled={!isAvailable || isDisabled}
                                          className={`
                                            h-6 w-full sm:h-7 md:h-8 lg:h-9 min-h-[24px] sm:min-h-[28px] md:min-h-[32px] lg:min-h-[36px] 
                                            flex items-center justify-center text-[10px] sm:text-xs md:text-sm relative 
                                            rounded-sm sm:rounded-md transition-all duration-200 font-medium overflow-hidden
                                            border-0 sm:border
                                            ${!isCurrentMonth ? 'text-muted-foreground/30' : ''}
                                            ${isDisabled ? 'text-muted-foreground/40 cursor-not-allowed bg-gray-100' : ''}
                                            ${isAvailable && !isDisabled && isCurrentMonth 
                                              ? 'bg-green-100 text-green-800 hover:bg-green-200 border-2 border-green-300 shadow-sm hover:shadow-md transform hover:scale-105' 
                                              : ''
                                            }
                                            ${!isAvailable && !isDisabled && selectedDoctor && isCurrentMonth 
                                              ? 'text-red-600 bg-red-50 cursor-not-allowed border border-red-200' 
                                              : ''
                                            }
                                            ${isSelected 
                                              ? 'bg-blue-200 text-blue-900 hover:bg-blue-300 font-bold shadow-lg ring-2 ring-blue-400 transform scale-105' 
                                              : ''
                                            }
                                            ${isToday && !isSelected ? 'ring-2 ring-orange-400 bg-orange-50/50 text-orange-700 font-semibold line-through' : ''}
                                            ${!isAvailable && !isDisabled && !selectedDoctor && isCurrentMonth
                                              ? 'hover:bg-gray-100 border border-gray-200 text-gray-600'
                                              : ''
                                            }
                                            ${!isCurrentMonth ? 'border border-transparent' : ''}
                                          `}
                                        >
                                          <span className="relative z-10 leading-none">
                                            {date.getDate()}
                                          </span>
                                          {isAvailable && !isDisabled && isCurrentMonth && !isSelected && (
                                            <div className="absolute top-0 sm:top-0.5 md:top-1 right-0 sm:right-0.5 md:right-1">
                                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 shadow-sm"></div>
                                            </div>
                                          )}
                                          {isToday && !isSelected && (
                                            <div className="absolute bottom-0 sm:bottom-0.5 left-1/2 transform -translate-x-1/2">
                                              <div className="text-[4px] sm:text-[6px] md:text-[8px] font-bold text-orange-600 leading-none">•</div>
                                            </div>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Legend */}
                            <div className="mt-2 sm:mt-3 p-1.5 sm:p-2 md:p-3 bg-muted/20 rounded-md">
                              <div className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 sm:mb-2">Legend:</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-1 sm:gap-1.5 lg:gap-4 text-[10px] sm:text-xs">
                                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 flex-shrink-0 rounded-sm sm:rounded-md bg-green-100 border border-green-300 sm:border-2 text-green-800 flex items-center justify-center relative font-medium text-[6px] sm:text-[8px] md:text-[10px]">
                                    15
                                    <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-green-500 -mt-0.5 -mr-0.5"></div>
                                  </div>
                                  <span className="text-muted-foreground">Available</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded-md bg-blue-200 text-blue-900 border-2 border-blue-400 flex items-center justify-center font-bold text-[10px] shadow-sm">
                                    15
                                  </div>
                                  <span className="text-muted-foreground">Selected</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded-md bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-medium text-[10px]">
                                    15
                                  </div>
                                  <span className="text-muted-foreground">Not Available</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded-md bg-orange-50/50 border-2 border-orange-400 text-orange-700 flex items-center justify-center font-semibold text-[10px] relative line-through">
                                    15
                                  </div>
                                  <span className="text-muted-foreground">Today (Not Allowed)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded-md bg-gray-100 border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">
                                    15
                                  </div>
                                  <span className="text-muted-foreground">Past Date</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs sm:text-sm font-medium block mb-1 sm:mb-2">Time *</label>
                            <Select
                              value={newAppointment.time}
                              onValueChange={(value) => 
                                setNewAppointment(prev => ({ ...prev, time: value }))
                              }
                              disabled={!selectedDoctor || !selectedDate || isLoadingTimeSlots || availableTimeSlots.length === 0}
                            >
                              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                                <SelectValue placeholder={
                                  !selectedDoctor ? "Select a doctor first" :
                                  !selectedDate ? "Select a date first" :
                                  isLoadingTimeSlots ? "Loading available times..." :
                                  timeSlotError ? timeSlotError :
                                  availableTimeSlots.length === 0 ? "No available slots" :
                                  "Select time"
                                } />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px] overflow-y-auto">
                                {isLoadingTimeSlots ? (
                                  <div className="p-2 text-xs sm:text-sm text-muted-foreground text-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
                                    Loading available time slots...
                                  </div>
                                ) : availableTimeSlots.length === 0 ? (
                                  <div className="p-2 text-xs sm:text-sm text-muted-foreground text-center">
                                    {timeSlotError || "No available time slots"}
                                  </div>
                                ) : (
                                  availableTimeSlots.map((time) => (
                                    <SelectItem key={time} value={time} className="text-xs sm:text-sm">
                                      {time}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>

                            {/* Show doctor's availability info */}
                            {selectedDoctor && selectedDate && availableTimeSlots.length > 0 && !isLoadingTimeSlots && (
                              <div className="mt-2 p-1.5 sm:p-2 bg-blue-50 border border-blue-200 rounded-md">
                                <div className="flex items-center gap-1.5 sm:gap-2 text-blue-800">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="text-[10px] sm:text-xs leading-tight">
                                    {(() => {
                                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                                      const selectedDayName = dayNames[selectedDate.getDay()];
                                      const daySchedule = doctorAvailability.find(
                                        schedule => schedule.day_of_week.toLowerCase() === selectedDayName
                                      );
                                      
                                      if (daySchedule) {
                                        const formatTime = (time) => {
                                          const [hour, minute] = time.split(':');
                                          return `${hour}:${minute}`;
                                        };
                                        return `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name} is available from ${formatTime(daySchedule.start_time)} to ${formatTime(daySchedule.end_time)}`;
                                      }
                                      return "Availability information not found";
                                    })()}
                                  </span>
                                </div>
                                <div className="text-[10px] sm:text-xs text-blue-600 mt-1 space-y-0.5 sm:space-y-1 leading-tight">
                                  <div>{availableTimeSlots.length} time slots available</div>
                                  <div>Each consultation: {consultationDuration} minutes</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {selectedDate && availableTimeSlots.length > 0 && newAppointment.time && availableTimeSlots.includes(newAppointment.time) && (
                            <div className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-md">
                              <div className="flex items-center gap-1.5 sm:gap-2 text-green-800">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm font-medium leading-tight">
                                  Appointment scheduled for {selectedDate.toLocaleDateString('en-US', { 
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })} at {newAppointment.time}
                                </span>
                              </div>
                              {selectedDoctor && (
                                <div className="text-xs sm:text-sm text-green-700 mt-1 leading-tight">
                                  with Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                                  {selectedDoctor.specialty && ` (${selectedDoctor.specialty})`}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Show warning if no time selected but slots are available */}
                          {selectedDate && availableTimeSlots.length > 0 && !newAppointment.time && !isLoadingTimeSlots && (
                            <div className="p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-md">
                              <div className="flex items-center gap-1.5 sm:gap-2 text-amber-800">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm leading-tight">
                                  Please select an available time slot
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Show error if time slot error exists */}
                          {selectedDate && timeSlotError && !isLoadingTimeSlots && (
                            <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md">
                              <div className="flex items-center gap-1.5 sm:gap-2 text-red-800">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm leading-tight">
                                  {timeSlotError}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewAppointment(false);
                      setSelectedDoctor(null);
                      setDoctorAvailability([]);
                      setAvailableWeekdays([]);
                      setAvailableTimeSlots([]);
                      setTimeSlotError('');
                      setIsLoadingTimeSlots(false);
                      setNewAppointment({
                        patientId: '',
                        doctorId: '',
                        date: new Date(),
                        time: '09:00',
                        type: 'Regular Checkup',
                        notes: ''
                      });
                    }}
                    className="px-4 sm:px-6 text-xs sm:text-sm h-8 sm:h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNewAppointment}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 sm:px-6 text-xs sm:text-sm h-8 sm:h-9"
                    disabled={
                      !newAppointment.patientId || 
                      !newAppointment.doctorId || 
                      !selectedDate || 
                      !newAppointment.time ||
                      isLoadingTimeSlots ||
                      availableTimeSlots.length === 0 ||
                      !availableTimeSlots.includes(newAppointment.time)
                    }
                  >
                    <span className="hidden sm:inline">Schedule Appointment</span>
                    <span className="sm:hidden">Schedule</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
            <div className="space-y-4 sm:space-y-6">
              <Card className="bg-card p-3 sm:p-4 md:p-6">
                <CardHeader className="px-0 pt-0 pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg md:text-xl leading-tight">
                    Appointments for {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 sm:left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-muted-foreground" />
                      <Input
                        placeholder="Search by patient name, patient ID, phone, doctor, or appointment type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 sm:pl-10 md:pl-14 h-9 sm:h-10 md:h-14 text-xs sm:text-sm md:text-lg"
                      />
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-full lg:w-auto lg:min-w-[380px]">
                    <div className="border rounded-lg p-1 sm:p-2 md:p-4 lg:p-6 bg-background">
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
                <Card className="bg-card p-4 sm:p-6 md:p-8">
                  <div className="text-center">
                    <div className="text-sm sm:text-base md:text-lg text-muted-foreground">Loading appointments...</div>
                  </div>
                </Card>
              ) : filteredAppointments.length === 0 ? (
                <Card className="bg-card p-4 sm:p-6 md:p-8">
                  <div className="text-center">
                    <div className="text-sm sm:text-base md:text-lg text-muted-foreground">
                      {searchTerm 
                        ? 'No appointments found matching your search.'
                        : 'No appointments scheduled for this date.'
                      }
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredAppointments
                    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                    .map((appointment, index) => {
                      const patient = patients.find(p => p.id === appointment.patient_id);
                      const doctor = availableDoctors.find(d => d.id === appointment.doctor_id);
                      
                      return (
                        <AppointmentPatientCard
                          key={appointment.id}
                          appointment={appointment}
                          patient={patient}
                          doctor={doctor}
                          onCancel={handleCancelAppointment}
                          onReschedule={handleRescheduleAppointment}
                          onViewDetails={handleViewDetails}
                          index={index}
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
