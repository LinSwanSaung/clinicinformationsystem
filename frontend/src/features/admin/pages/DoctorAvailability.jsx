import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageLayout from '@/components/layout/PageLayout';
import { ArrowLeft, Calendar, Clock, Plus, Stethoscope, Mail, Phone } from 'lucide-react';
import { userService } from '@/features/admin';
import { doctorAvailabilityService } from '@/features/appointments';
import logger from '@/utils/logger';
import {
  validateTimeFormat,
  convert12HrTo24Hr,
  compareTimes12Hr,
  formatTimeRange,
} from '@/utils/timeUtils';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorAvailability = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [availability, setAvailability] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [expandedDayByDoctor, setExpandedDayByDoctor] = useState({});

  const loadDoctorsAndAvailability = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Check authentication status
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');

      if (!token || !user) {
        setError('Authentication required. Please log in again.');
        return;
      }

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
          availabilityData.data.forEach((avail) => {
            if (!availabilityByDoctor[avail.doctor_id]) {
              availabilityByDoctor[avail.doctor_id] = [];
            }
            availabilityByDoctor[avail.doctor_id].push(avail);
          });
        }
        setAvailability(availabilityByDoctor);
      } catch (availError) {
        logger.error('Error loading availability (using fallback):', availError);

        // Instead of failing, set empty availability and continue
        logger.debug('Using empty availability due to backend issues');
        setAvailability({});
      }
    } catch (error) {
      logger.error('Error loading doctors:', error);
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
            onClick={() => navigate('/admin/dashboard')}
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 rounded bg-gray-200"></div>
                    <div className="h-3 w-5/6 rounded bg-gray-200"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Doctors Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => {
                const doctorAvailability = availability[doctor.id] || [];
                const availabilityByDay = DAYS_OF_WEEK.reduce((acc, day) => {
                  acc[day] = [];
                  return acc;
                }, {});

                doctorAvailability.forEach((slot) => {
                  const day = slot.day_of_week;
                  if (!availabilityByDay[day]) {
                    availabilityByDay[day] = [];
                  }
                  availabilityByDay[day].push(slot);
                });

                Object.keys(availabilityByDay).forEach((day) => {
                  availabilityByDay[day] = availabilityByDay[day].sort((a, b) =>
                    (a.start_time || '').localeCompare(b.start_time || '')
                  );
                });

                const activeDayNames = DAYS_OF_WEEK.filter(
                  (day) => (availabilityByDay[day] || []).length > 0
                );
                const activeDayCount = activeDayNames.length;
                const offDayCount = DAYS_OF_WEEK.length - activeDayCount;
                const storedExpanded = expandedDayByDoctor[doctor.id];
                const selectedDay =
                  storedExpanded === undefined ? activeDayNames[0] || null : storedExpanded;
                const selectedSlots = selectedDay ? availabilityByDay[selectedDay] || [] : [];
                const availabilitySummary =
                  activeDayCount === 0
                    ? 'No availability set'
                    : `${activeDayCount} active ${activeDayCount === 1 ? 'day' : 'days'}`;
                const sortedSelectedSlots = selectedSlots
                  .slice()
                  .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

                return (
                  <Card key={doctor.id} className="transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <Stethoscope className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              Dr. {doctor.first_name} {doctor.last_name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {doctor.specialty || 'General'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{doctor.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{doctor.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Availability: {availabilitySummary}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {activeDayCount} active {activeDayCount === 1 ? 'day' : 'days'}
                        </span>
                        <span className="text-border">|</span>
                        <span className="font-medium text-muted-foreground">
                          {offDayCount} {offDayCount === 1 ? 'day off' : 'days off'}
                        </span>
                      </div>

                      {activeDayCount === 0 ? (
                        <div className="bg-muted/50 mt-3 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                          No availability has been configured. Use the button below to add working
                          hours.
                        </div>
                      ) : (
                        <>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map((day) => {
                              const slots = availabilityByDay[day] || [];
                              const isActive = slots.length > 0;
                              const isSelected = selectedDay === day && isActive;
                              const baseClasses =
                                'px-3 py-1 rounded-full text-sm font-medium border transition-all';
                              const stateClasses = !isActive
                                ? 'bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50'
                                : isSelected
                                  ? 'bg-primary/20 text-primary border-primary/30 shadow-sm'
                                  : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20';

                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    if (!isActive) {
                                      return;
                                    }
                                    setExpandedDayByDoctor((prev) => ({
                                      ...prev,
                                      [doctor.id]: prev[doctor.id] === day ? null : day,
                                    }));
                                  }}
                                  disabled={!isActive}
                                  className={`${baseClasses} ${stateClasses}`}
                                >
                                  {day.slice(0, 3)}
                                </button>
                              );
                            })}
                          </div>

                          {selectedDay && sortedSelectedSlots.length > 0 && (
                            <div className="border-primary/20 bg-primary/10 mt-3 rounded-lg border p-3">
                              <div className="flex items-center justify-between text-sm font-medium text-primary">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{selectedDay}</span>
                                </div>
                                <span className="text-xs text-primary">
                                  {sortedSelectedSlots.length}{' '}
                                  {sortedSelectedSlots.length === 1 ? 'slot' : 'slots'}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {sortedSelectedSlots.map((slot, index) => (
                                  <span
                                    key={slot.id || `${slot.start_time}-${slot.end_time}-${index}`}
                                    className="border-primary/30 rounded-full border bg-card px-3 py-1 text-sm text-primary shadow-sm"
                                  >
                                    {formatTimeRange(slot.start_time, slot.end_time)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      <div className="border-t pt-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddSchedule(doctor)}
                            className="flex-1"
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Manage Availability
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* No Doctors State */}
            {doctors.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Stethoscope className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium text-card-foreground">
                    No doctors found
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    Add doctors in the Employee Management page first.
                  </p>
                  <Button onClick={() => navigate('/admin/employees')}>
                    <Plus className="mr-2 h-4 w-4" />
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
    end_period: 'AM',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const daysOfWeek = DAYS_OF_WEEK;

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
        end_time: endTime24,
      };

      logger.debug('Setting availability:', availabilityData);

      // Try to save to backend
      try {
        await doctorAvailabilityService.createAvailability(availabilityData);
        logger.debug('Γ£à Availability saved successfully');
      } catch (backendError) {
        logger.error('Backend error:', backendError);
        throw new Error('Failed to save availability. Please try again.');
      }

      // Reset form and close dialog
      setFormData({
        day_of_week: '',
        start_time: '',
        start_period: 'AM',
        end_time: '',
        end_period: 'AM',
      });

      onScheduleAdded();
    } catch (error) {
      logger.error('Error setting availability:', error);
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Set Availability for Dr. {doctor?.first_name} {doctor?.last_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Day of Week</label>
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
              <label className="mb-2 block text-sm font-medium text-gray-700">Start Time</label>
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
              <p className="mt-1 text-xs text-muted-foreground">Format: H:MM (e.g., 9:00, 10:30)</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">End Time</label>
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
              <p className="mt-1 text-xs text-muted-foreground">Format: H:MM (e.g., 9:00, 10:30)</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Setting...' : 'Set Availability'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorAvailability;
