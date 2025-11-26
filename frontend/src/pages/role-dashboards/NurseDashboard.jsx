import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedback } from '@/contexts/FeedbackContext';
import { ROLES } from '@/constants/roles';
import { POLLING_INTERVALS } from '@/constants/polling';
import logger from '@/utils/logger';
import browserNotifications from '@/utils/browserNotifications';

/**
 * Helper function to get vitals from token (now included in queue response)
 * OPTIMIZATION: Vitals are now included in the queue status response from backend
 * This eliminates the need for individual API calls per patient
 */
const getTokenVitals = (token) => {
  // Vitals are now included in token.patient.vitals from backend
  if (token.patient?.vitals) {
    logger.debug(`✅ [NURSE] Token #${token.token_number} has vitals from queue response`);
    return token.patient.vitals;
  }
  logger.debug(
    `❌ [NURSE] Token #${token.token_number} has no vitals - showing "Add Vitals & Notes"`
  );
  return null;
};

const NurseDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all'); // New status filter state
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false); // Track if any modal is open
  const [isSaving, setIsSaving] = useState(false); // Track if any save operation is in progress

  // Use feedback system for notifications
  const { showSuccess, showError, showWarning } = useFeedback();
  const [queueStats, setQueueStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    totalPatients: 0,
    waitingPatients: 0,
  });

  // Track previous token IDs to detect new patients joining queue
  const previousTokenIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  const queryClient = useQueryClient();

  // React Query: Poll doctors queue with auth/role guard and pause only when modal is open or saving
  // OPTIMIZATION: Added staleTime to prevent unnecessary refetches when data hasn't changed
  // OPTIMIZATION: Using shared query key ['queue', 'allDoctors'] to enable React Query deduplication
  // OPTIMIZATION: Only pause polling when modals are open or data is being saved (not on general activity)
  const shouldPausePolling = isModalOpen || isSaving;
  const doctorsQuery = useQuery({
    queryKey: ['queue', 'allDoctors'],
    queryFn: () => queueService.getAllDoctorsQueueStatus(),
    enabled: !!user && user.role === ROLES.NURSE && !shouldPausePolling,
    refetchInterval: shouldPausePolling ? false : POLLING_INTERVALS.NURSE_QUEUE, // 30 seconds
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 20000, // Consider data fresh for 20 seconds - reduces unnecessary DB calls
  });

  useEffect(() => {
    if (doctorsQuery.isLoading) {
      setLoading(true);
      return;
    }
    if (doctorsQuery.error) {
      logger.error('Failed to load doctors and queues:', doctorsQuery.error);
      setDoctors([]);
      setQueueStats({ totalDoctors: 0, activeDoctors: 0, totalPatients: 0, waitingPatients: 0 });
      setLoading(false);
      return;
    }
    const list = doctorsQuery.data?.data || [];
    setDoctors(list);

    // Defensive filtering: Check status structure carefully
    // Status can be: { status: 'available'|'unavailable'|'consulting'|'busy'|'full', canAcceptPatients: boolean }
    const availableDoctors = list.filter((d) => {
      // Check if status exists and is not 'unavailable'
      if (!d.status) {
        return false;
      }
      // Handle both old format (status.status) and new format (status.status)
      const statusValue = d.status?.status || d.status;
      return statusValue !== 'unavailable';
    });

    const totalDoctors = availableDoctors.length;
    const activeDoctors = availableDoctors.filter((d) => {
      // Check if doctor has any tokens (active queue)
      const tokens = d.queueStatus?.tokens || [];
      return tokens.length > 0;
    }).length;

    const totalPatients = availableDoctors.reduce((sum, d) => {
      const tokens = d.queueStatus?.tokens || [];
      return sum + tokens.length;
    }, 0);

    const waitingPatients = availableDoctors.reduce((sum, d) => {
      const tokens = d.queueStatus?.tokens || [];
      const waiting = tokens.filter((t) => t && t.status === 'waiting').length;
      return sum + waiting;
    }, 0);

    logger.debug('[NURSE] Stats calculated:', {
      totalDoctors,
      activeDoctors,
      totalPatients,
      waitingPatients,
      doctorsListLength: list.length,
    });

    setQueueStats({ totalDoctors, activeDoctors, totalPatients, waitingPatients });
    setLastRefresh(new Date());
    setLoading(false);
  }, [doctorsQuery.isLoading, doctorsQuery.error, doctorsQuery.data]);

  // Detect new patients joining the queue and show browser notifications
  useEffect(() => {
    if (!doctorsQuery.data?.data) {
      return;
    }

    const list = doctorsQuery.data.data;

    // Collect all current token IDs with their patient info
    const currentTokens = new Map();
    list.forEach((doctor) => {
      const tokens = doctor.queueStatus?.tokens || [];
      tokens.forEach((token) => {
        if (token.id && token.status === 'waiting') {
          currentTokens.set(token.id, {
            patientName: token.patient
              ? `${token.patient.first_name || ''} ${token.patient.last_name || ''}`.trim()
              : 'Unknown Patient',
            patientId: token.patient?.patient_number || 'N/A',
            doctorName: `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim(),
            tokenNumber: token.token_number,
          });
        }
      });
    });

    // Skip notification on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      previousTokenIdsRef.current = new Set(currentTokens.keys());
      return;
    }

    // Find new tokens (patients who just joined the queue)
    const newPatients = [];
    currentTokens.forEach((info, tokenId) => {
      if (!previousTokenIdsRef.current.has(tokenId)) {
        newPatients.push(info);
      }
    });

    // Show notification for new patients
    if (newPatients.length > 0) {
      newPatients.forEach((patient) => {
        const title = t('nurse.dashboard.newPatientInQueue');
        const body = `${patient.patientName} (${patient.patientId}) - Token #${patient.tokenNumber}\nAssigned to: ${patient.doctorName}`;

        // Show browser notification
        browserNotifications.show(title, {
          body,
          tag: `new-patient-${patient.tokenNumber}`,
          requireInteraction: false,
        });

        // Also show in-app toast notification
        showSuccess(
          t('nurse.dashboard.newPatientJoined', {
            name: patient.patientName,
            token: patient.tokenNumber,
          })
        );

        logger.info(
          `[NURSE] New patient notification: ${patient.patientName} joined ${patient.doctorName}'s queue`
        );
      });
    }

    // Update previous token IDs for next comparison
    previousTokenIdsRef.current = new Set(currentTokens.keys());
  }, [doctorsQuery.data, showSuccess]);

  // Request notification permission on component mount
  useEffect(() => {
    browserNotifications.requestPermission().then((permission) => {
      if (permission === 'granted') {
        logger.info('[NURSE] Browser notifications enabled');
      } else if (permission === 'denied') {
        logger.warn('[NURSE] Browser notifications denied by user');
      }
    });
  }, []);

  // Track modal state from PatientCard components
  const handleModalStateChange = useCallback((hasOpenModal) => {
    setIsModalOpen(hasOpenModal);
  }, []);

  // Manual refresh function
  // OPTIMIZATION: Use invalidateQueries instead of direct refetch for better caching
  const handleManualRefresh = useCallback(async () => {
    if (selectedDoctor) {
      await handleViewPatients(selectedDoctor);
      setLastRefresh(new Date());
    } else {
      // Invalidate and refetch - respects staleTime and prevents duplicate calls
      await queryClient.invalidateQueries({ queryKey: ['queue', 'allDoctors'] });
      setLastRefresh(new Date());
    }
  }, [selectedDoctor, queryClient]);

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

        // Vitals are now included in the queue response from backend (batch fetched)
        // No need to make individual API calls - just use the vitals from the response
        const patientsWithVitals = allPatients.map((patient) => {
          const vitals = getTokenVitals(patient);
          const patientWithVitals = {
            ...patient,
            latestVitals: vitals,
          };

          logger.debug(`[NURSE] Patient #${patient.token_number} after vitals fetch:`, {
            token_number: patient.token_number,
            visit_id: patient.visit_id,
            status: patient.status,
            hasLatestVitals: !!patientWithVitals.latestVitals,
            latestVitals: patientWithVitals.latestVitals,
          });

          return patientWithVitals;
        });

        logger.debug('✅ [NURSE] Patient list updated with fresh vitals and appointments');
        logger.debug('[NURSE] Total patients with vitals data:', patientsWithVitals.length);
        setPatients(patientsWithVitals);
        setLastRefresh(new Date());
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
          .getDoctorQueueStatus(selectedDoctorRef.current.id, null, true) // skipCompletedVitals=true for polling
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

              // Vitals are now included in the queue response from backend (batch fetched)
              // No need to make individual API calls - just use the vitals from the response
              // OPTIMIZATION: Skip vitals for completed/missed patients (preserve existing vitals)
              const patientsWithVitals = allPatients.map((patient) => {
                // Skip vitals fetch for completed/missed patients - preserve existing vitals
                // They won't change, so no need to refetch
                if (patient.status === 'completed' || patient.status === 'missed') {
                  // Preserve existing vitals from state if available
                  const existingPatient = patients.find((p) => p.id === patient.id);
                  return {
                    ...patient,
                    latestVitals: existingPatient?.latestVitals || null,
                  };
                }
                // Vitals are already included in patient.patient.vitals from backend
                const vitals = getTokenVitals(patient);
                return { ...patient, latestVitals: vitals };
              });

              // Update state synchronously (no Promise.all needed)
              (() => {
                // Update state silently (no loading spinner)
                setPatients((prevPatients) => {
                  // Merge with existing to preserve optimistic updates
                  const merged = patientsWithVitals.map((newPatient) => {
                    const existing = prevPatients.find((p) => p.id === newPatient.id);
                    if (existing) {
                      // Always use latest vitals from server (newPatient.latestVitals)
                      // But preserve optimistic status updates if needed
                      const mergedPatient = {
                        ...newPatient,
                        latestVitals: newPatient.latestVitals || existing.latestVitals, // Prefer server vitals, fallback to existing
                      };

                      // Preserve optimistic status updates (if status was changed locally)
                      // But prioritize server status if it's more advanced (e.g., 'serving' or 'completed' from doctor)
                      if (existing.status !== newPatient.status) {
                        // If server says 'serving' (doctor started consultation), use that
                        if (newPatient.status === 'serving') {
                          return mergedPatient; // Server status is authoritative
                        }
                        // If server says 'completed' (doctor finished consultation), use that
                        if (newPatient.status === 'completed') {
                          return mergedPatient; // Server status is authoritative
                        }
                        // If existing is 'serving' but server says 'called', keep 'serving' (doctor just started)
                        if (existing.status === 'serving' && newPatient.status === 'called') {
                          return { ...mergedPatient, status: existing.status };
                        }
                        // If existing is 'completed' but server says something else, keep 'completed' (consultation finished)
                        if (existing.status === 'completed' && newPatient.status !== 'completed') {
                          return { ...mergedPatient, status: existing.status };
                        }
                        // For other optimistic updates (like 'called' from mark ready), preserve temporarily
                        if (existing.status === 'called' && newPatient.status === 'waiting') {
                          return { ...mergedPatient, status: existing.status };
                        }
                        // Default: use server status
                        return mergedPatient;
                      }
                      return mergedPatient;
                    }
                    return newPatient;
                  });
                  return merged;
                });
                logger.debug('[NURSE] Auto-refresh completed, updated patient list');
              })();
            }
          })
          .catch((error) => {
            logger.error('Auto-refresh failed:', error);
          });
      }
    }, POLLING_INTERVALS.QUEUE); // Refresh every 30 seconds (optimized for real-time monitoring)

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
      setIsSaving(true); // Pause polling while saving
      try {
        if (!patientId || typeof patientId !== 'string') {
          logger.error('[NURSE] Invalid patient ID provided when saving vitals:', patientId);
          showError(t('nurse.dashboard.unableToDeterminePatient'));
          return;
        }

        // Parse blood pressure
        let systolic = null;
        let diastolic = null;
        let bpError = null;

        if (vitalsForm.bp && vitalsForm.bp.trim()) {
          if (!vitalsForm.bp.includes('/')) {
            bpError = t('nurse.dashboard.invalidBpFormat');
          } else {
            const bpParts = vitalsForm.bp.trim().split('/');
            if (bpParts.length !== 2) {
              bpError = t('nurse.dashboard.invalidBpFormat');
            } else {
              const sys = parseInt(bpParts[0].trim());
              const dia = parseInt(bpParts[1].trim());
              if (isNaN(sys) || isNaN(dia)) {
                bpError = t('nurse.dashboard.invalidBpValues');
              } else if (sys < 60 || sys > 250) {
                bpError = t('nurse.dashboard.systolicRange');
              } else if (dia < 30 || dia > 150) {
                bpError = t('nurse.dashboard.diastolicRange');
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
            tempError = t('nurse.dashboard.invalidTemperature');
          } else {
            if (tempValue >= 30 && tempValue <= 45) {
              temperature = tempValue;
              temperatureUnit = 'C';
            } else if (tempValue >= 86 && tempValue <= 113) {
              temperature = tempValue;
              temperatureUnit = 'F';
            } else {
              tempError = t('nurse.dashboard.temperatureRange');
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

        showSuccess(t('nurse.dashboard.vitalsSaved'));

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

                // Vitals are now included in the queue response from backend (batch fetched)
                // No need to make individual API calls - just use the vitals from the response
                // OPTIMIZATION: Preserve vitals for completed/missed patients
                const patientsWithVitals = allPatients.map((patient) => {
                  // Preserve existing vitals for completed/missed patients
                  if (patient.status === 'completed' || patient.status === 'missed') {
                    const existingPatient = patients.find((p) => p.id === patient.id);
                    return {
                      ...patient,
                      latestVitals: existingPatient?.latestVitals || null,
                    };
                  }
                  // Vitals are already included in patient.patient.vitals from backend
                  const vitals = getTokenVitals(patient);
                  return { ...patient, latestVitals: vitals };
                });

                // Update state synchronously (no Promise.all needed)
                (() => {
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
                })();
              }
            })
            .catch((error) => {
              logger.error('Failed to refresh after save vitals:', error);
            });
        }
      } catch (error) {
        logger.error('Failed to save vitals:', error);
        if (error.response?.data?.code === 'NO_ACTIVE_VISIT') {
          showWarning(t('nurse.dashboard.noActiveVisit'));
        } else {
          showError(`Failed to save vitals: ${error.response?.data?.message || error.message}`);
        }
      } finally {
        setIsSaving(false); // Resume polling after save completes
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

        showSuccess(t('nurse.dashboard.patientMarkedReady'));

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

                // Vitals are now included in the queue response from backend (batch fetched)
                // No need to make individual API calls - just use the vitals from the response
                // OPTIMIZATION: Preserve vitals for completed/missed patients
                const patientsWithVitals = allPatients.map((patient) => {
                  // Preserve existing vitals for completed/missed patients
                  if (patient.status === 'completed' || patient.status === 'missed') {
                    const existingPatient = patients.find((p) => p.id === patient.id);
                    return {
                      ...patient,
                      latestVitals: existingPatient?.latestVitals || null,
                    };
                  }
                  // Vitals are already included in patient.patient.vitals from backend
                  const vitals = getTokenVitals(patient);
                  return { ...patient, latestVitals: vitals };
                });

                // Update state synchronously (no Promise.all needed)
                (() => {
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
                })();
              }
            })
            .catch((error) => {
              logger.error('Failed to refresh after mark ready:', error);
            });
        }
      } catch (error) {
        logger.error('Failed to mark patient ready:', error);
        showError(t('nurse.dashboard.failedMarkReady'));
        // Revert optimistic update on error
        setPatients((prevPatients) =>
          prevPatients.map((p) => (p.id === token?.id ? { ...p, status: 'waiting' } : p))
        );
      }
    },
    [patients, selectedDoctor, showError, showSuccess, t]
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

        showSuccess(t('nurse.dashboard.patientUnmarkedReady'));

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

                // Vitals are now included in the queue response from backend (batch fetched)
                // No need to make individual API calls - just use the vitals from the response
                // OPTIMIZATION: Preserve vitals for completed/missed patients
                const patientsWithVitals = allPatients.map((patient) => {
                  // Preserve existing vitals for completed/missed patients
                  if (patient.status === 'completed' || patient.status === 'missed') {
                    const existingPatient = patients.find((p) => p.id === patient.id);
                    return {
                      ...patient,
                      latestVitals: existingPatient?.latestVitals || null,
                    };
                  }
                  // Vitals are already included in patient.patient.vitals from backend
                  const vitals = getTokenVitals(patient);
                  return { ...patient, latestVitals: vitals };
                });

                // Update state synchronously (no Promise.all needed)
                () => {
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
                };
              }
            })
            .catch((error) => {
              logger.error('Failed to refresh after unmark ready:', error);
            });
        }
      } catch (error) {
        logger.error('Failed to unmark patient ready:', error);
        showError(t('nurse.dashboard.failedUnmarkReady'));
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

        showSuccess(t('nurse.dashboard.patientDelayed'));
      } catch (error) {
        logger.error('Failed to delay patient:', error);
        showError(t('nurse.dashboard.failedDelay'));
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

          showSuccess(t('nurse.dashboard.delayRemoved', { token: result.newTokenNumber }));
        }
      } catch (error) {
        logger.error('Failed to remove delay:', error);
        showError(t('nurse.dashboard.failedRemoveDelay'));
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
    // Defensive check: handle both old and new status formats
    const statusValue = doctor.status?.status || doctor.status;
    const isAvailable = statusValue !== 'unavailable';

    return matchesSearch && isAvailable;
  });

  // Filter patients based on search term and status
  const filteredPatients = patients.filter((token) => {
    const patient = token.patient;
    const searchLower = patientSearchTerm.toLowerCase();
    const matchesSearch =
      patient?.first_name?.toLowerCase().includes(searchLower) ||
      patient?.last_name?.toLowerCase().includes(searchLower) ||
      patient?.patient_number?.toLowerCase().includes(searchLower) ||
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
          ? t('nurse.dashboard.doctorPatientsTitle', {
              doctorName: `${selectedDoctor.first_name} ${selectedDoctor.last_name}`,
            })
          : t('nurse.dashboard.title')
      }
      subtitle={
        selectedDoctor ? t('nurse.dashboard.doctorSubtitle') : t('nurse.dashboard.subtitle')
      }
      fullWidth
    >
      <div className="space-y-6 p-6">
        {loading ? (
          <LoadingSpinner label={t('nurse.dashboard.loading')} />
        ) : (
          <>
            {!selectedDoctor ? (
              // Doctors View
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t('nurse.dashboard.totalDoctors')}
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{queueStats.totalDoctors}</div>
                      <p className="text-xs text-muted-foreground">
                        {queueStats.activeDoctors} {t('nurse.dashboard.activeToday')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t('nurse.dashboard.activeDoctors')}
                      </CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{queueStats.activeDoctors}</div>
                      <p className="text-xs text-muted-foreground">
                        {t('nurse.dashboard.currentlyAvailable')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t('nurse.dashboard.totalPatients')}
                      </CardTitle>
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{queueStats.totalPatients}</div>
                      <p className="text-xs text-muted-foreground">
                        {t('nurse.dashboard.inAllQueues')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t('nurse.dashboard.waitingPatients')}
                      </CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{queueStats.waitingPatients}</div>
                      <p className="text-xs text-muted-foreground">
                        {t('nurse.dashboard.needAttention')}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Search and Actions */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="relative max-w-md flex-1">
                    <SearchBar
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('nurse.dashboard.searchDoctorsPlaceholder')}
                      ariaLabel={t('nurse.dashboard.searchDoctorsPlaceholder')}
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
                      <span>{t('nurse.dashboard.refresh')}</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="flex h-12 items-center gap-2 px-6"
                      onClick={() => navigate('/nurse/emr')}
                    >
                      <FileText size={18} />
                      <span>{t('nurse.dashboard.patientRecords')}</span>
                    </Button>

                    <div className="text-xs text-muted-foreground">
                      {t('nurse.dashboard.lastUpdated')} {lastRefresh.toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Doctor Cards Grid */}
                {filteredDoctors.length === 0 ? (
                  <EmptyState
                    title={t('nurse.dashboard.noDoctorsFound')}
                    description={
                      searchTerm
                        ? t('nurse.dashboard.tryAdjustingSearch')
                        : t('nurse.dashboard.noDoctorsAvailable')
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
                        buttonText={t('nurse.dashboard.viewPatients')}
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
                      {t('nurse.dashboard.backToDoctors')}
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
                      <span>{t('nurse.dashboard.refreshPatients')}</span>
                    </Button>

                    <div className="text-xs text-muted-foreground">
                      {t('nurse.dashboard.updated')} {lastRefresh.toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Patient Stats */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t('nurse.dashboard.totalPatients')}
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{patients.length}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t('nurse.dashboard.waiting')}
                      </CardTitle>
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
                      <CardTitle className="text-sm font-medium">
                        {t('nurse.dashboard.inConsultation')}
                      </CardTitle>
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
                      <CardTitle className="text-sm font-medium">
                        {t('nurse.dashboard.completed')}
                      </CardTitle>
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
                      placeholder={t('nurse.dashboard.searchPatientsPlaceholder')}
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
                        {t('nurse.dashboard.all')} ({patients.length})
                      </button>
                      <button
                        onClick={() => setSelectedStatus('waiting')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          selectedStatus === 'waiting'
                            ? 'border border-border bg-card text-card-foreground shadow-sm'
                            : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        {t('nurse.dashboard.waiting')} (
                        {patients.filter((token) => token.status === 'waiting').length})
                      </button>
                      <button
                        onClick={() => setSelectedStatus('ready')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          selectedStatus === 'ready'
                            ? 'border border-border bg-card text-card-foreground shadow-sm'
                            : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        {t('nurse.dashboard.waitingForDoctor')} (
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
                        {t('nurse.dashboard.inConsultation')} (
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
                        {t('nurse.dashboard.completed')} (
                        {patients.filter((token) => token.status === 'completed').length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Patient Cards */}
                {filteredPatients.length === 0 ? (
                  <EmptyState
                    title={t('nurse.dashboard.noPatientsFound')}
                    description={
                      patientSearchTerm
                        ? t('nurse.dashboard.tryAdjustingSearch')
                        : t('nurse.dashboard.noPatientsInQueue')
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
                            ? (() => {
                                const bp =
                                  token.latestVitals.blood_pressure_systolic &&
                                  token.latestVitals.blood_pressure_diastolic
                                    ? `${token.latestVitals.blood_pressure_systolic}/${token.latestVitals.blood_pressure_diastolic}`
                                    : null;
                                const temp = token.latestVitals.temperature
                                  ? token.latestVitals.temperature.toString()
                                  : null;
                                const weight = token.latestVitals.weight
                                  ? token.latestVitals.weight.toString()
                                  : null;
                                const heartRate = token.latestVitals.heart_rate
                                  ? token.latestVitals.heart_rate.toString()
                                  : null;

                                // Always return vitals object (even if all null) so PatientCard can access latestVitals
                                // PatientCard will check latestVitals directly for display
                                return { bp, temp, weight, heartRate };
                              })()
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
                        onModalStateChange={handleModalStateChange}
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
