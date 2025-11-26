import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeedback } from '@/contexts/FeedbackContext';
import clinicSettingsService from '@/services/clinicSettingsService';
import { POLLING_INTERVALS } from '@/constants/polling';
import {
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppointmentCard, WalkInModal } from '@/features/appointments';
import {
  getStatusColor,
  getStatusIcon,
  getStatusDisplayName,
  getActionsForRole,
  shouldShowActions,
} from '@/utils/appointmentConfig';
import { userService } from '@/features/admin';
import { patientService } from '@/features/patients';
import { useAppointments, useUpdateAppointmentStatus } from '@/features/appointments';
import { queueService } from '@/features/queue';
import PageLayout from '@/components/layout/PageLayout';
import useDebounce from '@/hooks/useDebounce';
import logger from '@/utils/logger';

const ReceptionistDashboard = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useFeedback();
  const [isLoading, setIsLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('needs-action');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [processingAppointments, setProcessingAppointments] = useState(new Set()); // Track appointments being processed
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  // Track previous appointments to prevent unnecessary re-processing
  const prevAppointmentsRef = useRef(null);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    availableDoctorCount: 0,
    totalPatients: 0,
    arrived: 0,
    delayed: 0,
    noShow: 0,
    scheduled: 0,
    overdue: 0,
  });
  const [lateThreshold, setLateThreshold] = useState(15); // Default 15 minutes

  // Load clinic settings for late threshold
  useEffect(() => {
    const loadLateThreshold = async () => {
      try {
        const threshold = await clinicSettingsService.getLateThreshold();
        setLateThreshold(threshold);
      } catch (error) {
        logger.error('Error loading late threshold:', error);
        // Use default if error
      }
    };
    loadLateThreshold();
  }, []);

  // Helper function to check if appointment is overdue
  const isAppointmentOverdue = (appointment) => {
    // Only check overdue for appointments that haven't been processed yet
    if (appointment.status !== 'scheduled') {
      return false;
    }

    const now = new Date();
    const [hours, minutes] = appointment.appointment_time.split(':');
    const appointmentTime = new Date();
    appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Use clinic settings for late threshold
    const overdueThreshold = lateThreshold * 60 * 1000; // Convert minutes to milliseconds
    return now - appointmentTime > overdueThreshold;
  };

  // Load doctors and patients; appointments are provided by React Query hook
  // Auto-refresh appointments every 30 seconds to keep stats updated
  const {
    data: allAppointments,
    isLoading: _isAppointmentsLoading,
    refetch: refetchAppointments,
  } = useAppointments({ refetchInterval: POLLING_INTERVALS.QUEUE }); // 30 seconds
  const { mutateAsync: mutateAppointmentStatus } = useUpdateAppointmentStatus();

  // Load doctors and patients - refresh periodically for doctor availability
  const loadDoctorsAndPatients = async () => {
    try {
      const [doctorsResponse, patientsResponse] = await Promise.all([
        userService.getUsersByRole('doctor'),
        patientService.getAllPatients(),
      ]);

      setStats((prev) => ({
        ...prev,
        availableDoctorCount: doctorsResponse.success ? doctorsResponse.data.length : 0,
        totalPatients: patientsResponse.success ? patientsResponse.data.length : 0,
      }));
    } catch (error) {
      logger.error('Error loading doctors/patients data:', error);
    }
  };

  // Load doctors and patients on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        await loadDoctorsAndPatients();
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []); // Only run once on mount

  // Refresh doctor availability periodically (every 60 seconds)
  // Note: Patient status comes from appointments, so we don't need to refresh patient list
  useEffect(() => {
    const interval = setInterval(() => {
      loadDoctorsAndPatients(); // Refresh doctor availability
    }, POLLING_INTERVALS.DASHBOARD); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Process appointments when they change (no API calls, just data processing)
  useEffect(() => {
    if (!allAppointments) {
      return;
    }

    // Check if appointments actually changed by comparing IDs
    const rawAppointments = Array.isArray(allAppointments) ? allAppointments : [];
    const currentIds = JSON.stringify(rawAppointments.map((app) => app.id).sort());
    const prevIds = prevAppointmentsRef.current
      ? JSON.stringify(prevAppointmentsRef.current.map((app) => app.id).sort())
      : null;

    // Skip processing if appointments haven't actually changed
    if (prevIds === currentIds && prevAppointmentsRef.current) {
      // Check if any appointment status changed (quick check)
      const hasStatusChange = rawAppointments.some((app, idx) => {
        const prevApp = prevAppointmentsRef.current[idx];
        return !prevApp || prevApp.status !== app.status;
      });

      if (!hasStatusChange) {
        return; // No changes, skip processing
      }
    }

    // Update ref with current appointments
    prevAppointmentsRef.current = rawAppointments;

    // Compute 'today appointments' from hook data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAppts = rawAppointments
      .filter((app) => {
        const appDate = new Date(app.appointment_date);
        appDate.setHours(0, 0, 0, 0);
        return appDate.getTime() === today.getTime() && app.status !== 'cancelled';
      })
      .map((app) => ({
        ...app,
        patient_name: app.patient
          ? `${app.patient.first_name} ${app.patient.last_name}`
          : 'Unknown Patient',
        doctor_name: app.doctor
          ? `Dr. ${app.doctor.first_name} ${app.doctor.last_name}`
          : 'Unknown Doctor',
        patient_id: app.patient?.id || app.patient_id,
        doctor_id: app.doctor?.id || app.doctor_id,
      }));

    // Only log when appointments actually change (not on every render)
    if (prevIds !== currentIds) {
      logger.debug("[ReceptionistDashboard] Today's appointments updated:", todayAppts.length);
    }

    setTodayAppointments(todayAppts);
    setFilteredAppointments(todayAppts);

    // Calculate stats
    const statusCounts = todayAppts.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    // Count appointments that are overdue (more than 15 mins past time and still scheduled/pending)
    const overdueCount = todayAppts.filter((app) => isAppointmentOverdue(app)).length;

    setStats((prev) => ({
      ...prev,
      todayAppointments: todayAppts.length,
      arrived: (statusCounts.waiting || 0) + (statusCounts.ready_for_doctor || 0),
      delayed: statusCounts.late || 0,
      noShow: statusCounts.no_show || 0,
      scheduled: statusCounts.scheduled || 0,
      overdue: overdueCount,
    }));

    setLastRefresh(new Date());
  }, [allAppointments, lateThreshold]); // Only depend on appointments and lateThreshold

  // Manual refresh function - refreshes appointments AND doctor availability
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      // Refresh appointments (this also updates patient status since it comes from appointments)
      await refetchAppointments();
      // Refresh doctor availability
      await loadDoctorsAndPatients();
      setLastRefresh(new Date());
    } catch (error) {
      logger.error('Error refreshing dashboard data:', error);
      showError('Failed to refresh dashboard data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter appointments based on search and status
  useEffect(() => {
    let filtered = todayAppointments;

    // Apply search filter
    if (debouncedSearch) {
      filtered = filtered.filter(
        (appointment) =>
          (appointment.patient_name &&
            appointment.patient_name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          (appointment.doctor_name &&
            appointment.doctor_name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          (appointment.appointment_type &&
            appointment.appointment_type.toLowerCase().includes(debouncedSearch.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter === 'needs-action') {
      filtered = filtered.filter(
        (appointment) => appointment.status === 'scheduled' || isAppointmentOverdue(appointment)
      );
    } else if (statusFilter !== 'all') {
      // Map display statuses to actual backend statuses
      if (statusFilter === 'ready') {
        filtered = filtered.filter(
          (appointment) =>
            appointment.status === 'waiting' || appointment.status === 'ready_for_doctor'
        );
      } else if (statusFilter === 'late') {
        filtered = filtered.filter((appointment) => appointment.status === 'late');
      } else if (statusFilter === 'no-show') {
        filtered = filtered.filter((appointment) => appointment.status === 'no_show');
      } else {
        filtered = filtered.filter((appointment) => appointment.status === statusFilter);
      }
    }

    setFilteredAppointments(filtered);
  }, [debouncedSearch, statusFilter, todayAppointments]);

  // Handle marking appointment as ready and creating queue token
  const handleMarkReady = async (appointmentId) => {
    // Prevent double-clicking
    if (processingAppointments.has(appointmentId)) {
      logger.debug(
        '[ReceptionistDashboard] Already processing this appointment, ignoring duplicate call'
      );
      return;
    }

    try {
      // Mark as processing
      setProcessingAppointments((prev) => new Set(prev).add(appointmentId));

      const appointment = todayAppointments.find((app) => app.id === appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      logger.debug('[ReceptionistDashboard] Marking appointment as ready:', appointmentId);

      let priority;

      // If appointment is already marked as 'late', give them priority 1 (no skip queue)
      if (appointment.status === 'late') {
        priority = 1;
      } else {
        // For scheduled appointments, check if patient arrived within acceptable time
        const now = new Date();
        const [hours, minutes] = appointment.appointment_time.split(':');
        const appointmentTime = new Date();
        appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const timeDiff = now - appointmentTime; // Positive = late, Negative = early

        // Use clinic settings late threshold (default: 7 minutes)
        const lateThresholdMs = lateThreshold * 60 * 1000; // Convert minutes to milliseconds

        // Determine priority:
        // - Arrived on time or early (within late threshold) = priority 4 (priority queue)
        // - Over late threshold = priority 3 (normal queue - no priority)
        const isOnTime = timeDiff <= lateThresholdMs; // Allow early arrivals and on-time arrivals
        priority = isOnTime ? 4 : 3;
      }

      // Create queue token which will also update appointment status
      const tokenData = {
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        appointment_id: appointmentId,
        priority: priority, // Priority based on status and arrival time
      };

      const response = await queueService.issueToken(tokenData);

      if (response.success) {
        logger.debug('[ReceptionistDashboard] Token created successfully:', response.data);
        // Refetch appointments to get updated status (don't reload doctors/patients)
        await refetchAppointments();
      } else {
        throw new Error(response.message || 'Failed to create queue token');
      }
    } catch (error) {
      logger.error('[ReceptionistDashboard] Error marking appointment as ready:', error);
      showError(`Failed to mark as ready: ${error.message}`);
    } finally {
      // Remove from processing set
      setProcessingAppointments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  // Handle marking appointment as late (manual marking only, does NOT start visit)
  // Use this when patient calls to say they'll be late, or to track late arrivals
  // Patient can still be checked in later with "Mark Ready" button (will get lower priority)
  const handleMarkLate = async (appointmentId) => {
    // Prevent double-clicking
    if (processingAppointments.has(appointmentId)) {
      logger.debug(
        '[ReceptionistDashboard] Already processing this appointment, ignoring duplicate call'
      );
      return;
    }

    try {
      setProcessingAppointments((prev) => new Set(prev).add(appointmentId));
      logger.debug('[ReceptionistDashboard] Manually marking appointment as late:', appointmentId);

      const response = await mutateAppointmentStatus({ appointmentId, status: 'late' });

      if (response.success) {
        logger.debug('[ReceptionistDashboard] Appointment marked as late (no token created yet)');
        await refetchAppointments();
      } else {
        throw new Error(response.message || 'Failed to mark as late');
      }
    } catch (error) {
      logger.error('[ReceptionistDashboard] Error marking appointment as late:', error);
      showError(`Failed to mark as late: ${error.message}`);
    } finally {
      setProcessingAppointments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  // Handle marking appointment as no-show (cancels it)
  const handleMarkNoShow = async (appointmentId) => {
    // Prevent double-clicking
    if (processingAppointments.has(appointmentId)) {
      logger.debug(
        '[ReceptionistDashboard] Already processing this appointment, ignoring duplicate call'
      );
      return;
    }

    try {
      setProcessingAppointments((prev) => new Set(prev).add(appointmentId));
      logger.debug('[ReceptionistDashboard] Marking appointment as no-show:', appointmentId);

      const response = await mutateAppointmentStatus({ appointmentId, status: 'no_show' });

      if (response.success) {
        logger.debug('[ReceptionistDashboard] Appointment marked as no-show');
        await refetchAppointments();
      } else {
        throw new Error(response.message || 'Failed to mark as no-show');
      }
    } catch (error) {
      logger.error('[ReceptionistDashboard] Error marking appointment as no-show:', error);
      showError(`Failed to mark as no-show: ${error.message}`);
    } finally {
      setProcessingAppointments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  // Main action handler
  const updateAppointmentStatus = async (appointmentId, action) => {
    logger.debug('[ReceptionistDashboard] Action triggered:', { appointmentId, action });

    switch (action) {
      case 'mark-ready':
      case 'start-visit':
        await handleMarkReady(appointmentId);
        break;
      case 'mark-late':
        await handleMarkLate(appointmentId);
        break;
      case 'mark-no-show':
        await handleMarkNoShow(appointmentId);
        break;
      default:
        console.warn('[ReceptionistDashboard] Unknown action:', action);
    }
  };

  const handleWalkInSubmit = async (walkInData) => {
    // Prepare data for backend API - only the fields the backend expects
    const tokenData = {
      patient_id: walkInData.patient.id, // UUID string
      doctor_id: walkInData.doctor.id, // UUID string
      priority: 3, // number - normal priority for walk-ins
      reason_for_visit: walkInData.reason_for_visit || '', // Transfer reason to chief_complaint
    };

    try {
      // Call backend API to create queue token
      const response = await queueService.issueToken(tokenData);

      if (response.success) {
        const tokenResult = response.data || {};
        const issuedToken = tokenResult.token || null;
        const tokenMessage = tokenResult.message || response.message;

        // Create a new appointment entry for local state
        const newAppointment = {
          id: issuedToken?.id || `walkin-${Date.now()}`,
          patient_name: `${walkInData.patient.first_name} ${walkInData.patient.last_name}`,
          appointment_time: walkInData.appointment_time,
          doctor_name: `Dr. ${walkInData.doctor.first_name} ${walkInData.doctor.last_name}`,
          visit_type: walkInData.visit_type,
          status: walkInData.status,
          notes: walkInData.notes,
          isWalkIn: true,
          token_number: issuedToken?.token_number || tokenResult.token_number || null,
          queueMessage: tokenMessage,
        };

        // Add to the appointment list
        setTodayAppointments((prev) => [...prev, newAppointment]);

        // Update stats
        setStats((prev) => ({
          ...prev,
          todayAppointments: prev.todayAppointments + 1,
          arrived: prev.arrived + 1, // Walk-ins are marked as ready/arrived
        }));

        // Show success message
        const patientName = `${walkInData.patient.first_name} ${walkInData.patient.last_name}`;
        const tokenNum = issuedToken?.token_number || tokenResult.token_number;
        showSuccess(`Walk-in registered: ${patientName}${tokenNum ? ` (Token #${tokenNum})` : ''}`);
      } else {
        throw new Error(response.message || 'Failed to create walk-in appointment');
      }
    } catch (error) {
      logger.error('[ReceptionistDashboard] Error creating walk-in:', error);

      // Display the detailed error message from backend
      const errorMessage =
        error.message || 'Failed to create walk-in appointment. Please try again.';
      showError(errorMessage);
      throw error; // Re-throw to let WalkInModal handle it if needed
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-8 w-8 rounded-full border-b-2 border-primary"
        />
      </div>
    );
  }

  return (
    <PageLayout
      title={t('receptionist.dashboard.title')}
      subtitle={t('receptionist.dashboard.subtitle')}
      fullWidth
    >
      <div className="space-y-8 p-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
        >
          {[
            {
              title: t('receptionist.dashboard.totalToday'),
              value: stats.todayAppointments,
              icon: Calendar,
              color: 'text-blue-600',
              delay: 0,
            },
            {
              title: t('receptionist.dashboard.arrived'),
              value: stats.arrived,
              icon: CheckCircle,
              color: 'text-green-600',
              delay: 0.1,
            },
            {
              title: t('receptionist.dashboard.overdue'),
              value: stats.overdue,
              icon: AlertCircle,
              color: 'text-orange-600',
              delay: 0.2,
            },
            {
              title: t('receptionist.dashboard.noShow'),
              value: stats.noShow,
              icon: XCircle,
              color: 'text-red-600',
              delay: 0.3,
            },
          ].map((stat, _index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: stat.delay, duration: 0.4 }}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="bg-card transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="pb-2 text-center sm:pb-3">
                    <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                      {stat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center pt-1 sm:pt-0">
                    <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                      <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.color}`} />
                      <span className="text-lg font-bold sm:text-2xl">{stat.value}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-lg border bg-card p-6"
        >
          <div className="mb-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4 lg:w-auto">
              <div className="relative w-full sm:flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('receptionist.dashboard.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-2 pl-10 pr-4"
                />
              </div>

              <Button
                onClick={() => setIsWalkInModalOpen(true)}
                className="flex w-full items-center gap-2 bg-green-600 px-3 py-2 text-sm hover:bg-green-700 sm:w-auto"
              >
                <UserPlus className="h-4 w-4" />
                <span>{t('receptionist.dashboard.walkIn')}</span>
              </Button>
            </div>

            <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center lg:w-auto">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {t('receptionist.dashboard.refresh')}
                </Button>
                <div className="text-xs text-muted-foreground">
                  {t('receptionist.dashboard.lastUpdated')}: {lastRefresh.toLocaleTimeString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder={t('receptionist.dashboard.filterStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="needs-action">
                      {t('receptionist.dashboard.needsAction')}
                    </SelectItem>
                    <SelectItem value="all">{t('receptionist.dashboard.allStatus')}</SelectItem>
                    <SelectItem value="ready">
                      {t('receptionist.dashboard.readyCheckedIn')}
                    </SelectItem>
                    <SelectItem value="late">{t('receptionist.dashboard.late')}</SelectItem>
                    <SelectItem value="no-show">{t('receptionist.dashboard.noShow')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {statusFilter !== 'needs-action' && statusFilter !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter('needs-action')}
                  className="w-full text-xs sm:w-auto"
                >
                  ← {t('receptionist.dashboard.backToActions')}
                </Button>
              )}
            </div>
          </div>

          {/* Appointments Table */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredAppointments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-12 text-center text-muted-foreground"
                >
                  <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  {statusFilter === 'needs-action' ? (
                    <>
                      <p className="text-lg">
                        {t('receptionist.dashboard.noAppointmentsNeedAction')}
                      </p>
                      <p className="text-sm">
                        {t('receptionist.dashboard.allAppointmentsUpToDate')}
                      </p>
                    </>
                  ) : statusFilter === 'late' ? (
                    <>
                      <p className="text-lg">{t('receptionist.dashboard.noLateAppointments')}</p>
                      <p className="text-sm">{t('receptionist.dashboard.allOnTime')}</p>
                    </>
                  ) : statusFilter === 'no-show' ? (
                    <>
                      <p className="text-lg">{t('receptionist.dashboard.noNoShowAppointments')}</p>
                      <p className="text-sm">{t('receptionist.dashboard.excellentAttendance')}</p>
                    </>
                  ) : statusFilter === 'ready' ? (
                    <>
                      <p className="text-lg">{t('receptionist.dashboard.noReadyAppointments')}</p>
                      <p className="text-sm">{t('receptionist.dashboard.noPatientsCheckedIn')}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg">{t('receptionist.dashboard.noAppointmentsFound')}</p>
                      <p className="text-sm">{t('receptionist.dashboard.tryAdjustingSearch')}</p>
                    </>
                  )}
                </motion.div>
              ) : (
                filteredAppointments.map((appointment, index) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    index={index}
                    onStatusUpdate={updateAppointmentStatus}
                    actions={getActionsForRole('receptionist', appointment)}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    getStatusDisplayName={getStatusDisplayName}
                    isAppointmentOverdue={isAppointmentOverdue}
                    showActions={shouldShowActions('receptionist', appointment)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Walk-in Modal */}
      <WalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onSubmit={handleWalkInSubmit}
      />
    </PageLayout>
  );
};

export default ReceptionistDashboard;
