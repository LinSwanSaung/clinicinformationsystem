import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { QueueDoctorCard } from '@/features/queue';
import { PatientCard } from '@/features/patients';
import { SearchBar, LoadingSpinner, EmptyState } from '@/components/library';
import { vitalsService } from '@/features/medical';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Search,
  FileText,
  Users,
  Clock,
  Activity,
  Eye,
  UserCog,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { queueService } from '@/features/queue';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedback } from '@/contexts/FeedbackContext';
import { ROLES } from '@/constants/roles';
import { POLLING_INTERVALS } from '@/constants/polling';
import logger from '@/utils/logger';

/**
 * Helper function to fetch appropriate vitals for a token
 * Uses the token's visit_id to get vitals for that specific visit only
 */
const fetchTokenVitals = async (token) => {
  try {
    const patientId = token.patient?.id || token.patient_id;
    const visitId = token.visit_id || token.current_visit_id;

    logger.debug(
      `🔍 [NURSE] Fetching vitals - Token #${token.token_number}, PatientID: ${patientId}, VisitID: ${visitId}`
    );
    logger.debug(`🔍 [NURSE] Token object keys:`, Object.keys(token));
    logger.debug(
      `🔍 [NURSE] Has visit_id property?`,
      'visit_id' in token,
      'Value:',
      token.visit_id
    );

    if (!visitId) {
      logger.debug(
        `❌ [NURSE] Token #${token.token_number} has no visit_id - treating as fresh visit`
      );
      return null;
    }

    // Fetch vitals for this specific visit only
    try {
      const vitalsResponse = await vitalsService.getVisitVitals(visitId);
      logger.debug(`📊 [NURSE] Vitals API response for visit ${visitId}:`, vitalsResponse);

      // Check if we have actual vitals data (not empty array)
      if (vitalsResponse.success && vitalsResponse.data && vitalsResponse.data.length > 0) {
        logger.debug(`✅ [NURSE] Found vitals for visit ${visitId}:`, vitalsResponse.data[0]);
        return vitalsResponse.data[0]; // Return first vitals record
      }
      logger.debug(
        `❌ [NURSE] No vitals found for visit ${visitId} - showing "Add Vitals & Notes"`
      );
    } catch (error) {
      logger.error('[NURSE] Failed to fetch visit vitals:', error);
    }

    // No vitals for this visit - return null to show "Add Vitals & Notes"
    return null;
  } catch (error) {
    logger.error('[NURSE] Failed to fetch vitals for token:', token.id, error);
    return null;
  }
};

const NurseDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all'); // New status filter state
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isUserActive, setIsUserActive] = useState(false); // Track user activity

  // Use feedback system for notifications
  const { showSuccess, showError, showWarning } = useFeedback();
  const [queueStats, setQueueStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    totalPatients: 0,
    waitingPatients: 0,
  });

  // React Query: Poll doctors queue with auth/role guard and pause on activity
  const doctorsQuery = useQuery({
    queryKey: ['nurse', 'doctorsQueue'],
    queryFn: () => queueService.getAllDoctorsQueueStatus(),
    enabled: !!user && user.role === ROLES.NURSE && !isUserActive,
    refetchInterval: isUserActive ? false : POLLING_INTERVALS.NURSE_QUEUE, // 30 seconds (reduced from 15s to reduce DB load)
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (doctorsQuery.isLoading) {
      setLoading(true);
      return;
    }
    if (doctorsQuery.error) {
      logger.error('Failed to load doctors and queues:', doctorsQuery.error);
      setDoctors([]);
      setLoading(false);
      return;
    }
    const list = doctorsQuery.data?.data || [];
    setDoctors(list);
    const availableDoctors = list.filter((d) => d.status?.status !== 'unavailable');
    const totalDoctors = availableDoctors.length;
    const activeDoctors = availableDoctors.filter((d) => d.queueStatus?.tokens?.length > 0).length;
    const totalPatients = availableDoctors.reduce(
      (sum, d) => sum + (d.queueStatus?.tokens?.length || 0),
      0
    );
    const waitingPatients = availableDoctors.reduce(
      (sum, d) => sum + (d.queueStatus?.tokens?.filter((t) => t.status === 'waiting').length || 0),
      0
    );
    setQueueStats({ totalDoctors, activeDoctors, totalPatients, waitingPatients });
    setLastRefresh(new Date());
    setLoading(false);
  }, [doctorsQuery.isLoading, doctorsQuery.error, doctorsQuery.data]);

  // Track user activity to pause auto-refresh during interactions
  useEffect(() => {
    let activityTimer;

    const handleUserActivity = () => {
      setIsUserActive(true);
      clearTimeout(activityTimer);
      // Reset activity flag after 10 seconds of inactivity
      activityTimer = setTimeout(() => {
        setIsUserActive(false);
      }, 10000);
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      clearTimeout(activityTimer);
    };
  }, []);

  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    if (selectedDoctor) {
      await handleViewPatients(selectedDoctor);
    } else {
      await doctorsQuery.refetch();
    }
  }, [selectedDoctor, doctorsQuery]);

  // Handle viewing doctor's patients
  const handleViewPatients = useCallback(
    async (doctor) => {
      try {
        setLoading(true);
        setSelectedDoctor(doctor);

        // Fetch fresh queue data from the backend instead of using cached data
        logger.debug('🔄 [NURSE] Fetching fresh queue data for doctor:', doctor.id);
        const queueResponse = await queueService.getDoctorQueueStatus(doctor.id);

        if (!queueResponse.success) {
          logger.error('Failed to fetch queue status:', queueResponse);
          setPatients([]);
          return;
        }

        // Get both tokens (walk-ins) and appointments (scheduled) from the fresh queue data
        const queueTokens = queueResponse.data?.tokens || [];
        const queueAppointments = queueResponse.data?.appointments || [];
        logger.debug(
          `📋 [NURSE] Received ${queueTokens.length} tokens and ${queueAppointments.length} appointments from backend`
        );

        // Debug: Log token status breakdown
        const statusBreakdown = queueTokens.reduce((acc, token) => {
          acc[token.status] = (acc[token.status] || 0) + 1;
          return acc;
        }, {});
        logger.debug(`📊 [NURSE] Token status breakdown:`, statusBreakdown);

        // Filter out cancelled appointments - include ALL other statuses (waiting, called, serving, completed, missed)
        // This ensures we show all patients for the day, including completed consultations
        const activeTokens = queueTokens.filter((token) => token.status !== 'cancelled');
        logger.debug(
          `📋 [NURSE] Filtered to ${activeTokens.length} tokens (excluded ${queueTokens.length - activeTokens.length} cancelled). Statuses included: ${Object.keys(
            statusBreakdown
          )
            .filter((s) => s !== 'cancelled')
            .join(', ')}`
        );

        // Use only queue tokens (no appointment queue)
        // Show ALL tokens for the day - each token represents a visit, so patients with multiple visits will show multiple entries
        const allPatients = activeTokens.map((t) => ({ ...t, queueType: 'token' }));

        // Sort by token number (ascending) to show patients in order they were seen
        // This ensures all patients for the day are visible, including completed ones
        allPatients.sort((a, b) => {
          // First sort by status: serving > called > waiting > completed > missed
          const statusOrder = { serving: 0, called: 1, waiting: 2, completed: 3, missed: 4 };
          const statusDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
          if (statusDiff !== 0) {
            return statusDiff;
          }

          // Then by token number
          return (a.token_number || 0) - (b.token_number || 0);
        });

        logger.debug(
          `📋 [NURSE] Showing ${allPatients.length} tokens (all patients for the day, including completed)`
        );

        // Fetch vitals for each patient using the new per-visit logic
        // OPTIMIZATION: Skip vitals fetch for completed patients (they won't change)
        // This reduces API calls significantly
        const patientsWithVitals = await Promise.all(
          allPatients.map(async (patient) => {
            // Skip vitals fetch for completed/missed patients - they won't change
            if (patient.status === 'completed' || patient.status === 'missed') {
              return {
                ...patient,
                latestVitals: null, // Completed patients don't need fresh vitals
              };
            }

            try {
              const vitals = await fetchTokenVitals(patient);

              const patientWithVitals = {
                ...patient,
                latestVitals: vitals,
              };

              logger.debug(`[NURSE] Patient #${patient.token_number} after vitals fetch:`, {
                token_number: patient.token_number,
                visit_id: patient.visit_id,
                hasLatestVitals: !!patientWithVitals.latestVitals,
                latestVitals: patientWithVitals.latestVitals,
              });

              return patientWithVitals;
            } catch (error) {
              logger.debug(`No vitals found for patient ${patient.patient?.id}`);
              return {
                ...patient,
                latestVitals: null,
              };
            }
          })
        );

        logger.debug('✅ [NURSE] Patient list updated with fresh vitals and appointments');
        logger.debug('[NURSE] Total patients with vitals data:', patientsWithVitals.length);
        setPatients(patientsWithVitals);
      } catch (error) {
        logger.error('Failed to load patients:', error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    },
    [showError]
  );

  // Auto-refresh patient list when viewing a specific doctor
  const selectedDoctorRef = useRef(selectedDoctor);
  useEffect(() => {
    selectedDoctorRef.current = selectedDoctor;
  }, [selectedDoctor]);

  useEffect(() => {
    if (!selectedDoctor) {
      return;
    }

    // Set up auto-refresh interval for patient list
    const refreshInterval = setInterval(() => {
      if (selectedDoctorRef.current) {
        // Silent refresh - fetch fresh data without showing loading
        logger.debug(
          '[NURSE] Auto-refreshing patient list for doctor:',
          selectedDoctorRef.current.id
        );
        queueService
          .getDoctorQueueStatus(selectedDoctorRef.current.id)
          .then((queueResponse) => {
            if (queueResponse.success && queueResponse.data) {
              const queueTokens = queueResponse.data.tokens || [];
              const activeTokens = queueTokens.filter((token) => token.status !== 'cancelled');
              const allPatients = activeTokens.map((t) => ({ ...t, queueType: 'token' }));

              // Sort by status and token number (same as main load)
              allPatients.sort((a, b) => {
                const statusOrder = { serving: 0, called: 1, waiting: 2, completed: 3, missed: 4 };
                const statusDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
                if (statusDiff !== 0) {
                  return statusDiff;
                }
                return (a.token_number || 0) - (b.token_number || 0);
              });

              // Fetch vitals and update state silently
              // OPTIMIZATION: Skip vitals for completed/missed patients
              Promise.all(
                allPatients.map(async (patient) => {
                  // Skip vitals fetch for completed/missed patients
                  if (patient.status === 'completed' || patient.status === 'missed') {
                    return { ...patient, latestVitals: null };
                  }
                  try {
                    const vitals = await fetchTokenVitals(patient);
                    return { ...patient, latestVitals: vitals };
                  } catch {
                    return { ...patient, latestVitals: null };
                  }
                })
              ).then((patientsWithVitals) => {
                // Update state silently (no loading spinner)
                setPatients((prevPatients) => {
                  // Merge with existing to preserve optimistic updates
                  const merged = patientsWithVitals.map((newPatient) => {
                    const existing = prevPatients.find((p) => p.id === newPatient.id);
                    // Preserve optimistic status updates (if status was changed locally)
                    // But prioritize server status if it's more advanced (e.g., 'serving' or 'completed' from doctor)
                    if (existing && existing.status !== newPatient.status) {
                      // If server says 'serving' (doctor started consultation), use that
                      if (newPatient.status === 'serving') {
                        return newPatient; // Server status is authoritative
                      }
                      // If server says 'completed' (doctor finished consultation), use that
                      if (newPatient.status === 'completed') {
                        return newPatient; // Server status is authoritative
                      }
                      // If existing is 'serving' but server says 'called', keep 'serving' (doctor just started)
                      if (existing.status === 'serving' && newPatient.status === 'called') {
                        return { ...newPatient, status: existing.status };
                      }
                      // If existing is 'completed' but server says something else, keep 'completed' (consultation finished)
                      if (existing.status === 'completed' && newPatient.status !== 'completed') {
                        return { ...newPatient, status: existing.status };
                      }
                      // For other optimistic updates (like 'called' from mark ready), preserve temporarily
                      if (existing.status === 'called' && newPatient.status === 'waiting') {
                        return { ...newPatient, status: existing.status };
                      }
                      // Default: use server status
                      return newPatient;
                    }
                    return newPatient;
                  });
                  return merged;
                });
                logger.debug('[NURSE] Auto-refresh completed, updated patient list');
              });
            }
          })
          .catch((error) => {
            logger.error('Auto-refresh failed:', error);
          });
      }
    }, POLLING_INTERVALS.QUEUE); // Refresh every 30 seconds (reduced from 10s to reduce DB load)

    return () => clearInterval(refreshInterval);
  }, [selectedDoctor]);

  // Handle going back to doctors view
  const handleBackToDoctors = useCallback(() => {
    setSelectedDoctor(null);
    setPatients([]);
    setPatientSearchTerm('');
    setSelectedStatus('all'); // Reset status filter
  }, []);

  // Patient action handlers - memoized to prevent unnecessary re-renders of PatientCard
  const handleSaveVitals = useCallback(
    async (patientId, vitalsForm, notes, visitId = null) => {
      try {
        if (!patientId || typeof patientId !== 'string') {
          logger.error('[NURSE] Invalid patient ID provided when saving vitals:', patientId);
          showError('Unable to determine the patient record. Please refresh and try again.');
          return;
        }

        // Parse blood pressure
        let systolic = null;
        let diastolic = null;
        let bpError = null;

        if (vitalsForm.bp && vitalsForm.bp.trim()) {
          if (!vitalsForm.bp.includes('/')) {
            bpError = 'Blood pressure must be in format "120/80"';
          } else {
            const bpParts = vitalsForm.bp.trim().split('/');
            if (bpParts.length !== 2) {
              bpError = 'Blood pressure must be in format "120/80"';
            } else {
              const sys = parseInt(bpParts[0].trim());
              const dia = parseInt(bpParts[1].trim());
              if (isNaN(sys) || isNaN(dia)) {
                bpError = 'Blood pressure values must be valid numbers';
              } else if (sys < 60 || sys > 250) {
                bpError = 'Systolic pressure must be between 60 and 250 mmHg';
              } else if (dia < 30 || dia > 150) {
                bpError = 'Diastolic pressure must be between 30 and 150 mmHg';
              } else {
                systolic = sys;
                diastolic = dia;
              }
            }
          }
        }

        if (bpError) {
          showError(`Invalid blood pressure: ${bpError}`);
          return;
        }

        // Parse temperature
        let temperature = null;
        let temperatureUnit = null;
        let tempError = null;

        if (vitalsForm.temp && vitalsForm.temp.trim()) {
          const tempValue = parseFloat(vitalsForm.temp.trim());
          if (isNaN(tempValue)) {
            tempError = 'Temperature must be a valid number';
          } else {
            if (tempValue >= 30 && tempValue <= 45) {
              temperature = tempValue;
              temperatureUnit = 'C';
            } else if (tempValue >= 86 && tempValue <= 113) {
              temperature = tempValue;
              temperatureUnit = 'F';
            } else {
              tempError = 'Temperature must be between 30-45°C or 86-113°F';
            }
          }
        }

        if (tempError) {
          showError(`Invalid temperature: ${tempError}`);
          return;
        }

        const vitalsData = {
          patient_id: patientId,
          visit_id: visitId || null,
          temperature: temperature,
          temperature_unit: temperatureUnit,
          blood_pressure_systolic: systolic,
          blood_pressure_diastolic: diastolic,
          heart_rate: vitalsForm.heartRate ? parseInt(vitalsForm.heartRate) : null,
          weight: vitalsForm.weight ? parseFloat(vitalsForm.weight) : null,
          notes: notes || null,
          priority_level: vitalsForm.priorityLevel || 'normal',
        };

        logger.debug('💾 [NURSE] Saving vitals:', vitalsData);

        // Find the patient token to update
        const patientToken = patients.find(
          (p) => p.patient?.id === patientId || p.id === patientId
        );

        // Optimistically update vitals in UI immediately
        if (patientToken) {
          setPatients((prevPatients) =>
            prevPatients.map((p) => {
              if (p.id === patientToken.id) {
                // Create optimistic vitals object
                const optimisticVitals = {
                  blood_pressure_systolic: systolic,
                  blood_pressure_diastolic: diastolic,
                  temperature: temperature,
                  temperature_unit: temperatureUnit,
                  heart_rate: vitalsForm.heartRate ? parseInt(vitalsForm.heartRate) : null,
                  weight: vitalsForm.weight ? parseFloat(vitalsForm.weight) : null,
                  notes: notes || null,
                  priority_level: vitalsForm.priorityLevel || 'normal',
                  recorded_at: new Date().toISOString(),
                };
                return {
                  ...p,
                  latestVitals: optimisticVitals,
                };
              }
              return p;
            })
          );
        }

        showSuccess('Vitals saved successfully!');

        // Then save to server (in background)
        await vitalsService.saveVitals(patientId, vitalsData);

        // Silent refresh to sync with server (preserves optimistic update)
        if (selectedDoctor) {
          // Silent refresh without loading spinner
          queueService
            .getDoctorQueueStatus(selectedDoctor.id)
            .then((queueResponse) => {
              if (queueResponse.success && queueResponse.data) {
                const queueTokens = queueResponse.data.tokens || [];
                const activeTokens = queueTokens.filter((token) => token.status !== 'cancelled');
                const allPatients = activeTokens.map((t) => ({ ...t, queueType: 'token' }));

                // Sort by status and token number
                allPatients.sort((a, b) => {
                  const statusOrder = {
                    serving: 0,
                    called: 1,
                    waiting: 2,
                    completed: 3,
                    missed: 4,
                  };
                  const statusDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
                  if (statusDiff !== 0) {
                    return statusDiff;
                  }
                  return (a.token_number || 0) - (b.token_number || 0);
                });

                // Fetch vitals and update silently
                Promise.all(
                  allPatients.map(async (patient) => {
                    try {
                      const vitals = await fetchTokenVitals(patient);
                      return { ...patient, latestVitals: vitals };
                    } catch {
                      return { ...patient, latestVitals: null };
                    }
                  })
                ).then((patientsWithVitals) => {
                  // Merge with existing to preserve optimistic updates
                  setPatients((prevPatients) => {
                    return patientsWithVitals.map((newPatient) => {
                      const existing = prevPatients.find((p) => p.id === newPatient.id);
                      // If we just saved vitals optimistically, keep them if server hasn't updated yet
                      if (existing && existing.latestVitals && !newPatient.latestVitals) {
                        // Keep optimistic vitals if server hasn't returned them yet
                        return { ...newPatient, latestVitals: existing.latestVitals };
                      }
                      // Use server vitals if available (more up-to-date)
                      return newPatient;
                    });
                  });
                });
              }
            })
            .catch((error) => {
              logger.error('Failed to refresh after save vitals:', error);
            });
        }
      } catch (error) {
        logger.error('Failed to save vitals:', error);
        if (error.response?.data?.code === 'NO_ACTIVE_VISIT') {
          showWarning(
            'Security Check Failed: Cannot record vitals. Patient does not have an active visit.'
          );
        } else {
          showError(`Failed to save vitals: ${error.response?.data?.message || error.message}`);
        }
      }
    },
    [selectedDoctor, handleViewPatients, showError, showSuccess, showWarning]
  );

  const handleMarkReady = useCallback(
    async (patientId) => {
      const token = patients.find(
        (p) => (p.patient?.id === patientId || p.id === patientId) && p.status === 'waiting'
      );

      if (!token) {
        showError('Could not find active token for this patient.');
        return;
      }

      try {
        // Optimistic update - update UI immediately
        setPatients((prevPatients) =>
          prevPatients.map((p) => (p.id === token.id ? { ...p, status: 'called' } : p))
        );

        showSuccess('Patient marked as ready');

        // Then update on server (in background)
        await queueService.markPatientReady(token.id);

        // Silent refresh to sync with server (preserves optimistic update)
        if (selectedDoctor) {
          // Silent refresh without loading spinner
          queueService
            .getDoctorQueueStatus(selectedDoctor.id)
            .then((queueResponse) => {
              if (queueResponse.success && queueResponse.data) {
                const queueTokens = queueResponse.data.tokens || [];
                const activeTokens = queueTokens.filter((token) => token.status !== 'cancelled');
                const allPatients = activeTokens.map((t) => ({ ...t, queueType: 'token' }));

                // Sort by status and token number (same as main load)
                allPatients.sort((a, b) => {
                  const statusOrder = {
                    serving: 0,
                    called: 1,
                    waiting: 2,
                    completed: 3,
                    missed: 4,
                  };
                  const statusDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
                  if (statusDiff !== 0) {
                    return statusDiff;
                  }
                  return (a.token_number || 0) - (b.token_number || 0);
                });

                // Fetch vitals and update silently
                Promise.all(
                  allPatients.map(async (patient) => {
                    try {
                      const vitals = await fetchTokenVitals(patient);
                      return { ...patient, latestVitals: vitals };
                    } catch {
                      return { ...patient, latestVitals: null };
                    }
                  })
                ).then((patientsWithVitals) => {
                  // Merge with existing to preserve optimistic updates
                  setPatients((prevPatients) => {
                    return patientsWithVitals.map((newPatient) => {
                      const existing = prevPatients.find((p) => p.id === newPatient.id);
                      // Preserve optimistic status if it was just updated
                      // But prioritize server status if it's more advanced (e.g., 'serving' from doctor)
                      if (existing && existing.status !== newPatient.status) {
                        // If server says 'serving' (doctor started consultation), always use that
                        if (newPatient.status === 'serving') {
                          return newPatient; // Server status is authoritative
                        }
                        // If existing is 'serving' but server says 'called', keep 'serving' (doctor just started)
                        if (existing.status === 'serving' && newPatient.status === 'called') {
                          return { ...newPatient, status: existing.status };
                        }
                        // For mark ready optimistic update, preserve temporarily
                        if (existing.status === 'called' && newPatient.status === 'waiting') {
                          return { ...newPatient, status: existing.status };
                        }
                        // Default: use server status
                        return newPatient;
                      }
                      return newPatient;
                    });
                  });
                });
              }
            })
            .catch((error) => {
              logger.error('Failed to refresh after mark ready:', error);
            });
        }
      } catch (error) {
        logger.error('Failed to mark patient ready:', error);
        showError('Failed to mark patient ready. Please try again.');
        // Revert optimistic update on error
        setPatients((prevPatients) =>
          prevPatients.map((p) => (p.id === token?.id ? { ...p, status: 'waiting' } : p))
        );
      }
    },
    [patients, selectedDoctor, showError, showSuccess]
  );

  const handleUnmarkReady = useCallback(
    async (patientId) => {
      const token = patients.find(
        (p) =>
          (p.patient?.id === patientId || p.id === patientId) &&
          (p.status === 'ready' || p.status === 'called')
      );

      if (!token) {
        showError('Could not find patient token.');
        return;
      }

      try {
        // Optimistic update - update UI immediately
        setPatients((prevPatients) =>
          prevPatients.map((p) => (p.id === token.id ? { ...p, status: 'waiting' } : p))
        );

        showSuccess('Patient status reverted to waiting');

        // Then update on server (in background)
        await queueService.markPatientWaiting(token.id);

        // Silent refresh to sync with server (preserves optimistic update)
        if (selectedDoctor) {
          queueService
            .getDoctorQueueStatus(selectedDoctor.id)
            .then((queueResponse) => {
              if (queueResponse.success && queueResponse.data) {
                const queueTokens = queueResponse.data.tokens || [];
                const activeTokens = queueTokens.filter((token) => token.status !== 'cancelled');
                const allPatients = activeTokens.map((t) => ({ ...t, queueType: 'token' }));

                // Sort by status and token number
                allPatients.sort((a, b) => {
                  const statusOrder = {
                    serving: 0,
                    called: 1,
                    waiting: 2,
                    completed: 3,
                    missed: 4,
                  };
                  const statusDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
                  if (statusDiff !== 0) {
                    return statusDiff;
                  }
                  return (a.token_number || 0) - (b.token_number || 0);
                });

                // Fetch vitals and update silently
                Promise.all(
                  allPatients.map(async (patient) => {
                    try {
                      const vitals = await fetchTokenVitals(patient);
                      return { ...patient, latestVitals: vitals };
                    } catch {
                      return { ...patient, latestVitals: null };
                    }
                  })
                ).then((patientsWithVitals) => {
                  // Merge with existing to preserve optimistic updates
                  setPatients((prevPatients) => {
                    return patientsWithVitals.map((newPatient) => {
                      const existing = prevPatients.find((p) => p.id === newPatient.id);
                      // Preserve optimistic status if it was just updated
                      if (existing && existing.status !== newPatient.status) {
                        if (existing.status === 'waiting' && newPatient.status === 'called') {
                          return { ...newPatient, status: existing.status };
                        }
                      }
                      return newPatient;
                    });
                  });
                });
              }
            })
            .catch((error) => {
              logger.error('Failed to refresh after unmark ready:', error);
            });
        }
      } catch (error) {
        logger.error('Failed to unmark patient ready:', error);
        showError('Failed to unmark patient ready. Please try again.');
        // Revert optimistic update on error
        setPatients((prevPatients) =>
          prevPatients.map((p) => (p.id === token.id ? { ...p, status: 'called' } : p))
        );
      }
    },
    [patients, selectedDoctor, showError, showSuccess]
  );

  const handleDelayPatient = useCallback(
    async (tokenOrQueueId, reason) => {
      try {
        const patient = patients.find((p) => p.id === tokenOrQueueId);
        if (!patient) {
          showError('Patient not found in current list. Please refresh the page and try again.');
          return;
        }

        // Optimistic update - update UI immediately
        setPatients((prevPatients) =>
          prevPatients.map((p) =>
            p.id === patient.id ? { ...p, status: 'delayed', delayReason: reason } : p
          )
        );

        // Then update on server
        await queueService.delayToken(patient.id, reason);

        // Refresh to get latest data
        if (selectedDoctor) {
          handleViewPatients(selectedDoctor).catch((error) => {
            logger.error('Failed to refresh after delay:', error);
          });
        }

        showSuccess('Patient has been marked as delayed');
      } catch (error) {
        logger.error('Failed to delay patient:', error);
        showError('Failed to delay patient: ' + (error.message || 'Please try again.'));
        // Revert optimistic update on error
        if (selectedDoctor) {
          handleViewPatients(selectedDoctor);
        }
      }
    },
    [patients, selectedDoctor, handleViewPatients, showError, showSuccess]
  );

  const handleRemoveDelay = useCallback(
    async (tokenOrQueueId) => {
      try {
        const patient = patients.find((p) => p.id === tokenOrQueueId);
        if (patient) {
          // Optimistic update - remove delay status immediately
          setPatients((prevPatients) =>
            prevPatients.map((p) =>
              p.id === patient.id ? { ...p, status: 'waiting', delayReason: null } : p
            )
          );

          // Then update on server
          const result = await queueService.undelayToken(patient.id);

          // Refresh to get latest data (including new token number)
          if (selectedDoctor) {
            handleViewPatients(selectedDoctor).catch((error) => {
              logger.error('Failed to refresh after remove delay:', error);
            });
          }

          showSuccess(
            `Patient has been added back to the queue with token #${result.newTokenNumber}`
          );
        }
      } catch (error) {
        logger.error('Failed to remove delay:', error);
        showError('Failed to remove delay. Please try again.');
        // Revert optimistic update on error
        if (selectedDoctor) {
          handleViewPatients(selectedDoctor);
        }
      }
    },
    [patients, selectedDoctor, handleViewPatients, showError, showSuccess]
  );

  // Filter doctors based on search term and availability
  const filteredDoctors = doctors.filter((doctor) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      doctor.first_name?.toLowerCase().includes(searchLower) ||
      doctor.last_name?.toLowerCase().includes(searchLower) ||
      doctor.specialty?.toLowerCase().includes(searchLower);

    // Only show available doctors (exclude 'unavailable' status)
    const isAvailable = doctor.status?.status !== 'unavailable';

    return matchesSearch && isAvailable;
  });

  // Filter patients based on search term and status
  const filteredPatients = patients.filter((token) => {
    const patient = token.patient;
    const searchLower = patientSearchTerm.toLowerCase();
    const matchesSearch =
      patient?.first_name?.toLowerCase().includes(searchLower) ||
      patient?.last_name?.toLowerCase().includes(searchLower) ||
      patient?.phone?.toLowerCase().includes(searchLower) ||
      token.token_number?.toString().includes(searchLower);

    const matchesStatus =
      selectedStatus === 'all' ||
      token.status === selectedStatus ||
      (selectedStatus === 'ready' && token.status === 'called'); // Include 'called' status in ready filter

    return matchesSearch && matchesStatus;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  return (
    <PageLayout
      title={
        selectedDoctor
          ? `${selectedDoctor.first_name} ${selectedDoctor.last_name}'s Patients`
          : 'Patient Care Management'
      }
      subtitle={
        selectedDoctor
          ? 'Monitor and provide nursing care'
          : "Monitor doctors' queues and provide nursing care"
      }
      fullWidth
    >
      <div className="space-y-6 p-6">
        {loading ? (
          <LoadingSpinner label="Loading..." />
        ) : (
          <>
            {!selectedDoctor ? (
              // Doctors View
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{queueStats.totalDoctors}</div>
                      <p className="text-xs text-muted-foreground">
                        {queueStats.activeDoctors} active today
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Doctors</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{queueStats.activeDoctors}</div>
                      <p className="text-xs text-muted-foreground">Currently available</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{queueStats.totalPatients}</div>
                      <p className="text-xs text-muted-foreground">In all queues</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Waiting Patients</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{queueStats.waitingPatients}</div>
                      <p className="text-xs text-muted-foreground">Need attention</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Search and Actions */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="relative max-w-md flex-1">
                    <SearchBar
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search doctors by name or specialty..."
                      ariaLabel="Search doctors"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex h-12 items-center gap-2 px-4"
                      onClick={handleManualRefresh}
                      disabled={loading}
                    >
                      <Activity size={18} className={loading ? 'animate-spin' : ''} />
                      <span>Refresh</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="flex h-12 items-center gap-2 px-6"
                      onClick={() => navigate('/nurse/emr')}
                    >
                      <FileText size={18} />
                      <span>Patient Records</span>
                    </Button>

                    <div className="text-xs text-muted-foreground">
                      Last updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Doctor Cards Grid */}
                {filteredDoctors.length === 0 ? (
                  <EmptyState
                    title="No doctors found"
                    description={
                      searchTerm
                        ? 'Try adjusting your search terms'
                        : 'No doctors are currently available'
                    }
                    icon={Users}
                  />
                ) : (
                  <motion.div
                    className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredDoctors.map((doctor) => (
                      <QueueDoctorCard
                        key={doctor.id}
                        doctor={doctor}
                        onClick={handleViewPatients}
                        buttonText="View Patients"
                        buttonIcon={Eye}
                        showCurrentConsultation={true}
                        showNextInQueue={false}
                      />
                    ))}
                  </motion.div>
                )}
              </>
            ) : (
              // Patients View
              <>
                {/* Back Button and Doctor Info */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={handleBackToDoctors}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Doctors
                    </Button>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-medium text-white">
                        {selectedDoctor.first_name?.[0]}
                        {selectedDoctor.last_name?.[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManualRefresh}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <Activity size={16} className={loading ? 'animate-spin' : ''} />
                      <span>Refresh Patients</span>
                    </Button>

                    <div className="text-xs text-muted-foreground">
                      Updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Patient Stats */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{patients.length}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Waiting</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">
                        {patients.filter((token) => token.status === 'waiting').length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">In Consultation</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {patients.filter((token) => token.status === 'serving').length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {patients.filter((token) => token.status === 'completed').length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Patient Search and Status Filters */}
                <div className="mb-6 space-y-4">
                  {/* Search Bar */}
                  <div className="relative max-w-md">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 transform text-muted-foreground"
                      size={20}
                    />
                    <Input
                      type="search"
                      placeholder="Search patients..."
                      className="h-12 pl-10 text-base"
                      value={patientSearchTerm}
                      onChange={(e) => setPatientSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Status Filter Tabs - Make sure they're visible */}
                  <div className="w-full rounded-lg border border-border bg-card p-2 shadow-sm">
                    <div className="flex space-x-1 rounded-lg bg-muted p-1">
                      <button
                        onClick={() => setSelectedStatus('all')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          selectedStatus === 'all'
                            ? 'border border-border bg-card text-card-foreground shadow-sm'
                            : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        All ({patients.length})
                      </button>
                      <button
                        onClick={() => setSelectedStatus('waiting')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          selectedStatus === 'waiting'
                            ? 'border border-border bg-card text-card-foreground shadow-sm'
                            : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        Waiting ({patients.filter((token) => token.status === 'waiting').length})
                      </button>
                      <button
                        onClick={() => setSelectedStatus('ready')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          selectedStatus === 'ready'
                            ? 'border border-border bg-card text-card-foreground shadow-sm'
                            : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        Waiting for Doctor (
                        {
                          patients.filter(
                            (token) => token.status === 'ready' || token.status === 'called'
                          ).length
                        }
                        )
                      </button>
                      <button
                        onClick={() => setSelectedStatus('serving')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          selectedStatus === 'serving'
                            ? 'border border-border bg-card text-card-foreground shadow-sm'
                            : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        In Consultation (
                        {patients.filter((token) => token.status === 'serving').length})
                      </button>
                      <button
                        onClick={() => setSelectedStatus('completed')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          selectedStatus === 'completed'
                            ? 'border border-border bg-card text-card-foreground shadow-sm'
                            : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        Completed ({patients.filter((token) => token.status === 'completed').length}
                        )
                      </button>
                    </div>
                  </div>
                </div>

                {/* Patient Cards */}
                {filteredPatients.length === 0 ? (
                  <EmptyState
                    title="No patients found"
                    description={
                      patientSearchTerm
                        ? 'Try adjusting your search terms'
                        : "No patients in this doctor's queue"
                    }
                    icon={Users}
                  />
                ) : (
                  <motion.div
                    className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredPatients.map((token) => (
                      <PatientCard
                        key={`${token.id}-${token.token_number}`}
                        patient={{
                          id: token.id, // Use token/queue ID for operations
                          patientId: token.patient?.id, // Store actual patient ID separately
                          visit_id: token.visit_id, // Add visit_id for vitals linking
                          chief_complaint:
                            token.visit?.chief_complaint ||
                            token.appointment?.reason_for_visit ||
                            null,
                          name:
                            `${token.patient?.first_name || ''} ${token.patient?.last_name || ''}`.trim() ||
                            'Unknown Patient',
                          age:
                            token.patient?.age || token.patient?.date_of_birth
                              ? new Date().getFullYear() -
                                new Date(token.patient.date_of_birth).getFullYear()
                              : 'N/A',
                          gender: token.patient?.gender || 'N/A',
                          phone: token.patient?.phone || 'N/A',
                          tokenNumber: token.token_number,
                          status: token.status,
                          priority: token.priority || 3, // Include priority for visual highlighting
                          appointmentTime: (() => {
                            // For appointments: combine appointment_date + appointment_time
                            if (
                              token.appointment?.appointment_date &&
                              token.appointment?.appointment_time
                            ) {
                              const dateStr = token.appointment.appointment_date;
                              const timeStr = token.appointment.appointment_time;
                              const datetime = new Date(`${dateStr}T${timeStr}`);
                              return datetime.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              });
                            }
                            // For walk-ins: use token created_at
                            if (token.created_at) {
                              const datetime = new Date(token.created_at);
                              return datetime.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              });
                            }
                            return 'N/A';
                          })(),
                          vitals: token.latestVitals
                            ? {
                                bp:
                                  token.latestVitals.blood_pressure_systolic &&
                                  token.latestVitals.blood_pressure_diastolic
                                    ? `${token.latestVitals.blood_pressure_systolic}/${token.latestVitals.blood_pressure_diastolic}`
                                    : '',
                                temp: token.latestVitals.temperature
                                  ? token.latestVitals.temperature.toString()
                                  : '',
                                weight: token.latestVitals.weight
                                  ? token.latestVitals.weight.toString()
                                  : '',
                                heartRate: token.latestVitals.heart_rate
                                  ? token.latestVitals.heart_rate.toString()
                                  : '',
                              }
                            : {},
                          latestVitals: token.latestVitals, // Pass the raw vitals data for button logic
                          conditions: token.conditions || [],
                          urgency: token.urgency || 'Normal',
                          vitalsRecorded: !!token.latestVitals,
                          vitalsDate: token.latestVitals?.recorded_at
                            ? new Date(token.latestVitals.recorded_at).toLocaleString()
                            : null,
                        }}
                        userRole="nurse"
                        onSaveVitals={handleSaveVitals}
                        onMarkReady={handleMarkReady}
                        onUnmarkReady={handleUnmarkReady}
                        onDelayPatient={handleDelayPatient}
                        onRemoveDelay={handleRemoveDelay}
                        readOnly={false}
                      />
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default NurseDashboard;
