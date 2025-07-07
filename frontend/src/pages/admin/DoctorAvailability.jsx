import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog } from '../../components/ui/dialog';
import PageLayout from '../../components/PageLayout';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Stethoscope,
  Mail,
  Phone,
  Edit,
  Trash2
} from 'lucide-react';
import userService from '../../services/userService';
import doctorAvailabilityService from '../../services/doctorAvailabilityService';
import { validateTimeFormat, convert12HrTo24Hr, compareTimes12Hr, formatTimeRange } from '../../utils/timeUtils';

const DoctorAvailability = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [availability, setAvailability] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const loadDoctorsAndAvailability = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get all doctors
      const doctorsData = await userService.getUsersByRole('doctor');
      const doctorsList = doctorsData?.data || [];
      setDoctors(doctorsList);
      
      // Load availability for all doctors
      try {
        const availabilityData = await doctorAvailabilityService.getAllDoctorAvailability();
        
        // Organize availability by doctor ID
        const availabilityByDoctor = {};
        if (availabilityData?.data) {
          availabilityData.data.forEach(avail => {
            if (!availabilityByDoctor[avail.doctor_id]) {
              availabilityByDoctor[avail.doctor_id] = [];
            }
            availabilityByDoctor[avail.doctor_id].push(avail);
          });
        }
        setAvailability(availabilityByDoctor);
      } catch (availError) {
        console.error('Error loading availability (backend might not be ready):', availError);
        // Don't set error state, just continue with empty availability
        setAvailability({});
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorsAndAvailability();
  }, []);

  const handleAddSchedule = (doctor) => {
    setSelectedDoctor(doctor);
    setShowScheduleDialog(true);
  };

  const getDoctorAvailabilitySummary = (doctorId) => {
    const doctorAvailability = availability[doctorId] || [];
    
    if (doctorAvailability.length === 0) {
      return "No availability set";
    }
    
    // Group by day and show time ranges
    const daySchedules = doctorAvailability.reduce((acc, avail) => {
      const day = avail.day_of_week;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(formatTimeRange(avail.start_time, avail.end_time));
      return acc;
    }, {});
    
    // Create summary string
    const days = Object.keys(daySchedules);
    if (days.length === 1) {
      return `${days[0]}: ${daySchedules[days[0]].join(', ')}`;
    } else if (days.length <= 3) {
      return days.map(day => `${day.slice(0, 3)}: ${daySchedules[day][0]}`).join(', ');
    } else {
      return `${days.length} days scheduled`;
    }
  };

  return (
    <PageLayout
      title="Doctor Availability"
      subtitle="Manage working hours and availability for all doctors"
      fullWidth
    >
      <div className="space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Doctors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <Card key={doctor.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Stethoscope className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Dr. {doctor.first_name} {doctor.last_name}
                          </CardTitle>
                          <p className="text-sm text-gray-600">{doctor.specialty || 'General'}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{doctor.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{doctor.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Availability: {getDoctorAvailabilitySummary(doctor.id)}</span>
                      </div>
                    </div>
                    
                    {/* Current Schedules */}
                    {availability[doctor.id] && availability[doctor.id].length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Schedule:</h4>
                        <div className="space-y-1">
                          {availability[doctor.id].map((avail, index) => (
                            <div key={index} className="flex justify-between items-center text-xs">
                              <span className="text-gray-600">{avail.day_of_week}</span>
                              <span className="text-gray-800 font-medium">
                                {formatTimeRange(avail.start_time, avail.end_time)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleAddSchedule(doctor)}
                          className="flex-1"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Manage Availability
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* No Doctors State */}
            {doctors.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
                  <p className="text-gray-600 mb-4">
                    Add doctors in the Employee Management page first.
                  </p>
                  <Button onClick={() => navigate('/admin/employees')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Employees
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Schedule Dialog */}
        <ScheduleDialog 
          isOpen={showScheduleDialog}
          onClose={() => {
            setShowScheduleDialog(false);
            setSelectedDoctor(null);
          }}
          doctor={selectedDoctor}
          onScheduleAdded={() => {
            // Refresh availability data
            loadDoctorsAndAvailability();
            setShowScheduleDialog(false);
            setSelectedDoctor(null);
          }}
        />
      </div>
    </PageLayout>
  );
};

// Schedule Dialog Component
const ScheduleDialog = ({ isOpen, onClose, doctor, onScheduleAdded }) => {
  const [formData, setFormData] = useState({
    day_of_week: '',
    start_time: '',
    start_period: 'AM',
    end_time: '',
    end_period: 'AM'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      // Validate form
      if (!formData.day_of_week || !formData.start_time || !formData.end_time) {
        throw new Error('Please fill in all fields');
      }

      // Validate time format
      if (!validateTimeFormat(formData.start_time)) {
        throw new Error('Please enter start time in HH:MM format (e.g., 9:00, 10:30)');
      }

      if (!validateTimeFormat(formData.end_time)) {
        throw new Error('Please enter end time in HH:MM format (e.g., 9:00, 10:30)');
      }

      // Convert to 24-hour format for comparison and backend
      const startTime12 = `${formData.start_time} ${formData.start_period}`;
      const endTime12 = `${formData.end_time} ${formData.end_period}`;
      const startTime24 = convert12HrTo24Hr(startTime12);
      const endTime24 = convert12HrTo24Hr(endTime12);

      if (compareTimes12Hr(startTime12, endTime12) >= 0) {
        throw new Error('End time must be after start time');
      }

      // Prepare data for backend (times in 24-hour format)
      const availabilityData = {
        doctor_id: doctor.id,
        day_of_week: formData.day_of_week,
        start_time: startTime24,
        end_time: endTime24
      };

      console.log('Setting availability:', availabilityData);

      // Try to save to backend
      try {
        await doctorAvailabilityService.createAvailability(availabilityData);
        console.log('✅ Availability saved successfully');
      } catch (backendError) {
        console.error('Backend error:', backendError);
        throw new Error('Failed to save availability. Please try again.');
      }

      // Reset form and close dialog
      setFormData({
        day_of_week: '',
        start_time: '',
        start_period: 'AM',
        end_time: '',
        end_period: 'AM'
      });

      onScheduleAdded();
    } catch (error) {
      console.error('Error setting availability:', error);
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose}
      title={`Set Availability for Dr. ${doctor?.first_name} ${doctor?.last_name}`}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{formError}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Day of Week
          </label>
          <Select
            value={formData.day_of_week}
            onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {daysOfWeek.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="9:00"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="flex-1"
              />
              <Select
                value={formData.start_period}
                onValueChange={(value) => setFormData({ ...formData, start_period: value })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Format: H:MM (e.g., 9:00, 10:30)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="5:00"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="flex-1"
              />
              <Select
                value={formData.end_period}
                onValueChange={(value) => setFormData({ ...formData, end_period: value })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Format: H:MM (e.g., 9:00, 10:30)</p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Setting...' : 'Set Availability'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default DoctorAvailability;
