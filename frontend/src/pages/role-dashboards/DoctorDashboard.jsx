import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '@/contexts/FeedbackContext';
import PageLayout from '@/components/layout/PageLayout';
import { Card } from '../../components/ui/card';
import { SearchBar, LoadingSpinner } from '@/components/library';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent } from '../../components/ui/tabs';
import { UserCheck, UserCog, CheckCircle, RefreshCw, PlayCircle, XCircle } from 'lucide-react';
import { PatientCard, PatientStats } from '@/features/patients';
import { patientService } from '@/features/patients';
import { queueService } from '@/features/queue';
import { visitService } from '@/features/visits';
import { POLLING_INTERVALS } from '@/constants/polling';
import logger from '@/utils/logger';

/**
 * Helper function to get vitals from token (now included in queue response)
 * OPTIMIZATION: Vitals are now included in the queue status response from backend
 * This eliminates the need for individual API calls per patient
 */
const getTokenVitals = (token) => {
  // Vitals are now included in token.patient.vitals from backend
  if (token.patient?.vitals) {
    logger.debug(`✅ Token #${token.token_number} has vitals from queue response`);
    return token.patient.vitals;
  }
  logger.debug(`❌ Token #${token.token_number} has no vitals - showing "Add Vitals & Notes"`);
  return null;
};

/**
 * Helper function to transform token data to patient data format
 */
const transformTokenToPatientData = (token) => {
  // Construct blood pressure string only if we have valid values
  let bloodPressure = null;
  if (
    token.patient?.vitals?.blood_pressure_systolic &&
    token.patient?.vitals?.blood_pressure_diastolic
  ) {
    bloodPressure = `${token.patient.vitals.blood_pressure_systolic}/${token.patient.vitals.blood_pressure_diastolic}`;
  }

  // Calculate age from date_of_birth
  let age = 'N/A';
  if (token.patient?.date_of_birth) {
    age = new Date().getFullYear() - new Date(token.patient.date_of_birth).getFullYear();
  } else if (token.patient?.age) {
    age = token.patient.age;
  }

  return {
    id: token.patient?.id || token.id,
    name:
      `${token.patient?.first_name || ''} ${token.patient?.last_name || ''}`.trim() ||
      'Unknown Patient',
    age: age,
    gender: token.patient?.gender || 'N/A',
    phone: token.patient?.phone || 'N/A',
    tokenNumber: token.token_number,
    status: token.status,
    priority: token.priority || 3, // Include priority for visual highlighting
    visit_id: token.visit_id, // Include visit_id from token
    chief_complaint:
      token.chief_complaint ||
      token.visit?.chief_complaint ||
      token.appointment?.reason_for_visit ||
      null, // Get from token, visit, or appointment
    // Structure vitals data as expected by PatientCard
    vitals: {
      heartRate: token.patient?.vitals?.heart_rate || null,
      bp: bloodPressure,
      temp: token.patient?.vitals?.temperature || null,
      weight: token.patient?.vitals?.weight || null,
      oxygenSaturation: token.patient?.vitals?.oxygen_saturation || null,
    },
    appointmentTime: (() => {
      // For appointments: combine appointment_date + appointment_time
      if (token.appointment?.appointment_date && token.appointment?.appointment_time) {
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
  };
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('ready'); // ready, consulting, completed
  const [timeFilter, setTimeFilter] = useState('all');
  const [patients, setPatients] = useState([]);
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true); // Auto-refresh enabled by default
  const refreshIntervalRef = useRef(null);

  // Get current doctor ID from authenticated user
  const currentDoctorId = user?.id;

  // Use feedback system for notifications
  const { showSuccess, showError, showInfo } = useFeedback();

  // Helper function to show notifications (for backward compatibility)
  const showNotification = (type, message) => {
    if (type === 'success') {
      showSuccess(message);
    } else if (type === 'error') {
      showError(message);
    } else if (type === 'info') {
      showInfo(message);
    }
  };

  // Load patients and queue data on component mount
  useEffect(() => {
    loadDoctorData();

    // Session recovery: Check for active consultation on page refresh
    const checkActiveConsultation = async () => {
      try {
        const savedConsultation = sessionStorage.getItem('activeConsultation');
        if (savedConsultation) {
          const consultationData = JSON.parse(savedConsultation);
          const { tokenId, timestamp } = consultationData;

          // Check if consultation is still active (within last 2 hours)
          const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
          if (timestamp > twoHoursAgo) {
            // Verify consultation status from server
            try {
              const queueResponse = await queueService.getDoctorQueueStatus(currentDoctorId);
              if (queueResponse.success && queueResponse.data) {
                const tokens = queueResponse.data.tokens || [];
                const activeToken = tokens.find((t) => t.id === tokenId && t.status === 'serving');

                if (activeToken) {
                  // Consultation is still active, restore state
                  logger.info('Recovered active consultation from session:', tokenId);
                  // The queue data will be loaded by loadDoctorData, so we just need to switch tab
                  setSelectedTab('consulting');
                } else {
                  // Consultation completed or cancelled, clear session
                  sessionStorage.removeItem('activeConsultation');
                }
              }
            } catch (error) {
              logger.error('Error verifying active consultation:', error);
              // Keep session data, user can manually check
            }
          } else {
            // Too old, clear it
            sessionStorage.removeItem('activeConsultation');
          }
        }
      } catch (error) {
        logger.error('Error checking active consultation:', error);
        sessionStorage.removeItem('activeConsultation');
      }
    };

    if (currentDoctorId) {
      checkActiveConsultation();
    }
  }, [currentDoctorId]);

  // Create a stable refresh function for auto-refresh
  // Uses a ref to access the current selectedTab value without causing re-renders
  const selectedTabRef = useRef(selectedTab);

  // Update ref when selectedTab changes
  useEffect(() => {
    selectedTabRef.current = selectedTab;
  }, [selectedTab]);

  const silentRefreshQueue = useCallback(async () => {
    try {
      const queueResponse = await queueService.getDoctorQueueStatus(currentDoctorId);

      if (queueResponse.success && queueResponse.data) {
        const newTokens = queueResponse.data.tokens || [];
        const activeTokens = newTokens.filter((token) => token.status !== 'cancelled');

        // Check if there's an active consultation
        const hasActiveConsultation = activeTokens.some((token) => token.status === 'serving');

        // Vitals are now included in the queue response from backend (batch fetched)
        // No need to make individual API calls - just use the vitals from the response
        const tokensWithVitals = activeTokens.map((token) => {
          // Vitals are already included in token.patient.vitals from backend
          const vitals = getTokenVitals(token);
          if (vitals) {
            token.patient.vitals = vitals;
            token.patient.vitalsRecorded = true;
          } else {
            token.patient.vitals = null;
            token.patient.vitalsRecorded = false;
          }
          return token;
        });

        // Update state with merge logic to preserve any optimistic updates
        setQueueData((prevQueueData) => {
          // Create a map of existing tokens for quick lookup
          const existingMap = new Map(prevQueueData.map((token) => [token.id, token]));

          // Merge new data with existing, preserving optimistic status updates
          const merged = tokensWithVitals.map((newToken) => {
            const existing = existingMap.get(newToken.id);
            // If status was optimistically updated and differs, preserve it temporarily
            if (existing && existing.status !== newToken.status) {
              // Check if the optimistic update is still valid (e.g., 'serving' status)
              if (existing.status === 'serving' && newToken.status !== 'serving') {
                // Keep optimistic status if it's a consultation in progress
                return { ...newToken, status: existing.status };
              }
            }
            return newToken;
          });

          return merged;
        });

        // Auto-switch to consulting tab if there's an active consultation
        // but only if user is on ready tab (not on completed tab)
        if (hasActiveConsultation && selectedTabRef.current === 'ready') {
          setSelectedTab('consulting');
        }
      }
    } catch (error) {
      logger.error('Auto-refresh failed:', error);
    }
  }, [currentDoctorId]);

  // Auto-refresh queue data at regular intervals
  useEffect(() => {
    if (autoRefresh && currentDoctorId) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set up new interval for auto-refresh
      refreshIntervalRef.current = setInterval(() => {
        silentRefreshQueue(); // Silent refresh (no notification, no tab switching)
      }, POLLING_INTERVALS.QUEUE);

      // Cleanup on unmount or when autoRefresh changes
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    } else {
      // Clear interval if auto-refresh is disabled
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }
  }, [autoRefresh, currentDoctorId, silentRefreshQueue]);

  const loadDoctorData = async () => {
    try {
      setLoading(true);

      // Only proceed if we have a valid doctor ID
      if (!currentDoctorId) {
        setQueueData([]);
        setPatients([]);
        return;
      }

      // Load queue status for the doctor
      const queueResponse = await queueService.getDoctorQueueStatus(currentDoctorId);

      if (queueResponse.success) {
        const tokens = queueResponse.data.tokens || [];

        // Filter out cancelled appointments
        const activeTokens = tokens.filter((token) => token.status !== 'cancelled');
        logger.debug(
          `📋 [DOCTOR] Filtered to ${activeTokens.length} active tokens (excluded ${tokens.length - activeTokens.length} cancelled)`
        );

        // Vitals are now included in the queue response from backend (batch fetched)
        // No need to make individual API calls - just use the vitals from the response
        const tokensWithVitals = activeTokens.map((token) => {
          // Vitals are already included in token.patient.vitals from backend
          const vitals = getTokenVitals(token);
          if (vitals) {
            token.patient.vitals = vitals;
            token.patient.vitalsRecorded = true;
            logger.debug(
              `✅ [DOCTOR] ${token.patient.first_name} - vitalsRecorded: true, vitals:`,
              vitals
            );
          } else {
            // No vitals found - this should trigger "Add Vitals & Notes" button
            token.patient.vitals = null;
            token.patient.vitalsRecorded = false;
            logger.debug(
              `❌ [DOCTOR] ${token.patient.first_name} - vitalsRecorded: false, should show "Add Vitals & Notes"`
            );
          }
          return token;
        });

        setQueueData(tokensWithVitals);
      } else {
        setQueueData([]);
      }

      // OPTIMIZATION: Removed unused getDoctorPatients() call
      // Queue data from getDoctorQueueStatus is sufficient and includes all needed patient info
      // This reduces unnecessary API calls and database load
      setPatients([]); // Keep empty array for fallback compatibility
    } catch (error) {
      logger.error('Failed to load doctor data:', error);
      // Fallback to empty data
      setQueueData([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh queue data
  const refreshQueue = async (silent = false) => {
    try {
      setRefreshing(true);
      const queueResponse = await queueService.getDoctorQueueStatus(currentDoctorId);

      if (queueResponse.success && queueResponse.data) {
        const newTokens = queueResponse.data.tokens || [];

        // Filter out cancelled appointments
        const activeTokens = newTokens.filter((token) => token.status !== 'cancelled');
        logger.debug(
          `📋 [DOCTOR REFRESH] Filtered to ${activeTokens.length} active tokens (excluded ${newTokens.length - activeTokens.length} cancelled)`
        );

        // Check if there's an active consultation (status === 'serving')
        const hasActiveConsultation = activeTokens.some((token) => token.status === 'serving');

        // Vitals are now included in the queue response from backend (batch fetched)
        // No need to make individual API calls - just use the vitals from the response
        const tokensWithVitals = activeTokens.map((token) => {
          // Vitals are already included in token.patient.vitals from backend
          const vitals = getTokenVitals(token);
          if (vitals) {
            token.patient.vitals = vitals;
            token.patient.vitalsRecorded = true;
          } else {
            token.patient.vitals = null;
            token.patient.vitalsRecorded = false;
          }
          return token;
        });

        // Update state with merge logic to preserve optimistic updates
        setQueueData((prevQueueData) => {
          // Create a map of existing tokens for quick lookup
          const existingMap = new Map(prevQueueData.map((token) => [token.id, token]));

          // Merge new data with existing, preserving optimistic status updates
          const merged = tokensWithVitals.map((newToken) => {
            const existing = existingMap.get(newToken.id);
            // If status was optimistically updated and differs, preserve it temporarily
            // This handles cases where user just clicked start/complete but server hasn't confirmed yet
            if (existing && existing.status !== newToken.status) {
              // Preserve optimistic 'serving' or 'completed' status if it was just set
              if (
                (existing.status === 'serving' && newToken.status === 'called') ||
                (existing.status === 'completed' && newToken.status === 'serving')
              ) {
                return { ...newToken, status: existing.status };
              }
            }
            return newToken;
          });

          return merged;
        });

        // Automatically switch to consulting tab if there's an active consultation
        // and user is not already viewing completed tab
        if (hasActiveConsultation && selectedTab !== 'completed') {
          setSelectedTab('consulting');
        }

        if (!silent) {
          showNotification('success', t('doctor.dashboard.notifications.refreshSuccess'));
        }
      } else {
        if (!silent) {
          showNotification('error', t('doctor.dashboard.notifications.refreshFailed'));
        }
      }
    } catch (error) {
      if (!silent) {
        showNotification(
          'error',
          t('doctor.dashboard.notifications.refreshError', { message: error.message })
        );
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Filter and sort queue data based on search, tab and time
  const filteredQueueData = queueData
    .filter((token) => {
      // Search filter
      const patientName =
        `${token.patient?.first_name || ''} ${token.patient?.last_name || ''}`.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        patientName.includes(searchQuery.toLowerCase()) ||
        token.token_number?.toString().includes(searchQuery);

      // Tab filter based on token status
      const matchesTab =
        (selectedTab === 'ready' && ['ready', 'called', 'waiting'].includes(token.status)) ||
        (selectedTab === 'consulting' && token.status === 'serving') ||
        (selectedTab === 'completed' && ['completed', 'cancelled'].includes(token.status));

      // Time filter - based on when the token was issued/created
      let matchesTime = timeFilter === 'all';
      if (!matchesTime && token.created_at) {
        const hour = new Date(token.created_at).getHours();
        matchesTime =
          (timeFilter === 'morning' && hour < 12) || (timeFilter === 'afternoon' && hour >= 12);
      }

      return matchesSearch && matchesTab && matchesTime;
    })
    .sort((a, b) => {
      // Sort by priority first (higher priority = lower number, so descending)
      const priorityDiff = (b.priority || 3) - (a.priority || 3);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // If same priority, sort by token number (ascending)
      return a.token_number - b.token_number;
    });

  // Fallback to regular patients if no queue data
  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      patient.name?.toLowerCase().includes(searchLower) ||
      patient.patient_number?.toLowerCase().includes(searchLower);
    const matchesTab =
      (selectedTab === 'ready' && (patient.status === 'ready' || patient.status === 'delayed')) ||
      (selectedTab === 'consulting' && patient.status === 'seeing_doctor') ||
      (selectedTab === 'completed' && patient.status === 'completed');

    // Time frame filtering
    const matchesTime =
      timeFilter === 'all' ||
      (timeFilter === 'morning' && patient.appointmentTime?.includes('AM')) ||
      (timeFilter === 'afternoon' && patient.appointmentTime?.includes('PM'));

    return matchesSearch && matchesTab && matchesTime;
  });

  const handleStartConsultation = useCallback(
    async (patientId) => {
      try {
        setRefreshing(true);
        const response = await patientService.startConsultation(patientId);

        // Save active consultation to session storage for recovery
        if (response?.tokenId) {
          sessionStorage.setItem(
            'activeConsultation',
            JSON.stringify({
              tokenId: response.tokenId,
              patientId: patientId,
              timestamp: Date.now(),
            })
          );
        }

        // Refresh queue data to get latest status from server
        await refreshQueue(false);

        // Update local patients state as fallback
        setPatients(
          patients.map((p) => (p.id === patientId ? { ...p, status: 'seeing_doctor' } : p))
        );
      } catch (error) {
        logger.error('Failed to start consultation:', error);
        showNotification(
          'error',
          t('doctor.dashboard.notifications.consultationFailed', { message: error.message })
        );
      } finally {
        setRefreshing(false);
      }
    },
    [patients, refreshQueue, showNotification, t]
  );

  const handleCompleteVisit = useCallback(
    async (patientId) => {
      try {
        setRefreshing(true);

        // Find the patient to get their visit_id
        const patient = patients.find((p) => p.id === patientId);
        if (!patient) {
          throw new Error('Patient not found');
        }

        // Get visit_id from patient data (could be visit_id, current_visit_id, or active_visit_id)
        const visitId = patient.visit_id || patient.current_visit_id || patient.active_visit_id;

        if (!visitId) {
          // If no visit_id, this patient doesn't have an active visit
          // This shouldn't happen in normal flow, but handle gracefully
          showNotification('error', t('doctor.dashboard.notifications.noActiveVisit'));
          return;
        }

        // Validate visit status before completion
        try {
          const visitDetails = await visitService.getVisitDetails(visitId);
          if (!visitDetails) {
            throw new Error('Visit not found');
          }

          // Check if visit is already completed
          if (visitDetails.status === 'completed') {
            showNotification('warning', t('doctor.dashboard.notifications.visitAlreadyCompleted'));
            await refreshQueue(false);
            return;
          }

          // Check if visit is cancelled
          if (visitDetails.status === 'cancelled') {
            showNotification('error', t('doctor.dashboard.notifications.visitCancelled'));
            return;
          }

          // Check if visit has an invoice and its status
          // Note: Visits should be completed through invoice payment, not directly
          // This is a fallback for edge cases
          if (visitDetails.invoice_id) {
            try {
              const { invoiceService } = await import('@/features/billing');
              const invoice = await invoiceService.getInvoiceById(visitDetails.invoice_id);
              if (invoice && invoice.status === 'paid') {
                // Invoice is paid, visit should be completed through invoice flow
                showNotification('info', t('doctor.dashboard.notifications.visitInvoicePaid'));
                await refreshQueue(false);
                return;
              }
            } catch (invoiceError) {
              logger.warn('Could not check invoice status:', invoiceError);
              // Continue with visit completion if invoice check fails
            }
          }
        } catch (validationError) {
          logger.error('Error validating visit status:', validationError);
          showNotification(
            'error',
            t('doctor.dashboard.notifications.validateVisitFailed', {
              message: validationError.message,
            })
          );
          return;
        }

        // Complete the visit using visitService
        await visitService.completeVisit(visitId, {
          completed_by: currentDoctorId,
        });

        // Refresh queue data to get latest status from server
        await refreshQueue(false);

        // Update local patients state as fallback
        setPatients(patients.map((p) => (p.id === patientId ? { ...p, status: 'completed' } : p)));

        showNotification('success', t('doctor.dashboard.notifications.visitCompleted'));
      } catch (error) {
        logger.error('Failed to complete visit:', error);
        showNotification(
          'error',
          t('doctor.dashboard.notifications.visitCompleteFailed', { message: error.message })
        );
      } finally {
        setRefreshing(false);
      }
    },
    [patients, refreshQueue, showNotification, currentDoctorId, t]
  );

  // Complete token consultation (for queue-based patients)
  const handleCompleteTokenConsultation = useCallback(
    async (tokenId) => {
      try {
        setRefreshing(true);

        // Optimistically update local state IMMEDIATELY (before API call)
        setQueueData((prevQueueData) => {
          const updated = prevQueueData.map((token) =>
            token.id === tokenId ? { ...token, status: 'completed' } : token
          );
          return updated;
        });

        // Immediately switch to completed tab
        setSelectedTab('completed');
        showNotification('success', t('doctor.dashboard.notifications.consultationCompleted'));

        // Then make API call
        const response = await queueService.completeConsultation(tokenId);

        // Handle response - check for success property or assume success if response exists
        const isSuccess =
          response?.success !== false && response !== null && response !== undefined;

        if (isSuccess) {
          // Refresh queue data to get latest status from server (but preserve optimistic update)
          // Don't let refresh errors affect the success of the operation
          refreshQueue(true).catch((refreshError) => {
            logger.error(
              'Failed to refresh after complete consultation (non-critical):',
              refreshError
            );
            // Don't show error - the operation succeeded, refresh is just for sync
          });
        } else {
          // Revert optimistic update on failure
          setQueueData((prevQueueData) => {
            const reverted = prevQueueData.map((token) =>
              token.id === tokenId ? { ...token, status: 'serving' } : token
            );
            return reverted;
          });
          setSelectedTab('consulting');
          showNotification(
            'error',
            response?.message || t('doctor.dashboard.notifications.completeFailed')
          );
        }
      } catch (error) {
        logger.error('Failed to complete consultation:', error);
        // Revert optimistic update on error
        setQueueData((prevQueueData) => {
          const reverted = prevQueueData.map((token) =>
            token.id === tokenId ? { ...token, status: 'serving' } : token
          );
          return reverted;
        });
        setSelectedTab('consulting');
        showNotification(
          'error',
          t('doctor.dashboard.notifications.completeError', { message: error.message })
        );
      } finally {
        setRefreshing(false);
      }
    },
    [refreshQueue, showNotification, t]
  );

  // Queue-specific action handlers
  const handleCallNextPatient = async () => {
    try {
      setRefreshing(true);
      const response = await queueService.callNextPatient(currentDoctorId);
      if (response.success) {
        // Refresh queue to show updated status
        await refreshQueue();
        showNotification('success', t('doctor.dashboard.notifications.nextPatientCalled'));
      }
    } catch (error) {
      logger.error('Failed to call next patient:', error);
      showNotification(
        'error',
        t('doctor.dashboard.notifications.nextPatientFailed', { message: error.message })
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleCallNextAndStart = async () => {
    try {
      setRefreshing(true);
      logger.debug('[UI] Calling next patient and starting consultation...');
      const response = await queueService.callNextAndStart(currentDoctorId);

      logger.debug('[UI] Response:', response);

      // Check if response exists
      if (!response) {
        showNotification('error', t('doctor.dashboard.notifications.noServerResponse'));
        return;
      }

      if (response.hasActiveConsultation) {
        // Doctor has active consultation, ask if they want to end it
        const activePatient = response.activeToken?.patient
          ? `${response.activeToken.patient.first_name} ${response.activeToken.patient.last_name}`
          : 'a patient';

        logger.debug('[UI] Active consultation detected:', activePatient);

        const confirmed = window.confirm(
          t('doctor.dashboard.dialogs.activeConsultationTitle', {
            patient: activePatient,
            token: response.activeToken?.token_number,
          }) +
            '\n\n' +
            t('doctor.dashboard.dialogs.activeConsultationMessage')
        );

        if (confirmed) {
          logger.debug('[UI] User confirmed, ending active consultation...');
          await handleForceEndConsultation();
          // Try again after ending
          logger.debug('[UI] Retrying call next and start...');
          const retryResponse = await queueService.callNextAndStart(currentDoctorId);
          if (retryResponse && retryResponse.success) {
            // Immediately switch to consulting tab and refresh
            setSelectedTab('consulting');
            await refreshQueue(false);
            showNotification('success', retryResponse.message);
          } else if (retryResponse) {
            showNotification('info', retryResponse.message);
          }
        }
      } else if (response.success) {
        logger.debug('[UI] ✅ Consultation started successfully');
        // Immediately switch to consulting tab and refresh
        setSelectedTab('consulting');
        await refreshQueue(false);
        showNotification('success', response.message);
      } else {
        logger.debug('[UI] ℹ️ Response not successful:', response.message);
        showNotification('info', response.message);
      }
    } catch (error) {
      logger.error('[UI] ❌ Failed to call next and start:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error occurred';
      logger.error('[UI] Error message:', errorMsg);
      showNotification('error', errorMsg);
    } finally {
      setRefreshing(false);
    }
  };

  const handleForceEndConsultation = async () => {
    try {
      logger.debug('[UI] Ending active consultation...');
      const response = await queueService.forceEndConsultation(currentDoctorId);

      logger.debug('[UI] End consultation response:', response);

      // Check if response exists
      if (!response) {
        showNotification('error', t('doctor.dashboard.notifications.noServerResponse'));
        return;
      }

      if (response.success) {
        logger.debug('[UI] ✅ Consultation ended successfully');
        await refreshQueue();
        showNotification('success', t('doctor.dashboard.notifications.endConsultationSuccess'));
      } else {
        logger.debug('[UI] ℹ️ No active consultation to end:', response.message);
        showNotification('info', t('doctor.dashboard.notifications.noActiveConsultation'));
      }
    } catch (error) {
      logger.error('[UI] ❌ Failed to end consultation:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error occurred';
      logger.error('[UI] Error message:', errorMsg);
      showNotification(
        'error',
        t('doctor.dashboard.notifications.endConsultationFailed', { message: errorMsg })
      );
    }
  };

  const handleStartTokenConsultation = useCallback(
    async (tokenId) => {
      try {
        setRefreshing(true);

        // Optimistically update local state IMMEDIATELY (before API call)
        setQueueData((prevQueueData) => {
          const updated = prevQueueData.map((token) =>
            token.id === tokenId ? { ...token, status: 'serving' } : token
          );
          return updated;
        });

        // Immediately switch to consulting tab
        setSelectedTab('consulting');

        // Then make API call
        const response = await queueService.startConsultation(tokenId);

        // Handle response - check for success property or assume success if response exists
        const isSuccess =
          response?.success !== false && response !== null && response !== undefined;

        if (isSuccess) {
          showNotification(
            'success',
            response?.message || t('doctor.dashboard.notifications.consultationStarted')
          );

          // Refresh queue data to get latest status from server (but preserve optimistic update)
          // Don't let refresh errors affect the success of the operation
          refreshQueue(true).catch((refreshError) => {
            logger.error(
              'Failed to refresh after start consultation (non-critical):',
              refreshError
            );
            // Don't show error - the operation succeeded, refresh is just for sync
          });
        } else {
          // Revert optimistic update on failure
          setQueueData((prevQueueData) => {
            const reverted = prevQueueData.map((token) =>
              token.id === tokenId ? { ...token, status: 'called' } : token
            );
            return reverted;
          });
          setSelectedTab('ready');
          showNotification(
            'error',
            response?.message ||
              t('doctor.dashboard.notifications.consultationFailed', { message: '' })
          );
        }
      } catch (error) {
        // Revert optimistic update on error
        setQueueData((prevQueueData) => {
          const reverted = prevQueueData.map((token) =>
            token.id === tokenId ? { ...token, status: 'called' } : token
          );
          return reverted;
        });
        setSelectedTab('ready');

        // Extract error details from response or enhanced error
        const errorCode = error.code || error.response?.data?.code;
        const errorMessage = error.response?.data?.message || error.message;
        const errorDetails = error.details || error.response?.data?.details;

        // Handle queue priority/order violations with specific messages
        if (errorCode === 'QUEUE_PRIORITY_VIOLATION') {
          const priorityType = errorDetails?.priorityType || 'higher priority';
          const waitingToken = errorDetails?.waitingTokenNumber || '?';
          showNotification(
            'warning',
            `⚠️ ${priorityType.toUpperCase()} Patient Waiting!\n${errorMessage}`,
            `Token #${waitingToken} Priority`
          );
        } else if (errorCode === 'QUEUE_ORDER_VIOLATION') {
          const waitingToken = errorDetails?.waitingTokenNumber || '?';
          showNotification(
            'warning',
            `📋 Please Follow Queue Order\n${errorMessage}`,
            `Token #${waitingToken} First`
          );
        } else if (errorMessage && errorMessage.includes('currently in consultation')) {
          // Handle different error types
          const confirmAction = window.confirm(
            `${errorMessage}\n\n` + t('doctor.dashboard.dialogs.currentlyInConsultation')
          );
          if (confirmAction) {
            // Switch to the "In Consultation" tab and refresh
            setSelectedTab('consulting');
            await refreshQueue(false);
          }
        } else if (errorMessage && errorMessage.includes("should be 'called'")) {
          const confirmAction = window.confirm(
            t('doctor.dashboard.dialogs.patientNeedsCalling', { message: errorMessage })
          );
          if (confirmAction) {
            await handleCallNextPatient();
          }
        } else {
          showNotification(
            'error',
            t('doctor.dashboard.notifications.consultationFailed', { message: errorMessage })
          );
        }
      } finally {
        setRefreshing(false);
      }
    },
    [refreshQueue, showNotification, handleCallNextPatient, t]
  );

  return (
    <PageLayout
      title={t('doctor.dashboard.title')}
      subtitle={t('doctor.dashboard.subtitle')}
      fullWidth
    >
      {/* Notifications now handled by Toast system (top-right corner) */}

      <div className="space-y-8 p-8">
        {/* Loading state */}
        {loading ? (
          <div className="py-12">
            <LoadingSpinner label={t('doctor.dashboard.loadingPatients')} />
          </div>
        ) : (
          <>
            {/* Patient Stats */}
            <PatientStats patients={patients} userRole="doctor" />

            {/* Search and actions bar */}
            <div className="flex items-center gap-4">
              <div className="relative max-w-md flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('doctor.dashboard.searchPlaceholder')}
                  ariaLabel={t('doctor.dashboard.searchAriaLabel')}
                />
              </div>
              <div className="min-w-[200px]">
                <select
                  className="h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option value="all">{t('doctor.dashboard.timeFilter.all')}</option>
                  <option value="morning">{t('doctor.dashboard.timeFilter.morning')}</option>
                  <option value="afternoon">{t('doctor.dashboard.timeFilter.afternoon')}</option>
                </select>
              </div>
              <Button
                onClick={handleCallNextAndStart}
                className="h-12 bg-blue-600 px-6 font-semibold text-white shadow-lg hover:bg-blue-700"
                disabled={refreshing}
                title={t('doctor.dashboard.actions.callNextAndStartTitle')}
              >
                <PlayCircle className="mr-2" size={20} />
                {t('doctor.dashboard.actions.callNextAndStart')}
              </Button>
              <Button
                onClick={handleForceEndConsultation}
                variant="outline"
                className="h-12 border-red-300 px-4 text-red-600 hover:bg-red-50"
                disabled={refreshing}
                title={t('doctor.dashboard.actions.endConsultationTitle')}
              >
                <XCircle className="mr-2" size={18} />
                {t('doctor.dashboard.actions.endConsultation')}
              </Button>
              <Button
                onClick={refreshQueue}
                variant="outline"
                className="h-12 px-4"
                disabled={refreshing}
              >
                <RefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={18} />
                {t('doctor.dashboard.actions.refresh')}
              </Button>
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? 'default' : 'outline'}
                className={`h-12 px-4 ${autoRefresh ? 'bg-green-600 text-white hover:bg-green-700' : ''}`}
                title={
                  autoRefresh
                    ? t('doctor.dashboard.actions.autoRefreshOnTitle')
                    : t('doctor.dashboard.actions.autoRefreshOffTitle')
                }
              >
                <RefreshCw className={`mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} size={18} />
                {autoRefresh
                  ? t('doctor.dashboard.actions.autoRefreshOn')
                  : t('doctor.dashboard.actions.autoRefreshOff')}
              </Button>
            </div>

            {/* Patient tabs and cards */}
            <Card className="p-8">
              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                {/* Status Filter Tabs - Styled like Nurse Dashboard */}
                <div className="mb-8 w-full rounded-lg border border-border bg-card p-2 shadow-sm">
                  <div className="flex space-x-1 rounded-lg bg-muted p-1">
                    <button
                      onClick={() => setSelectedTab('ready')}
                      className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                        selectedTab === 'ready'
                          ? 'border border-border bg-card text-card-foreground shadow-sm'
                          : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        {t('doctor.dashboard.tabs.ready')} (
                        {
                          queueData.filter((t) => ['ready', 'called', 'waiting'].includes(t.status))
                            .length
                        }
                        )
                      </div>
                    </button>
                    <button
                      onClick={() => setSelectedTab('consulting')}
                      className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                        selectedTab === 'consulting'
                          ? 'border border-border bg-card text-card-foreground shadow-sm'
                          : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <UserCog className="h-4 w-4" />
                        {t('doctor.dashboard.tabs.inConsultation')} (
                        {queueData.filter((t) => t.status === 'serving').length})
                      </div>
                    </button>
                    <button
                      onClick={() => setSelectedTab('completed')}
                      className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                        selectedTab === 'completed'
                          ? 'border border-border bg-card text-card-foreground shadow-sm'
                          : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {t('doctor.dashboard.tabs.completed')} (
                        {
                          queueData.filter((t) => ['completed', 'cancelled'].includes(t.status))
                            .length
                        }
                        )
                      </div>
                    </button>
                  </div>
                </div>

                <TabsContent value="ready" className="mt-0">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {/* Show queue tokens if available, otherwise show regular patients */}
                    {filteredQueueData.length > 0
                      ? filteredQueueData.map((token) => {
                          const patientData = transformTokenToPatientData(token);

                          return (
                            <PatientCard
                              key={token.id}
                              patient={patientData}
                              userRole="doctor"
                              onStartConsultation={() => handleStartTokenConsultation(token.id)}
                              onCompleteVisit={() => handleCompleteTokenConsultation(token.id)}
                              onViewFullPatientData={(patient) => {
                                navigate('/doctor/patient-record', {
                                  state: {
                                    patient,
                                    visit_id: token.visit_id,
                                  },
                                });
                              }}
                            />
                          );
                        })
                      : filteredPatients.map((patient) => (
                          <PatientCard
                            key={patient.id}
                            patient={patient}
                            userRole="doctor"
                            onStartConsultation={handleStartConsultation}
                            onCompleteVisit={handleCompleteVisit}
                            onViewFullPatientData={(patient) => {
                              navigate('/doctor/patient-record', { state: { patient } });
                            }}
                          />
                        ))}
                    {filteredQueueData.length === 0 && filteredPatients.length === 0 && (
                      <div className="col-span-full py-12 text-center text-lg text-gray-500">
                        {t('doctor.dashboard.emptyStates.noReady')}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="consulting" className="mt-0">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {/* Show queue tokens if available, otherwise show regular patients */}
                    {filteredQueueData.length > 0
                      ? filteredQueueData.map((token) => {
                          const patientData = transformTokenToPatientData(token);

                          return (
                            <PatientCard
                              key={token.id}
                              patient={patientData}
                              userRole="doctor"
                              onStartConsultation={() => handleStartTokenConsultation(token.id)}
                              onCompleteVisit={() => handleCompleteTokenConsultation(token.id)}
                              onViewFullPatientData={(patient) => {
                                navigate('/doctor/patient-record', {
                                  state: {
                                    patient,
                                    visit_id: token.visit_id,
                                  },
                                });
                              }}
                            />
                          );
                        })
                      : filteredPatients.map((patient) => (
                          <PatientCard
                            key={patient.id}
                            patient={patient}
                            userRole="doctor"
                            onStartConsultation={handleStartConsultation}
                            onCompleteVisit={handleCompleteVisit}
                            onViewFullPatientData={(patient) => {
                              navigate('/doctor/patient-record', { state: { patient } });
                            }}
                          />
                        ))}
                    {filteredQueueData.length === 0 && filteredPatients.length === 0 && (
                      <div className="col-span-full py-12 text-center text-lg text-gray-500">
                        {t('doctor.dashboard.emptyStates.noConsulting')}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="completed" className="mt-0">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {/* Show queue tokens if available, otherwise show regular patients */}
                    {filteredQueueData.length > 0
                      ? filteredQueueData.map((token) => {
                          const patientData = transformTokenToPatientData(token);

                          return (
                            <PatientCard
                              key={token.id}
                              patient={patientData}
                              userRole="doctor"
                              readOnly={true}
                              onViewFullPatientData={(patient) => {
                                navigate('/doctor/patient-record', {
                                  state: {
                                    patient,
                                    visit_id: token.visit_id,
                                  },
                                });
                              }}
                            />
                          );
                        })
                      : filteredPatients.map((patient) => (
                          <PatientCard
                            key={patient.id}
                            patient={patient}
                            userRole="doctor"
                            readOnly={true}
                            onViewFullPatientData={(patient) => {
                              navigate('/doctor/patient-record', { state: { patient } });
                            }}
                          />
                        ))}
                    {filteredQueueData.length === 0 && filteredPatients.length === 0 && (
                      <div className="col-span-full py-12 text-center text-lg text-gray-500">
                        {t('doctor.dashboard.emptyStates.noCompleted')}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default DoctorDashboard;
