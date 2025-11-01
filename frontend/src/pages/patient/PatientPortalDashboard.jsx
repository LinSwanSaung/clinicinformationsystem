import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/PageLayout';
import ProfileSummary from '@/components/patient/ProfileSummary';
import UpcomingAppointments from '@/components/patient/UpcomingAppointments';
import LatestVisitSummary from '@/components/patient/LatestVisitSummary';
import VitalsSnapshot from '@/components/patient/VitalsSnapshot';
import PortalSearchResults from '@/components/patient/PortalSearchResults';
import AIHealthBlog from '@/components/patient/AIHealthBlog';
import patientPortalService from '@/services/patientPortalService';
import { Separator } from '@/components/ui/separator';

const PatientPortalDashboard = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [profileState, setProfileState] = useState({ data: null, loading: true, error: null });
  const [visitsState, setVisitsState] = useState({ data: [], loading: true, error: null });
  const [appointmentsState, setAppointmentsState] = useState({ data: [], loading: true, error: null });
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
      console.error('[loadProfile] Error:', error);
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
      console.error('[loadVisits] Error:', error);
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
      console.error('[loadAppointments] Error:', error);
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

  const lastVisit = useMemo(() => {
    if (!Array.isArray(visitsState.data) || visitsState.data.length === 0) {
      return null;
    }
    const completedVisits = visitsState.data.filter(v => v.status === 'completed');
    if (completedVisits.length === 0) return null;
    return completedVisits.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))[0];
  }, [visitsState.data]);

  const vitalsVisits = useMemo(() => {
    if (!Array.isArray(visitsState.data)) return [];
    return visitsState.data.filter(v => v.vitals && Object.keys(v.vitals).length > 0);
  }, [visitsState.data]);

  const handleLanguageToggle = useCallback(() => {
    const newLang = i18n.language === 'en' ? 'my' : 'en';
    i18n.changeLanguage(newLang);
  }, [i18n]);

  const profileData = profileState.data?.data ?? profileState.data;
  console.log('[PatientPortalDashboard] profileState:', profileState);
  console.log('[PatientPortalDashboard] profileData:', profileData);

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
            language={i18n.language}
            onLanguageToggle={handleLanguageToggle}
          />
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
          {console.log('[PatientPortalDashboard] Rendering AIHealthBlog check:', { hasProfileData: !!profileData, patientId: profileData?.patient?.id })}
          {profileData?.patient?.id && (
            <>
              {console.log('[PatientPortalDashboard] Rendering AIHealthBlog with patientId:', profileData.patient.id)}
              <AIHealthBlog patientId={profileData.patient.id} />
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default PatientPortalDashboard;
