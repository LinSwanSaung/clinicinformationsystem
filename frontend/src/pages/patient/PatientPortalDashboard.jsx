import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/layout/PageLayout';
import {
  ProfileSummary,
  UpcomingAppointments,
  VitalsSnapshot,
  AIHealthBlog,
} from '@/features/patient-portal';
import { LatestVisitSummary } from '@/features/visits';
import { patientPortalService } from '@/features/patients';
import logger from '@/utils/logger';
import { StatCard } from '@/components/library/dashboard/StatCard';
import { Wallet } from 'lucide-react';
import { POLLING_INTERVALS } from '@/constants/polling';

const PatientPortalDashboard = () => {
  const { t, i18n } = useTranslation();
  const [profileState, setProfileState] = useState({ data: null, loading: true, error: null });
  const [visitsState, setVisitsState] = useState({ data: [], loading: true, error: null });
  const [appointmentsState, setAppointmentsState] = useState({
    data: [],
    loading: true,
    error: null,
  });
  const [creditState, setCreditState] = useState({ value: 0, loading: false, error: null });
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadProfile = useCallback(async () => {
    setProfileState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await patientPortalService.getProfile();
      if (response?.success === false) {
        throw new Error(response?.message || 'Failed to fetch profile');
      }
      if (isMounted.current) {
        setProfileState({ data: response?.data ?? null, loading: false, error: null });
      }
    } catch (error) {
      logger.error('[loadProfile] Error:', error);
      if (isMounted.current) {
        setProfileState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    }
  }, []);

  const loadVisits = useCallback(async () => {
    setVisitsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await patientPortalService.getVisits();
      if (response?.success === false) {
        throw new Error(response?.message || 'Failed to fetch visits');
      }
      if (isMounted.current) {
        setVisitsState({ data: response?.data ?? [], loading: false, error: null });
      }
    } catch (error) {
      logger.error('[loadVisits] Error:', error);
      if (isMounted.current) {
        setVisitsState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    setAppointmentsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await patientPortalService.getUpcomingAppointments();
      if (response?.success === false) {
        throw new Error(response?.message || 'Failed to fetch appointments');
      }
      if (isMounted.current) {
        setAppointmentsState({ data: response?.data ?? [], loading: false, error: null });
      }
    } catch (error) {
      logger.error('[loadAppointments] Error:', error);
      if (isMounted.current) {
        setAppointmentsState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadVisits();
    loadAppointments();
  }, [loadProfile, loadVisits, loadAppointments]);

  // Auto-refresh appointments and credit balance
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Refresh appointments (they can change if new ones are booked)
      loadAppointments();
      // Refresh credit balance (it can change if payments are made)
      (async () => {
        try {
          setCreditState((s) => ({ ...s, loading: true, error: null }));
          const res = await patientPortalService.getOutstandingBalance();
          const value = Number(res?.data?.totalBalance ?? res?.totalBalance ?? 0);
          setCreditState({ value, loading: false, error: null });
        } catch (e) {
          setCreditState({
            value: 0,
            loading: false,
            error: e.message || 'Failed to load outstanding balance',
          });
        }
      })();
    }, POLLING_INTERVALS.DASHBOARD); // Refresh every 60 seconds

    return () => clearInterval(refreshInterval);
  }, [loadAppointments]);

  const lastVisit = useMemo(() => {
    if (!Array.isArray(visitsState.data) || visitsState.data.length === 0) {
      logger.debug('[lastVisit] No visits data available');
      return null;
    }

    logger.debug('[lastVisit] All visits:', visitsState.data);

    const relevantVisits = visitsState.data.filter((v) => {
      logger.debug('[lastVisit] Visit status:', v.status, 'for visit:', v);
      return v.status === 'completed' || v.status === 'in-progress' || v.status === 'in_progress';
    });

    logger.debug('[lastVisit] Relevant visits:', relevantVisits);

    if (relevantVisits.length === 0) {
      return null;
    }

    // Sort by date, most recent first
    const sorted = relevantVisits.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
    logger.debug('[lastVisit] Selected visit:', sorted[0]);
    return sorted[0];
  }, [visitsState.data]);

  const vitalsVisits = useMemo(() => {
    if (!Array.isArray(visitsState.data)) {
      return [];
    }
    return visitsState.data.filter((v) => v.vitals && Object.keys(v.vitals).length > 0);
  }, [visitsState.data]);

  const profileData = profileState.data?.data ?? profileState.data;
  logger.debug('[PatientPortalDashboard] profileState:', profileState);
  logger.debug('[PatientPortalDashboard] profileData:', profileData);

  // Load patient outstanding balance once profile is ready (via patient portal endpoint)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setCreditState((s) => ({ ...s, loading: true, error: null }));
        const res = await patientPortalService.getOutstandingBalance();
        // Get totalBalance from outstanding balance response
        const value = Number(res?.data?.totalBalance ?? res?.totalBalance ?? 0);
        if (mounted) {
          setCreditState({ value, loading: false, error: null });
        }
      } catch (e) {
        if (mounted) {
          setCreditState({
            value: 0,
            loading: false,
            error: e.message || 'Failed to load outstanding balance',
          });
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageLayout
      title={t('patient.dashboard.title')}
      subtitle={t('patient.dashboard.subtitle')}
      fullWidth
      customBreadcrumbs={null}
    >
      <div className="space-y-8">
        <div className="grid gap-6">
          <ProfileSummary
            data={profileData}
            lastVisit={lastVisit}
            loading={profileState.loading}
            error={profileState.error}
            onRetry={loadProfile}
          />
          {/* Credit Remaining */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title={t('patient.dashboard.creditRemaining')}
              value={`$${Number(creditState.value || 0).toFixed(2)}`}
              icon={Wallet}
              helperText={
                creditState.loading
                  ? t('common.loading')
                  : creditState.error
                    ? creditState.error
                    : t('patient.dashboard.creditRemainingHelper')
              }
            />
          </div>
          <div className="grid gap-6 xl:grid-cols-[2fr,3fr]">
            <UpcomingAppointments
              appointments={appointmentsState.data}
              loading={appointmentsState.loading}
              error={appointmentsState.error}
              onRetry={loadAppointments}
            />
            <LatestVisitSummary
              visit={lastVisit}
              loading={visitsState.loading}
              error={visitsState.error}
              onRetry={loadVisits}
            />
          </div>
          <VitalsSnapshot
            visits={vitalsVisits}
            loading={visitsState.loading}
            error={visitsState.error}
            onRetry={loadVisits}
          />

          {/* AI Health Blog - based on last diagnosis */}
          {logger.debug('[PatientPortalDashboard] Rendering AIHealthBlog check:', {
            hasProfileData: !!profileData,
            patientId: profileData?.patient?.id,
          })}
          {profileData?.patient?.id && (
            <>
              {logger.debug(
                '[PatientPortalDashboard] Rendering AIHealthBlog with patientId:',
                profileData.patient.id
              )}
              <AIHealthBlog patientId={profileData.patient.id} language={i18n.language} />
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default PatientPortalDashboard;
