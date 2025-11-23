import { LoadingSpinner, EmptyState } from '@/components/library';
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/library';
import { Textarea } from '@/components/ui/textarea';
import doctorAvailabilityService from '../services/doctorAvailabilityService';
import { patientService } from '@/features/patients';
import { userService } from '@/features/admin';
import clinicSettingsService from '@/services/clinicSettingsService';
import { useAppointments } from '../hooks/useAppointments';
import { useCreateAppointment } from '../hooks/useCreateAppointment';
import { useUpdateAppointmentStatus } from '../hooks/useUpdateAppointmentStatus';
import { AlertModal } from '@/components/library';
import logger from '@/utils/logger';
import PageLayout from '@/components/layout/PageLayout';
import AppointmentPatientCard from '../components/AppointmentPatientCard';
import AppointmentDetailModal from '../components/AppointmentDetailModal';

const AppointmentsPage = () => {
  const location = useLocation();

  // Consultation duration in minutes (fetched from clinic_settings table)
  const [consultationDuration, setConsultationDuration] = useState(15); // Default fallback

  const [selectedDate, setSelectedDate] = useState(new Date()); // Today's date
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
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

  // Fetch appointments via React Query and keep local state in sync (no UI behavior change)
  const {
    data: appointmentsHookData,
    isLoading: isAppointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useAppointments();

  // Mutation hooks for create and update operations
  const createAppointmentMutation = useCreateAppointment({
    onSuccess: () => {
      refetchAppointments();
    },
  });

  const updateAppointmentStatusMutation = useUpdateAppointmentStatus({
    onSuccess: () => {
      refetchAppointments();
    },
  });

  // Ref to prevent redundant time clears
  const lastTimeClearKeyRef = useRef('');

  // Add a dedicated state for calendar display
  const [calendarMonthDisplay, setCalendarMonthDisplay] = useState('November 2025');

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return today;
  });
  const [newAppointment, setNewAppointment] = useState({
    patientId: location.state?.patient?.id || '',
    doctorId: location.state?.doctor?.id || '',
    date: new Date(), // Initialize to current date
    time: '09:00',
    type: 'Regular Checkup',
    reason_for_visit: '',
    notes: '',
  });

  useEffect(() => {
    // If we have pre-filled data from navigation
    if (location.state) {
      setShowNewAppointment(true);
      setNewAppointment((prev) => ({
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

      const [doctorsData, patientsData] = await Promise.all([
        userService.getUsersByRole('doctor'),
        patientService.getAllPatients(),
      ]);

      setAvailableDoctors(doctorsData?.data || []);
      setPatients(patientsData?.data || []);

      // Fetch consultation duration from clinic settings
      try {
        const duration = await clinicSettingsService.getConsultationDuration();
        setConsultationDuration(duration);
        logger.debug('Consultation duration loaded:', duration, 'minutes');
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

    // Ensure calendar month is set to current month
    const today = new Date();
    setCalendarMonth(new Date(today));
    setSelectedDate(new Date(today));
  }, []);

  // Surface hook errors to the page-level error banner when present
  useEffect(() => {
    if (appointmentsError && !error) {
      const msg =
        typeof appointmentsError === 'string' ? appointmentsError : appointmentsError.message;
      if (msg) {
        setError(msg);
      }
    }
  }, [appointmentsError]);

  // Update calendar display when month changes
  useEffect(() => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const display = `${monthNames[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`;
    setCalendarMonthDisplay(display);
  }, [calendarMonth]);

  // Reset selected time when doctor or availability changes
  useEffect(() => {
    if (selectedDoctor && doctorAvailability.length > 0) {
      // Reset time to ensure it's valid for the new doctor/availability
      setNewAppointment((prev) => (prev.time ? { ...prev, time: '' } : prev));
    }
  }, [selectedDoctor, doctorAvailability]);

  // Load available time slots when doctor or date changes
  useEffect(() => {
    const loadAvailableTimeSlots = async () => {
      if (!newAppointment.doctorId || !selectedDate) {
        setAvailableTimeSlots([]);
        return;
      }

      try {
        setIsLoadingTimeSlots(true);
        setTimeSlotError('');

        // Format date in local timezone to avoid timezone conversion issues
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const result = await doctorAvailabilityService.getAvailableTimeSlots(
          newAppointment.doctorId,
          dateStr
        );

        if (result && result.slots) {
          setAvailableTimeSlots(result.slots);

          // If current selected time is not available, clear it (guard with ref to prevent loops)
          const clearKey = `${newAppointment.doctorId}-${dateStr}`;
          if (
            newAppointment.time &&
            !result.slots.includes(newAppointment.time) &&
            lastTimeClearKeyRef.current !== clearKey
          ) {
            lastTimeClearKeyRef.current = clearKey;
            setNewAppointment((prev) => ({ ...prev, time: '' }));
          }

          // Show message if no slots available
          if (result.slots.length === 0) {
            const errorMsg =
              result.message || 'No available time slots for this doctor on the selected date';
            setTimeSlotError(errorMsg);
          }
        } else {
          setTimeSlotError('Failed to load time slots - invalid response');
        }
      } catch (error) {
        logger.error('[AppointmentsPage] Error loading time slots:', error);
        setTimeSlotError(
          `Failed to load available time slots: ${error.message || 'Unknown error'}`
        );
        setAvailableTimeSlots([]);
      } finally {
        setIsLoadingTimeSlots(false);
      }
    };

    loadAvailableTimeSlots();
  }, [newAppointment.doctorId, selectedDate]);

  // Filter appointments based on date and search term
  const filteredAppointments = (appointmentsHookData || []).filter((appointment) => {
    // Check if date matches - handle both 'date' and 'appointment_date' fields
    const appointmentDate = new Date(appointment.appointment_date || appointment.date);
    const isSameDate = appointmentDate.toDateString() === selectedDate.toDateString();
    if (!isSameDate) {
      return false;
    }

    // If no search term, return all appointments for the date
    if (!searchTerm) {
      return true;
    }

    const searchLower = searchTerm.toLowerCase();
    const patient = patients.find((p) => p.id === appointment.patient_id);
    const doctor = availableDoctors.find((d) => d.id === appointment.doctor_id);

    const searchFields = [
      `${patient?.first_name} ${patient?.last_name}`,
      `${doctor?.first_name} ${doctor?.last_name}`,
      doctor?.specialty,
      appointment.appointment_type,
      patient?.patient_number, // Added patient ID/number search
      patient?.phone, // Added phone number search
      patient?.email, // Added email search
    ]
      .filter(Boolean)
      .map((field) => field.toLowerCase());

    return searchFields.some((field) => field.includes(searchLower));
  });

  const generateTimeSlots = () => {
    // Appointment slots use 30-minute intervals for buffer time
    // (separate from consultation duration which is used for wait time calculations)
    const APPOINTMENT_SLOT_INTERVAL = 30;

    // If no doctor selected or no availability data, show default slots
    if (!selectedDoctor || !doctorAvailability.length || !selectedDate) {
      const slots = [];
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += APPOINTMENT_SLOT_INTERVAL) {
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
      (schedule) => schedule.day_of_week.toLowerCase() === selectedDayName
    );

    if (!dayAvailability) {
      return []; // No availability for this day
    }

    // Generate time slots based on doctor's availability (30-minute intervals)
    const slots = [];
    const startTime = dayAvailability.start_time; // e.g., "09:00:00"
    const endTime = dayAvailability.end_time; // e.g., "17:00:00"

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Generate slots based on 30-minute intervals within the available time range
    // Calculate end time in minutes for easier comparison
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    for (
      let currentTimeMinutes = startTimeMinutes;
      currentTimeMinutes < endTimeMinutes;
      currentTimeMinutes += APPOINTMENT_SLOT_INTERVAL
    ) {
      const currentHour = Math.floor(currentTimeMinutes / 60);
      const currentMinute = currentTimeMinutes % 60;

      // Add the current slot
      const formattedHour = currentHour.toString().padStart(2, '0');
      const formattedMinute = currentMinute.toString().padStart(2, '0');
      slots.push(`${formattedHour}:${formattedMinute}`);
    }

    return slots;
  };

  // Get available time slots (excluding already booked appointments)
  const _getAvailableTimeSlots = () => {
    const allSlots = generateTimeSlots();

    if (!selectedDoctor || !selectedDate) {
      return allSlots;
    }

    // Get appointments for selected doctor and date
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const doctorAppointments = (appointmentsHookData || []).filter((appointment) => {
      const appointmentDate = new Date(appointment.appointment_date || appointment.date);
      const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
      return (
        appointment.doctor_id === selectedDoctor.id &&
        appointmentDateStr === selectedDateStr &&
        appointment.status !== 'cancelled'
      ); // Don't exclude cancelled appointments
    });

    // Filter out booked time slots
    const bookedTimes = doctorAppointments.map((apt) => apt.appointment_time);
    return allSlots.filter((slot) => !bookedTimes.includes(slot));
  };

  // Handle doctor selection and load their availability
  const handleDoctorSelect = async (doctorId) => {
    const doctor = availableDoctors.find((d) => d.id === doctorId);
    setSelectedDoctor(doctor);
    setNewAppointment((prev) => ({ ...prev, doctorId }));

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

      // Response is directly an array, not wrapped in {success, data}
      if (response && Array.isArray(response) && response.length > 0) {
        setDoctorAvailability(response);

        // Extract available weekdays (0 = Sunday, 1 = Monday, etc.)
        const dayMap = {
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
          sunday: 0,
        };

        const weekdays = [
          ...new Set(
            response
              .filter((schedule) => schedule.is_active) // Only include active schedules
              .map((schedule) => {
                const dayIndex = dayMap[schedule.day_of_week.toLowerCase()];
                return dayIndex;
              })
              .filter((day) => day !== undefined)
          ),
        ];

        setAvailableWeekdays(weekdays);
      } else {
        logger.warn('No availability data found for doctor:', doctorId);
        // Fallback - assume Monday to Friday availability
        setAvailableWeekdays([1, 2, 3, 4, 5]);
      }
    } catch (error) {
      logger.error('Error loading doctor availability:', error);
      // Fallback - assume Monday to Friday availability
      setAvailableWeekdays([1, 2, 3, 4, 5]);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Check if a date is available for the selected doctor
  const isDateAvailable = (date) => {
    if (!selectedDoctor || availableWeekdays.length === 0) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Disable past dates and today
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    if (dateToCheck <= today) {
      return false;
    }

    // Check if the day of the week is available
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const isAvailable = availableWeekdays.includes(dayOfWeek);

    return isAvailable;
  };
  // Custom day renderer for calendar to highlight available days
  const _renderDay = (date) => {
    const isAvailable = isDateAvailable(date);
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    const isPast = date < new Date();

    return (
      <div
        className={`relative flex h-full w-full items-center justify-center ${isPast ? 'cursor-not-allowed text-muted-foreground' : ''} ${isAvailable && !isPast ? 'bg-primary/10 font-medium text-primary' : ''} ${isSelected ? 'bg-primary text-primary-foreground' : ''} ${!isAvailable && !isPast && selectedDoctor ? 'bg-muted/30 text-muted-foreground' : ''} `}
      >
        {date.getDate()}
        {isAvailable && !isPast && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 transform">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
          </div>
        )}
      </div>
    );
  };

  // Generate calendar days for current month view
  const generateCalendarDays = (month) => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const _lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
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

    // Get current date for comparison
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Prevent navigation to months before current month
    if (direction < 0 && newMonth < currentMonth) {
      return;
    }

    setCalendarMonth(newMonth);
  };

  const goToToday = () => {
    const today = new Date();
    setCalendarMonth(new Date(today)); // Create new Date object
    setSelectedDate(new Date(today)); // Create new Date object
  };

  // Check if we can navigate to previous month
  const canNavigatePrevious = () => {
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const calendarMonthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    return calendarMonthStart > currentMonth;
  };

  const handleNewAppointment = async () => {
    try {
      // Validate that appointment is not for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(0, 0, 0, 0);

      if (appointmentDate.getTime() === today.getTime()) {
        setError(
          'Cannot book appointments for today. Appointments must be scheduled at least one day in advance. For same-day visits, please use walk-in registration.'
        );
        return;
      }

      // Validate that appointment is not in the past
      if (appointmentDate < today) {
        setError('Cannot book appointments for past dates. Please select a future date.');
        return;
      }

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

      // Format date in local timezone to avoid timezone conversion issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;

      const appointmentData = {
        patient_id: newAppointment.patientId,
        doctor_id: newAppointment.doctorId,
        appointment_date: localDateString,
        appointment_time: newAppointment.time,
        appointment_type: newAppointment.type,
        reason_for_visit: newAppointment.reason_for_visit || '',
        notes: newAppointment.notes,
        status: 'scheduled',
      };

      const result = await createAppointmentMutation.mutateAsync(appointmentData);

      if (result.success) {
        setShowAlert(true);

        // Reset all form states
        setNewAppointment({
          patientId: '',
          doctorId: '',
          date: new Date(),
          time: '',
          type: 'Regular Checkup',
          notes: '',
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
        const today = new Date();
        setSelectedDate(new Date(today));
        setCalendarMonth(new Date(today));

        // Note: Appointments will be refetched automatically via mutation's onSuccess

        setTimeout(() => {
          setShowAlert(false);
          setShowNewAppointment(false);
        }, 2000);
      } else {
        setError(result.message || 'Failed to schedule appointment. Please try again.');
      }
    } catch (error) {
      logger.error('[AppointmentsPage] Error creating appointment:', error);
      setError(error.message || 'Failed to schedule appointment. Please try again.');
    }
  };

  const _handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const result = await updateAppointmentStatusMutation.mutateAsync({
        appointmentId,
        status: newStatus,
      });

      if (!result.success) {
        logger.error('API returned failure:', result);
        setError('Failed to update appointment status.');
      }
    } catch (error) {
      logger.error('Error in handleStatusChange:', error);
      setError('Failed to update appointment status.');
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const result = await updateAppointmentStatusMutation.mutateAsync({
        appointmentId,
        status: 'cancelled',
      });

      if (result.success) {
        // Show success message
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      } else {
        logger.error('[AppointmentsPage] Cancel failed:', result);
        setError(result.message || 'Failed to cancel appointment. Please try again.');
      }
    } catch (error) {
      logger.error('[AppointmentsPage] Error cancelling appointment:', error);
      setError(
        error.response?.data?.message ||
          error.message ||
          'Failed to cancel appointment. Please try again.'
      );
    }
  };

  const handleRescheduleAppointment = async (appointment) => {
    // Pre-fill the appointment form with existing data for rescheduling
    const patient = patients.find((p) => p.id === appointment.patient_id);
    const doctor = availableDoctors.find((d) => d.id === appointment.doctor_id);

    if (!patient) {
      logger.error('[AppointmentsPage] Patient not found:', appointment.patient_id);
      setError('Patient not found. Please refresh the page.');
      return;
    }

    if (!doctor) {
      logger.error('[AppointmentsPage] Doctor not found:', appointment.doctor_id);
      setError('Doctor not found. Please refresh the page.');
      return;
    }

    if (patient && doctor) {
      logger.debug(
        '[AppointmentsPage] Setting up reschedule with patient:',
        patient.first_name,
        'and doctor:',
        doctor.first_name
      );

      // First cancel the existing appointment
      logger.debug('[AppointmentsPage] Cancelling original appointment before rescheduling');
      await handleCancelAppointment(appointment.id);

      // Then set up the form for new appointment
      setNewAppointment({
        patientId: appointment.patient_id,
        doctorId: appointment.doctor_id,
        date: new Date(appointment.appointment_date),
        time: appointment.appointment_time,
        type: appointment.appointment_type || 'Regular Checkup',
        reason_for_visit: appointment.reason_for_visit || '',
        notes: appointment.notes || '',
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
    <PageLayout title="Appointments" subtitle="Schedule and manage patient appointments" fullWidth>
      <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 md:space-y-8 md:p-8">
        {showAlert && (
          <AlertModal
            type="success"
            message="Appointment scheduled successfully!"
            onClose={() => setShowAlert(false)}
          />
        )}

        {error && <AlertModal type="error" message={error} onClose={() => setError('')} />}

        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1" />
          <Button
            onClick={() => setShowNewAppointment(true)}
            className="hover:bg-primary/90 w-full bg-primary px-3 py-2 text-xs text-primary-foreground sm:w-auto sm:px-4 sm:py-3 sm:text-sm md:text-base"
          >
            <Plus className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">New Appointment</span>
            <span className="sm:hidden">New Appointment</span>
          </Button>
        </div>

        {showNewAppointment ? (
          <Card className="w-full bg-card p-3 sm:p-4 lg:p-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="mb-2 flex items-center gap-2 text-lg sm:text-xl">
                <CalendarIcon className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                Schedule New Appointment
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Select a doctor first to see their available dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4 sm:space-y-6">
                {/* Step 1: Doctor Selection */}
                <div className="border-primary/30 bg-primary/5 rounded-lg border-2 border-dashed p-3 sm:p-4">
                  <div className="mb-2 flex items-center gap-2 sm:mb-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground sm:h-8 sm:w-8 sm:text-sm">
                      1
                    </div>
                    <h3 className="text-base font-medium text-primary sm:text-lg sm:font-semibold">
                      Select Doctor
                    </h3>
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
                      const fullText =
                        `${option.first_name} ${option.last_name} ${option.specialty || ''}`.toLowerCase();
                      return fullText.includes(searchTerm);
                    }}
                    className="w-full text-xs sm:text-sm"
                    triggerClassName="h-9 sm:h-10 text-xs sm:text-sm"
                  />

                  {selectedDoctor && (
                    <div className="mt-3 rounded-md border bg-background p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <div className="h-6 w-6 rounded-full bg-blue-500"></div>
                        </div>
                        <div>
                          <p className="font-medium">
                            Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedDoctor.specialty}
                          </p>
                        </div>
                      </div>

                      {isLoadingAvailability ? (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Loading availability...
                        </div>
                      ) : availableWeekdays.length > 0 ? (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Available:{' '}
                          {availableWeekdays
                            .map((day) => {
                              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                              return days[day];
                            })
                            .join(', ')}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-amber-600">
                          ⚠️ No availability schedule found - defaulting to Mon-Fri
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 xl:grid-cols-2">
                  {/* Left Column - Patient & Type */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="rounded-lg border p-3 sm:p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground sm:h-8 sm:w-8 sm:text-sm">
                          2
                        </div>
                        <h3 className="text-base font-medium sm:text-lg">Patient Details</h3>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium sm:mb-2 sm:text-sm">
                            Patient *
                          </label>
                          <SearchableSelect
                            options={patients}
                            value={newAppointment.patientId}
                            onValueChange={(value) =>
                              setNewAppointment((prev) => ({ ...prev, patientId: value }))
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
                              `${option.first_name} ${option.last_name} ${option.phone || ''}`
                                .toLowerCase()
                                .includes(searchTerm)
                            }
                            className="w-full text-xs sm:text-sm"
                            triggerClassName="h-9 sm:h-10 text-xs sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium sm:mb-2 sm:text-sm">
                            Appointment Type *
                          </label>
                          <Select
                            value={newAppointment.type}
                            onValueChange={(value) =>
                              setNewAppointment((prev) => ({ ...prev, type: value }))
                            }
                          >
                            <SelectTrigger className="h-9 text-xs sm:h-10 sm:text-sm">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Regular Checkup" className="text-xs sm:text-sm">
                                Regular Checkup
                              </SelectItem>
                              <SelectItem value="Follow-up" className="text-xs sm:text-sm">
                                Follow-up
                              </SelectItem>
                              <SelectItem value="Consultation" className="text-xs sm:text-sm">
                                Consultation
                              </SelectItem>
                              <SelectItem value="Emergency" className="text-xs sm:text-sm">
                                Emergency
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium sm:mb-2 sm:text-sm">
                            Notes
                          </label>
                          <Textarea
                            value={newAppointment.notes}
                            onChange={(e) =>
                              setNewAppointment((prev) => ({ ...prev, notes: e.target.value }))
                            }
                            placeholder="Add any additional notes..."
                            className="min-h-[80px] p-2 text-xs sm:min-h-[100px] sm:p-3 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Date & Time Selection */}
                  <div className="space-y-4 sm:space-y-6">
                    <div
                      className={`rounded-lg border p-3 sm:p-4 ${!selectedDoctor ? 'opacity-50' : ''}`}
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:h-8 sm:w-8 sm:text-sm ${
                            selectedDoctor
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          3
                        </div>
                        <h3 className="text-base font-medium sm:text-lg">Date & Time</h3>
                      </div>

                      {!selectedDoctor ? (
                        <div className="py-6 text-center text-muted-foreground sm:py-8">
                          <CalendarIcon className="mx-auto mb-2 h-8 w-8 opacity-50 sm:h-12 sm:w-12" />
                          <p className="text-sm sm:text-base">Please select a doctor first</p>
                          <p className="text-xs sm:text-sm">Available dates will be highlighted</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Info message about same-day appointments */}
                          <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-2 sm:p-3">
                            <div className="flex items-start gap-2 text-blue-800 dark:text-blue-200">
                              <CalendarIcon className="mt-0.5 h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                              <div className="text-xs sm:text-sm">
                                <p className="mb-1 font-medium text-blue-800 dark:text-blue-200">Appointment Scheduling Policy</p>
                                <p className="text-blue-700 dark:text-blue-300">
                                  Same-day appointments are not allowed. Please schedule for
                                  tomorrow or later for better management.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-medium sm:mb-2 sm:text-sm">
                              Date *
                              <span className="ml-1 text-[10px] text-muted-foreground sm:ml-2 sm:text-xs">
                                (Highlighted days are available)
                              </span>
                            </label>
                            <div className="rounded-lg border bg-background p-1 shadow-sm sm:p-2 md:p-3 lg:p-4">
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
                                    className="hover:bg-primary/10 h-6 w-6 p-0 disabled:cursor-not-allowed disabled:opacity-50 sm:h-7 sm:w-7 md:h-8 md:w-8"
                                    title={
                                      !canNavigatePrevious()
                                        ? 'Cannot go to past months'
                                        : 'Previous month'
                                    }
                                  >
                                    <ChevronLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                                  </Button>
                                  <div className="flex flex-col gap-0.5 text-center sm:flex-row sm:items-center sm:gap-1 md:gap-2">
                                    <h3
                                      key={`month-${calendarMonth.getTime()}-${calendarMonthDisplay}`}
                                      className="text-xs font-medium leading-tight sm:text-sm md:text-base lg:text-lg"
                                    >
                                      {calendarMonthDisplay || 'Loading...'}
                                    </h3>
                                    <Button
                                      type="button"
                                      variant="default"
                                      size="sm"
                                      onClick={goToToday}
                                      className="hover:bg-primary/90 h-5 bg-primary px-1.5 text-[10px] font-normal text-primary-foreground sm:h-6 sm:px-2 sm:text-xs md:h-7 md:px-3 md:text-sm"
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
                                    className="hover:bg-primary/10 h-6 w-6 p-0 sm:h-7 sm:w-7 md:h-8 md:w-8"
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
                                      <div
                                        key={idx}
                                        className="flex h-5 items-center justify-center text-[10px] font-medium text-muted-foreground sm:h-6 sm:text-xs md:h-8 lg:h-9"
                                      >
                                        <span className="hidden sm:inline">
                                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}
                                        </span>
                                        <span className="sm:hidden">{day}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Calendar days */}
                                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                                    {generateCalendarDays(calendarMonth).map((date, index) => {
                                      const isCurrentMonth =
                                        date.getMonth() === calendarMonth.getMonth();
                                      const isAvailable = isDateAvailable(date);
                                      const isSelected =
                                        selectedDate &&
                                        date.toDateString() === selectedDate.toDateString();
                                      const today = new Date();
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
                                              setNewAppointment((prev) => ({ ...prev, time: '' }));
                                            }
                                          }}
                                          disabled={!isAvailable || isDisabled}
                                          className={`relative flex h-6 min-h-[24px] w-full items-center justify-center overflow-hidden rounded-sm border-0 text-[10px] font-medium transition-all duration-200 sm:h-7 sm:min-h-[28px] sm:rounded-md sm:border sm:text-xs md:h-8 md:min-h-[32px] md:text-sm lg:h-9 lg:min-h-[36px] ${!isCurrentMonth ? 'text-muted-foreground/60 dark:text-muted-foreground/50 bg-transparent' : ''} ${isDisabled ? 'text-muted-foreground/40 cursor-not-allowed bg-muted' : ''} ${
                                            isAvailable && !isDisabled && isCurrentMonth
                                              ? 'transform border-2 border-green-300 dark:border-green-700 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 shadow-sm hover:scale-105 hover:bg-green-200 dark:hover:bg-green-900/50 hover:shadow-md'
                                              : ''
                                          } ${
                                            !isAvailable &&
                                              !isDisabled &&
                                              selectedDoctor &&
                                              isCurrentMonth
                                              ? 'cursor-not-allowed border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300'
                                              : ''
                                          } ${
                                            isSelected
                                              ? 'scale-105 transform bg-blue-200 dark:bg-blue-900/50 font-bold text-blue-900 dark:text-blue-100 shadow-lg ring-2 ring-blue-400 dark:ring-blue-600 hover:bg-blue-300 dark:hover:bg-blue-900/70'
                                              : ''
                                          } ${isToday && !isSelected ? 'bg-orange-50/50 dark:bg-orange-950/30 font-semibold text-orange-700 dark:text-orange-300 line-through ring-2 ring-orange-400 dark:ring-orange-600' : ''} ${
                                            !isAvailable &&
                                              !isDisabled &&
                                              !selectedDoctor &&
                                              isCurrentMonth
                                              ? 'border border-border text-muted-foreground hover:bg-accent'
                                              : ''
                                          } ${!isCurrentMonth ? 'border border-transparent bg-transparent' : ''} `}
                                        >
                                          <span className="relative z-10 leading-none">
                                            {date.getDate()}
                                          </span>
                                          {isAvailable &&
                                            !isDisabled &&
                                            isCurrentMonth &&
                                            !isSelected && (
                                              <div className="absolute right-0 top-0 sm:right-0.5 sm:top-0.5 md:right-1 md:top-1">
                                                <div className="h-1 w-1 rounded-full bg-green-500 shadow-sm sm:h-1.5 sm:w-1.5 md:h-2 md:w-2"></div>
                                              </div>
                                            )}
                                          {isToday && !isSelected && (
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 transform sm:bottom-0.5">
                                              <div className="text-[4px] font-bold leading-none text-orange-600 sm:text-[6px] md:text-[8px]">
                                                •
                                              </div>
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
                            <div className="bg-muted/20 mt-2 rounded-md p-1.5 sm:mt-3 sm:p-2 md:p-3">
                              <div className="mb-1 text-[10px] font-medium text-muted-foreground sm:mb-2 sm:text-xs">
                                Legend:
                              </div>
                              <div className="grid grid-cols-1 gap-1 text-[10px] sm:grid-cols-2 sm:gap-1.5 sm:text-xs lg:flex lg:flex-wrap lg:gap-4">
                                <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                                  <div className="relative flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center rounded-sm border border-green-300 bg-green-100 text-[6px] font-medium text-green-800 sm:h-3 sm:w-3 sm:rounded-md sm:border-2 sm:text-[8px] md:h-4 md:w-4 md:text-[10px]">
                                    15
                                    <div className="absolute right-0 top-0 -mr-0.5 -mt-0.5 h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                  </div>
                                  <span className="text-muted-foreground">Available</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex h-4 w-4 items-center justify-center rounded-md border-2 border-blue-400 bg-blue-200 text-[10px] font-bold text-blue-900 shadow-sm">
                                    15
                                  </div>
                                  <span className="text-muted-foreground">Selected</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex h-4 w-4 items-center justify-center rounded-md border border-red-200 bg-red-50 text-[10px] font-medium text-red-600">
                                    15
                                  </div>
                                  <span className="text-muted-foreground">Not Available</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="relative flex h-4 w-4 items-center justify-center rounded-md border-2 border-orange-400 bg-orange-50/50 text-[10px] font-semibold text-orange-700 line-through">
                                    15
                                  </div>
                                  <span className="text-muted-foreground">Today (Not Allowed)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex h-4 w-4 items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-[10px] text-gray-400">
                                    15
                                  </div>
                                  <span className="text-muted-foreground">Past Date</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-medium sm:mb-2 sm:text-sm">
                              Time *
                            </label>
                            {selectedDoctor &&
                            selectedDate &&
                            !isLoadingTimeSlots &&
                            availableTimeSlots.length > 0 ? (
                              <select
                                value={newAppointment.time || ''}
                                onChange={(e) =>
                                  setNewAppointment((prev) => ({ ...prev, time: e.target.value }))
                                }
                                className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:text-sm"
                              >
                                <option value="">Select time</option>
                                {availableTimeSlots.map((time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Input
                                disabled
                                readOnly
                                value=""
                                placeholder={
                                  !selectedDoctor
                                    ? 'Select a doctor first'
                                    : !selectedDate
                                      ? 'Select a date first'
                                      : isLoadingTimeSlots
                                        ? 'Loading available times...'
                                        : timeSlotError
                                          ? 'Failed to load time slots'
                                          : 'No available slots'
                                }
                                className="h-9 text-xs sm:h-10 sm:text-sm"
                              />
                            )}

                            {/* Show doctor's availability info */}
                            {selectedDoctor &&
                              selectedDate &&
                              availableTimeSlots.length > 0 &&
                              !isLoadingTimeSlots && (
                                <div className="mt-2 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-1.5 sm:p-2">
                                  <div className="flex items-center gap-1.5 text-blue-800 sm:gap-2">
                                    <Clock className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                                    <span className="text-[10px] leading-tight sm:text-xs">
                                      {(() => {
                                        const dayNames = [
                                          'sunday',
                                          'monday',
                                          'tuesday',
                                          'wednesday',
                                          'thursday',
                                          'friday',
                                          'saturday',
                                        ];
                                        const selectedDayName = dayNames[selectedDate.getDay()];
                                        const daySchedule = doctorAvailability.find(
                                          (schedule) =>
                                            schedule.day_of_week.toLowerCase() === selectedDayName
                                        );

                                        if (daySchedule) {
                                          const formatTime = (time) => {
                                            const [hour, minute] = time.split(':');
                                            return `${hour}:${minute}`;
                                          };
                                          return `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name} is available from ${formatTime(daySchedule.start_time)} to ${formatTime(daySchedule.end_time)}`;
                                        }
                                        return 'Availability information not found';
                                      })()}
                                    </span>
                                  </div>
                                  <div className="mt-1 space-y-0.5 text-[10px] leading-tight text-blue-600 sm:space-y-1 sm:text-xs">
                                    <div>{availableTimeSlots.length} time slots available</div>
                                    <div>Each consultation: {consultationDuration} minutes</div>
                                  </div>
                                </div>
                              )}
                          </div>

                          {selectedDate &&
                            availableTimeSlots.length > 0 &&
                            newAppointment.time &&
                            availableTimeSlots.includes(newAppointment.time) && (
                              <div className="rounded-md border border-green-200 bg-green-50 p-2 sm:p-3">
                                <div className="flex items-center gap-1.5 text-green-800 sm:gap-2">
                                  <Clock className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                                  <span className="text-xs font-medium leading-tight sm:text-sm">
                                    Appointment scheduled for{' '}
                                    {selectedDate.toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}{' '}
                                    at {newAppointment.time}
                                  </span>
                                </div>
                                {selectedDoctor && (
                                  <div className="mt-1 text-xs leading-tight text-green-700 sm:text-sm">
                                    with Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                                    {selectedDoctor.specialty && ` (${selectedDoctor.specialty})`}
                                  </div>
                                )}
                              </div>
                            )}

                          {/* Show warning if no time selected but slots are available */}
                          {selectedDate &&
                            availableTimeSlots.length > 0 &&
                            !newAppointment.time &&
                            !isLoadingTimeSlots && (
                              <div className="rounded-md border border-amber-200 bg-amber-50 p-2 sm:p-3">
                                <div className="flex items-center gap-1.5 text-amber-800 sm:gap-2">
                                  <Clock className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                                  <span className="text-xs leading-tight sm:text-sm">
                                    Please select an available time slot
                                  </span>
                                </div>
                              </div>
                            )}

                          {/* Show error if time slot error exists */}
                          {selectedDate && timeSlotError && !isLoadingTimeSlots && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-2 sm:p-3">
                              <div className="flex items-center gap-1.5 text-red-800 sm:gap-2">
                                <Clock className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                                <span className="text-xs leading-tight sm:text-sm">
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

                <div className="mt-6 flex flex-col justify-end gap-2 border-t pt-4 sm:mt-8 sm:flex-row sm:gap-4 sm:pt-6">
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
                        notes: '',
                      });
                    }}
                    className="h-8 px-4 text-xs sm:h-9 sm:px-6 sm:text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNewAppointment}
                    className="hover:bg-primary/90 h-8 bg-primary px-4 text-xs text-primary-foreground sm:h-9 sm:px-6 sm:text-sm"
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
              <CardHeader className="px-0 pb-3 pt-0 sm:pb-4">
                <CardTitle className="text-base leading-tight sm:text-lg md:text-xl">
                  Appointments for{' '}
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {filteredAppointments.length} appointment
                  {filteredAppointments.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground sm:left-3 sm:h-5 sm:w-5 md:left-4 md:h-6 md:w-6" />
                    <Input
                      placeholder="Search by patient name, patient ID, phone, doctor, or appointment type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9 pl-8 text-xs sm:h-10 sm:pl-10 sm:text-sm md:h-14 md:pl-14 md:text-lg"
                    />
                  </div>
                </div>
                <div className="w-full flex-shrink-0 lg:w-auto lg:min-w-[380px]">
                  <div className="rounded-lg border bg-background p-1 sm:p-2 md:p-4 lg:p-6">
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

            {isLoading || isAppointmentsLoading ? (
              <div className="py-8">
                <LoadingSpinner label="Loading appointments..." />
              </div>
            ) : filteredAppointments.length === 0 ? (
              <EmptyState
                title={searchTerm ? 'No appointments found' : 'No appointments'}
                description={
                  searchTerm
                    ? 'No appointments found matching your search.'
                    : 'No appointments scheduled for this date.'
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6 lg:grid-cols-3">
                {filteredAppointments
                  .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                  .map((appointment, index) => {
                    const patient = patients.find((p) => p.id === appointment.patient_id);
                    const doctor = availableDoctors.find((d) => d.id === appointment.doctor_id);

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
        patient={
          selectedAppointment ? patients.find((p) => p.id === selectedAppointment.patient_id) : null
        }
        doctor={
          selectedAppointment
            ? availableDoctors.find((d) => d.id === selectedAppointment.doctor_id)
            : null
        }
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </PageLayout>
  );
};

export default AppointmentsPage;
