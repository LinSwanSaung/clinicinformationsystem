import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  User,
  Phone,
  Calendar,
  Stethoscope,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useDebounce from '@/hooks/useDebounce';
import appointmentService from '../services/appointmentService';
import { queueService } from '@/features/queue';
import apiService from '@/services/api';

const WalkInModal = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1); // 1: Select Patient, 2: Select Doctor
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientHasActiveAppointment, setPatientHasActiveAppointment] = useState(false);
  const [activeAppointmentDetails, setActiveAppointmentDetails] = useState(null);
  const [isCheckingAppointments, setIsCheckingAppointments] = useState(false);
  const [bypassCheck, setBypassCheck] = useState(false); // Temporary bypass for testing

  // Capacity check states
  const [doctorCapacity, setDoctorCapacity] = useState(null);
  const [isCheckingCapacity, setIsCheckingCapacity] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState(null);

  const debouncedPatientSearch = useDebounce(patientSearch, 300);

  // Mock doctor availability data (unused - kept for future reference)
  // const mockDoctorAvailability = [
  //   {
  //     id: '1',
  //     name: 'Dr. Sarah Smith',
  //     specialty: 'General Medicine',
  //     status: 'available',
  //     currentlyWith: null,
  //     slotsRemaining: 5,
  //     totalSlots: 8,
  //     nextAvailable: null
  //   },
  //   {
  //     id: '2',
  //     name: 'Dr. Michael Johnson',
  //     specialty: 'Cardiology',
  //     status: 'consulting',
  //     currentlyWith: 'Emma Wilson',
  //     slotsRemaining: 2,
  //     totalSlots: 6,
  //     nextAvailable: '10:30 AM'
  //   },
  //   {
  //     id: '3',
  //     name: 'Dr. Lisa Garcia',
  //     specialty: 'Pediatrics',
  //     status: 'on-break',
  //     currentlyWith: null,
  //     slotsRemaining: 4,
  //     totalSlots: 7,
  //     nextAvailable: '11:00 AM'
  //   },
  //   {
  //     id: '4',
  //     name: 'Dr. James Chen',
  //     specialty: 'Dermatology',
  //     status: 'available',
  //     currentlyWith: null,
  //     slotsRemaining: 0,
  //     totalSlots: 5,
  //     nextAvailable: '2:00 PM'
  //   }
  // ];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedPatient(null);
      setSelectedDoctor(null);
      setPatientSearch('');
      loadDoctors();
    }
  }, [isOpen]);

  useEffect(() => {
    if (debouncedPatientSearch && debouncedPatientSearch.trim().length >= 2) {
      searchPatients(debouncedPatientSearch);
    } else {
      setPatients([]);
    }
  }, [debouncedPatientSearch]);

  const searchPatients = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setPatients([]);
      return;
    }

    try {
      setIsLoadingPatients(true);

      // Use the search endpoint with the term as a URL parameter
      const response = await apiService.get(
        `/patients/search/${encodeURIComponent(searchTerm.trim())}?limit=10`
      );

      if (response.success && response.data) {
        setPatients(response.data);
      } else {
        console.warn('No patients found or unexpected response format:', response);
        setPatients([]);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatients([]);

      // Show user-friendly error message if needed
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in again.');
      } else if (error.response?.status >= 500) {
        alert('Server error. Please try again later.');
      }
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const loadDoctors = async () => {
    try {
      setIsLoadingDoctors(true);

      // Get available doctors with queue status and availability from our enhanced queue service
      const response = await queueService.getAvailableDoctorsForWalkIn();

      if (response.success && response.data) {
        // Transform to match expected format for the modal
        const doctorsWithAvailability = response.data.map((doctor) => ({
          id: doctor.id,
          name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
          specialty: doctor.specialty || 'General Medicine',
          status: doctor.status.status, // available, consulting, busy, full, unavailable
          statusText: doctor.status.text,
          statusColor: doctor.status.color,
          canAcceptPatients: doctor.status.canAcceptPatients,
          description: doctor.status.description,
          currentlyWith: doctor.queueStatus?.currentStatus?.activeConsultation,
          waitingPatients: doctor.queueStatus?.statistics?.combined?.waitingPatients || 0,
          completedToday: doctor.queueStatus?.statistics?.combined?.completedToday || 0,
          totalPatients: doctor.queueStatus?.statistics?.combined?.totalPatients || 0,
          nextAvailable: null, // Could be calculated from availability data
        }));

        console.log('Available doctors for walk-in:', doctorsWithAvailability);
        setDoctors(doctorsWithAvailability);
      } else {
        console.error('Failed to load available doctors');
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctors([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'consulting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'full':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'unavailable':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return CheckCircle;
      case 'consulting':
        return Users;
      case 'on-break':
        return Clock;
      case 'unavailable':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const checkPatientActiveAppointments = async (patient) => {
    try {
      setIsCheckingAppointments(true);

      // Get available doctors from backend
      const today = new Date().toISOString().split('T')[0];
      console.log('Checking appointments for patient:', patient.id, 'on date:', today);

      const response = await appointmentService.checkPatientActiveAppointments(patient.id);
      console.log('Appointment check response:', response);

      if (response.success && response.data && response.data.length > 0) {
        console.log('Active appointments found:', response.data);

        // Filter for truly active appointments (only today's waiting/in-progress)
        const activeToday = response.data.filter((appointment) => {
          const appointmentDate = appointment.appointment_date;
          const status = appointment.status?.toLowerCase();

          // Only consider appointments that are actually in today's active queue
          return appointmentDate === today && (status === 'waiting' || status === 'in-progress');
        });

        console.log('Filtered active appointments for today:', activeToday);

        if (activeToday.length > 0) {
          setPatientHasActiveAppointment(true);
          setActiveAppointmentDetails(activeToday[0]);
          return true;
        } else {
          setPatientHasActiveAppointment(false);
          setActiveAppointmentDetails(null);
          return false;
        }
      } else {
        console.log('No active appointments found');
        setPatientHasActiveAppointment(false);
        setActiveAppointmentDetails(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking patient appointments:', error);
      // On error, allow the process to continue but log the issue
      setPatientHasActiveAppointment(false);
      setActiveAppointmentDetails(null);
      return false;
    } finally {
      setIsCheckingAppointments(false);
    }
  };

  // New function to check for active queue tokens
  const checkPatientActiveTokens = async (patient, doctorId = null) => {
    try {
      // Use the correct debug API route format
      console.log('Checking queue tokens for patient:', patient.id, 'doctor:', doctorId);

      // Make API call to check for existing tokens via central api
      const result = await apiService.get(`/queue/debug/patient/${patient.id}/tokens`);

      if (result.success && result.data && result.data.tokens.length > 0) {
        // Filter tokens by doctor if specified, and only active statuses
        let activeTokens = result.data.tokens.filter((token) =>
          ['waiting', 'called', 'serving'].includes(token.status)
        );

        if (doctorId) {
          activeTokens = activeTokens.filter((token) => token.doctor_id === doctorId);
        }

        if (activeTokens.length > 0) {
          console.log('Active tokens found:', activeTokens);
          return {
            hasActiveToken: true,
            tokens: activeTokens,
          };
        }
      }

      return {
        hasActiveToken: false,
        tokens: [],
      };
    } catch (error) {
      console.error('Error checking patient queue tokens:', error);
      return {
        hasActiveToken: false,
        tokens: [],
      };
    }
  };

  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);

    // Check if patient has active appointments
    await checkPatientActiveAppointments(patient);

    setStep(2);
  };

  const checkDoctorCapacity = async (doctorId) => {
    try {
      setIsCheckingCapacity(true);
      setCapacityWarning(null);

      const response = await queueService.checkDoctorCapacity(doctorId);

      if (response.success && response.data) {
        setDoctorCapacity(response.data);

        if (!response.data.canAccept) {
          setCapacityWarning({
            type: 'error',
            message: response.data.reason,
            details: response.data,
          });
        } else if (response.data.availableSlots <= 2) {
          setCapacityWarning({
            type: 'warning',
            message: `Only ${response.data.availableSlots} slot(s) remaining for this doctor`,
            details: response.data,
          });
        }
      } else {
        setDoctorCapacity(null);
        setCapacityWarning({
          type: 'error',
          message: response.message || 'Unable to determine doctor capacity.',
          details: response.data || null,
        });
      }
    } catch (error) {
      console.error('Error checking doctor capacity:', error);
      setCapacityWarning({
        type: 'error',
        message: error.message || 'Failed to check doctor capacity. Please try again.',
        details: null,
      });
    } finally {
      setIsCheckingCapacity(false);
    }
  };

  const handleDoctorSelect = async (doctor) => {
    setSelectedDoctor(doctor);

    // Check doctor's capacity
    await checkDoctorCapacity(doctor.id);
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedDoctor) {
      return;
    }

    // Check capacity before proceeding
    if (doctorCapacity && !doctorCapacity.canAccept) {
      alert(
        `Cannot create walk-in appointment:\n\n${doctorCapacity.reason}\n\nPlease choose a different doctor or schedule an appointment for later.`
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // First check if patient already has active tokens for this doctor
      const tokenCheck = await checkPatientActiveTokens(selectedPatient, selectedDoctor.id);

      if (tokenCheck.hasActiveToken) {
        const token = tokenCheck.tokens[0]; // Use the first active token
        const tokenDetails =
          `\n\nExisting Token Details:\n` +
          `• Token Number: ${token.token_number}\n` +
          `• Status: ${token.status}\n` +
          `• Issued Time: ${new Date(token.issued_time).toLocaleTimeString()}\n` +
          `• Estimated Wait: ${token.estimated_wait_time || 'N/A'} minutes`;

        alert(
          `This patient already has an active queue token for this doctor today.${tokenDetails}\n\nPlease:\n1. Check the current queue status, or\n2. Complete/cancel the existing token first, or\n3. Choose a different doctor`
        );
        return;
      }

      const walkInData = {
        patient: selectedPatient,
        doctor: selectedDoctor,
        appointment_time: new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        }),
        visit_type: 'Walk-in',
        status: 'ready', // Walk-ins go straight to ready status
        notes: 'Walk-in appointment',
      };

      await onSubmit(walkInData);
      onClose();
    } catch (error) {
      console.error('Error creating walk-in appointment:', error);

      // Check if the error is about an existing token
      if (error.message && error.message.includes('already has an active token')) {
        // Extract token details from the error message if available
        let tokenDetails = '';
        try {
          const tokenMatch = error.message.match(/Token: ({.*})/);
          if (tokenMatch) {
            const tokenData = JSON.parse(tokenMatch[1]);
            tokenDetails =
              `\n\nExisting Token Details:\n` +
              `• Token Number: ${tokenData.token_number}\n` +
              `• Status: ${tokenData.status}\n` +
              `• Issued Time: ${new Date(tokenData.issued_time).toLocaleTimeString()}\n` +
              `• Estimated Wait: ${tokenData.estimated_wait_time} minutes`;
          }
        } catch (parseError) {
          // Ignore parsing errors
        }

        alert(
          `This patient already has an active queue token for this doctor today.${tokenDetails}\n\nPlease:\n1. Check the current queue status, or\n2. Complete/cancel the existing token first, or\n3. Choose a different doctor`
        );
      } else {
        alert(error.message || 'Failed to create walk-in appointment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedDoctor(null);
      setPatientHasActiveAppointment(false);
      setActiveAppointmentDetails(null);
      setBypassCheck(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setSelectedPatient(null);
    setSelectedDoctor(null);
    setPatientSearch('');
    setPatients([]);
    setPatientHasActiveAppointment(false);
    setActiveAppointmentDetails(null);
    setIsCheckingAppointments(false);
    setBypassCheck(false);
  };

  const handleModalClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Walk-in Appointment
            </DialogTitle>
            <DialogDescription>
              Create a walk-in appointment by selecting a patient and available doctor
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-xs text-white">
                1
              </span>
              Select Patient
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-xs text-white">
                2
              </span>
              Select Doctor
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <p className="mb-2 text-sm font-medium">Search Patient</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                    <Input
                      id="patient-search"
                      type="text"
                      placeholder="Search by name or phone number..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="h-11 pl-10"
                    />
                  </div>
                </div>
                {isLoadingPatients && (
                  <div className="py-4 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Searching patients...</p>
                  </div>
                )}
                {patients.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Select a patient:</p>
                    <div className="max-h-64 space-y-3 overflow-y-auto pr-2">
                      {patients.map((patient) => (
                        <motion.div
                          key={patient.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.01 }}
                          className="hover:bg-muted/50 cursor-pointer rounded-lg border p-3 transition-colors"
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {patient.first_name} {patient.last_name}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{patient.phone}</span>
                                  </div>
                                  {patient.date_of_birth && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>
                                        DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}{' '}
                {patientSearch && patientSearch.length < 2 && (
                  <div className="py-4 text-center text-muted-foreground">
                    <p className="text-sm">Please enter at least 2 characters to search</p>
                  </div>
                )}
                {patientSearch &&
                  patients.length === 0 &&
                  !isLoadingPatients &&
                  patientSearch.length >= 2 && (
                    <div className="py-8 text-center text-muted-foreground">
                      <User className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>No patients found matching &quot;{patientSearch}&quot;</p>
                      <p className="text-sm">Try searching with a different name or phone number</p>
                    </div>
                  )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-muted/30 flex items-center justify-between rounded-lg p-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Selected Patient:</p>
                    <p className="text-lg font-semibold">
                      {selectedPatient?.first_name} {selectedPatient?.last_name}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleBack}>
                    Change Patient
                  </Button>
                </div>

                {/* Show loading state while checking appointments */}
                {isCheckingAppointments && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>Checking for existing appointments...</AlertDescription>
                  </Alert>
                )}

                {/* Show warning if patient has active appointment */}
                {patientHasActiveAppointment && activeAppointmentDetails && !bypassCheck && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>
                          <strong>Warning:</strong> This patient already has an active appointment
                          today.
                        </div>
                        <div className="text-sm">
                          Status:{' '}
                          <Badge variant="secondary" className="text-xs">
                            {activeAppointmentDetails.status?.replace('-', ' ') || 'Active'}
                          </Badge>
                          {activeAppointmentDetails.doctor_name && (
                            <span className="ml-2">
                              with {activeAppointmentDetails.doctor_name}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBypassCheck(true)}
                          className="mt-2"
                        >
                          Proceed Anyway (Override)
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {bypassCheck && patientHasActiveAppointment && (
                  <Alert variant="default">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Override Active:</strong> Proceeding despite existing appointment. The
                      patient will have multiple appointments today.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Show capacity checking loading */}
                {isCheckingCapacity && selectedDoctor && (
                  <Alert>
                    <Clock className="h-4 w-4 animate-spin" />
                    <AlertDescription>Checking doctor&apos;s capacity...</AlertDescription>
                  </Alert>
                )}

                {/* Show capacity warning/error */}
                {capacityWarning && selectedDoctor && (
                  <Alert variant={capacityWarning.type === 'error' ? 'destructive' : 'default'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>
                          <strong>
                            {capacityWarning.type === 'error'
                              ? 'Cannot Accept Walk-In:'
                              : 'Capacity Warning:'}
                          </strong>
                        </div>
                        <div>{capacityWarning.message}</div>
                        {capacityWarning.details && (
                          <div className="mt-2 space-y-1 text-sm">
                            <div>
                              • Current Queue: {capacityWarning.details.currentQueue} patient(s)
                            </div>
                            <div>• Available Slots: {capacityWarning.details.availableSlots}</div>
                            {capacityWarning.details.remainingTime && (
                              <div>
                                • Remaining Time: {capacityWarning.details.remainingTime} minutes
                              </div>
                            )}
                            {capacityWarning.details.workingHours && (
                              <div>• Working Hours: {capacityWarning.details.workingHours}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <p className="text-sm font-medium">Available Doctors Today:</p>

                  {isLoadingDoctors ? (
                    <div className="py-4 text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading doctors...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {doctors.map((doctor) => {
                        const StatusIcon = getStatusIcon(doctor.status);
                        const isSelected = selectedDoctor?.id === doctor.id;

                        return (
                          <motion.div
                            key={doctor.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`cursor-pointer rounded-lg border p-4 transition-all ${
                              isSelected
                                ? 'bg-primary/5 border-primary shadow-md'
                                : 'hover:border-border hover:shadow-sm'
                            }`}
                            onClick={() => handleDoctorSelect(doctor)}
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                  <Stethoscope className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold">{doctor.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {doctor.specialty}
                                  </p>
                                </div>
                              </div>
                              {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge
                                  className={`${doctor.statusColor || getStatusColor(doctor.status)} flex items-center gap-1`}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {doctor.statusText ||
                                    doctor.status.charAt(0).toUpperCase() +
                                      doctor.status.slice(1).replace('-', ' ')}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {doctor.waitingPatients} waiting
                                </span>
                              </div>

                              {doctor.description && (
                                <p className="text-xs text-muted-foreground">
                                  {doctor.description}
                                </p>
                              )}

                              {doctor.currentlyWith && (
                                <p className="text-xs text-muted-foreground">
                                  Currently with: {doctor.currentlyWith.patient?.first_name}{' '}
                                  {doctor.currentlyWith.patient?.last_name}
                                </p>
                              )}

                              {doctor.nextAvailable && doctor.slotsRemaining === 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Next available: {doctor.nextAvailable}
                                </p>
                              )}

                              {doctor.slotsRemaining > 0 && doctor.status === 'available' && (
                                <p className="text-xs font-medium text-green-600">
                                  ✓ Available now
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mx-6 flex justify-between border-t pb-6 pt-4">
          <Button variant="outline" onClick={step === 1 ? handleModalClose : handleBack}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step === 2 && (
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedDoctor ||
                isSubmitting ||
                isCheckingCapacity ||
                (doctorCapacity && !doctorCapacity.canAccept) ||
                (patientHasActiveAppointment && !bypassCheck)
              }
              className="flex items-center gap-2"
              variant={
                (patientHasActiveAppointment && !bypassCheck) ||
                (doctorCapacity && !doctorCapacity.canAccept)
                  ? 'secondary'
                  : 'default'
              }
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {isSubmitting
                ? 'Creating...'
                : patientHasActiveAppointment && !bypassCheck
                  ? 'Patient Already Queued'
                  : bypassCheck && patientHasActiveAppointment
                    ? 'Add to Queue (Override)'
                    : 'Add to Queue'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalkInModal;
