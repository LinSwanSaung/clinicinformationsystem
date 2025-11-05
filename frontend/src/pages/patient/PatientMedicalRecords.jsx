import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Skeleton } from '../../components/ui/skeleton';

// Import reusable medical components (read-only versions)
import PatientInformationHeader from '../../components/medical/PatientInformationHeader';
import NavigationTabs from '../../components/ui/NavigationTabs';
import PatientVitalsDisplay from '../../components/medical/PatientVitalsDisplay';
import MedicalInformationPanel from '../../components/medical/MedicalInformationPanel';
import ClinicalNotesDisplay from '../../components/medical/ClinicalNotesDisplay';
import VisitHistoryCard from '../../components/medical/VisitHistoryCard';

import patientPortalService from '../../services/patientPortalService';
import { allergyService } from '../../services/allergyService';
import { diagnosisService } from '../../services/diagnosisService';
import { visitService } from '../../services/visitService';
import vitalsService from '../../services/vitalsService';
import api from '../../services/api';

const PatientMedicalRecords = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // Basic state
  const [profileData, setProfileData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedVisit, setExpandedVisit] = useState(null);

  // Medical data state
  const [allergies, setAllergies] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [visits, setVisits] = useState([]);
  const [latestVitals, setLatestVitals] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);

  // Load patient profile and medical data
  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get patient profile (includes linked patient record)
      const profileResponse = await patientPortalService.getProfile();
      const profile = profileResponse?.data || profileResponse;
      
      if (!profile?.patient) {
        throw new Error('Patient record not linked to your account');
      }

      setProfileData(profile);
      setPatientData(profile.patient);

      const patientId = profile.patient.id;

      // Load all medical data in parallel
      const [allergiesRes, diagnosesRes, visitsRes, vitalsRes, prescriptionsRes] = await Promise.all([
        allergyService.getAllergiesByPatient(patientId).catch(err => {
          console.error('Failed to load allergies:', err);
          return [];
        }),
        diagnosisService.getDiagnosesByPatient(patientId).catch(err => {
          console.error('Failed to load diagnoses:', err);
          return [];
        }),
        patientPortalService.getVisits(20, 0).catch(err => {
          console.error('Failed to load visits:', err);
          return { data: [] };
        }),
        patientPortalService.getLatestVitals().catch(err => {
          console.error('Failed to load vitals:', err);
          return { data: null };
        }),
        patientPortalService.getPrescriptions(true).catch(err => { // Include all prescriptions (active + inactive)
          console.error('Failed to load prescriptions:', err);
          return { data: [] };
        })
      ]);

      setAllergies(Array.isArray(allergiesRes) ? allergiesRes : []);
      setDiagnoses(Array.isArray(diagnosesRes) ? diagnosesRes : []);
      setVisits(Array.isArray(visitsRes?.data) ? visitsRes.data : []);
      setLatestVitals(vitalsRes?.data || null);
      setPrescriptions(Array.isArray(prescriptionsRes?.data) ? prescriptionsRes.data : []);

    } catch (err) {
      console.error('Failed to load patient data:', err);
      setError(err.message || 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  // Download single visit PDF
  const handleDownloadVisitPDF = async (visitId) => {
    try {
      const blob = await api.getBlob(`/visits/${visitId}/export/pdf`, {
        headers: { Accept: 'application/pdf' },
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visit-summary-${visitId}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download visit PDF:', err);
      alert('Failed to download visit summary. Please try again.');
    }
  };

  const tabs = [
    { id: 'overview', label: t('patient.medicalRecords.overview'), icon: 'activity' },
    { id: 'prescriptions', label: t('patient.medicalRecords.prescriptionHistory'), icon: 'pill' },
    { id: 'allergies', label: t('patient.medicalRecords.allergies'), icon: 'alert-triangle' },
    { id: 'diagnoses', label: t('patient.medicalRecords.diagnoses'), icon: 'clipboard' },
    { id: 'history', label: t('patient.medicalRecords.visitHistory'), icon: 'calendar' }
  ];

  if (loading) {
    return (
      <PageLayout
        title={t('patient.medicalRecords.title')}
        subtitle={t('patient.medicalRecords.subtitle')}
      >
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="My Medical Records"
        subtitle="View your complete medical history"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate('/patient/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t('patient.medicalRecords.title')}
      subtitle={t('patient.medicalRecords.subtitle')}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate('/patient/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('patient.dashboard.backToDashboard')}
        </Button>

        {/* Patient Information Header - Read Only */}
        <PatientInformationHeader 
          patient={{
            ...patientData,
            name: `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim(),
            initials: `${patientData.first_name?.[0] || ''}${patientData.last_name?.[0] || ''}`.toUpperCase(),
            avatarColor: 'bg-primary'
          }}
          showBackButton={false}
          showClearButton={false}
        />

        {/* Navigation Tabs */}
        <NavigationTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Latest Vitals from Last Visit */}
              {latestVitals && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t('patient.medicalRecords.latestVitals')}</h3>
                    {latestVitals.recorded_at && (
                      <span className="text-sm text-muted-foreground">
                        {t('patient.medicalRecords.recordedOn')} {new Date(latestVitals.recorded_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                  <PatientVitalsDisplay 
                    vitals={latestVitals}
                    showAddButton={false}
                    showEditButton={false}
                  />
                </div>
              )}

              {/* Medical Information Panel - Read Only */}
              <MedicalInformationPanel
                patient={{
                  ...patientData,
                  allergies: allergies.map(a => a.allergy_name || a.allergen),
                  diagnosisHistory: diagnoses.map(d => ({
                    condition: d.diagnosis_name,
                    date: d.diagnosed_date ? new Date(d.diagnosed_date).toLocaleDateString() : 'N/A'
                  })),
                  currentMedications: prescriptions
                    .filter(p => p.status === 'active' || p.is_active)
                    .map(p => ({
                      name: p.medication_name,
                      dosage: p.dosage,
                      frequency: p.frequency
                    }))
                }}
                onAddAllergy={null}
                onAddDiagnosis={null}
                showActionButtons={false}
              />

              {/* Recent Visit History */}
              {visits.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('patient.medicalRecords.recentVisits')}</h3>
                  {visits.slice(0, 3).map((visit) => (
                    <VisitHistoryCard
                      key={visit.id}
                      visit={visit}
                      isExpanded={expandedVisit === visit.id}
                      onToggleExpand={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
                      showDetailsButton={false}
                      onDownloadPDF={handleDownloadVisitPDF}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('patient.medicalRecords.prescriptionHistory')}</h3>
              {prescriptions.length > 0 ? (
                <div className="grid gap-4">
                  {prescriptions
                    .sort((a, b) => {
                      // Sort by prescribed_date, newest first
                      const dateA = new Date(a.prescribed_date || 0);
                      const dateB = new Date(b.prescribed_date || 0);
                      return dateB - dateA;
                    })
                    .map((prescription) => {
                    const isActive = prescription.status === 'active' || prescription.is_active === true;
                    return (
                      <div
                        key={prescription.id}
                        className={`border rounded-lg p-4 space-y-3 transition-all ${
                          isActive 
                            ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-200' 
                            : 'border-border bg-background'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{prescription.medication_name}</h4>
                              {isActive && (
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-medium">
                                  {t('patient.prescriptions.active')}
                                </span>
                              )}
                            </div>
                            <div className="grid gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground font-medium">{t('patient.prescriptions.dosage')}:</span>
                                <span>{prescription.dosage}</span>
                              </div>
                              {prescription.frequency && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground font-medium">{t('patient.prescriptions.frequency')}:</span>
                                  <span>{prescription.frequency}</span>
                                </div>
                              )}
                              {prescription.duration && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground font-medium">{t('patient.prescriptions.duration')}:</span>
                                  <span>{prescription.duration}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            {prescription.prescribed_date && (
                              <p className="text-sm text-muted-foreground">
                                Prescribed: {new Date(prescription.prescribed_date).toLocaleDateString()}
                              </p>
                            )}
                            {prescription.visit && (
                              <p className="text-xs text-muted-foreground">
                                Visit: {new Date(prescription.visit.visit_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {prescription.instructions && (
                          <div className="pt-2 border-t">
                            <p className="text-sm">
                              <span className="font-medium text-muted-foreground">Instructions:</span>
                              <span className="ml-2">{prescription.instructions}</span>
                            </p>
                          </div>
                        )}

                        {prescription.doctor_name && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">Prescribed by:</span>
                            <span>{prescription.doctor_name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('patient.medicalRecords.noPrescriptionsRecorded')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {activeTab === 'allergies' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('patient.medicalRecords.knownAllergies')}</h3>
              {allergies.length > 0 ? (
                <div className="grid gap-4">
                  {allergies.map((allergy) => (
                    <div
                      key={allergy.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{allergy.allergy_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {t('patient.medicalRecords.type')}: {allergy.allergen_type}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          allergy.severity === 'severe' ? 'bg-red-100 text-red-800' :
                          allergy.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {allergy.severity}
                        </span>
                      </div>
                      {allergy.reaction && (
                        <p className="text-sm">
                          <strong>{t('patient.medicalRecords.reaction')}:</strong> {allergy.reaction}
                        </p>
                      )}
                      {allergy.notes && (
                        <p className="text-sm text-muted-foreground">{allergy.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('patient.medicalRecords.noAllergiesRecorded')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {activeTab === 'diagnoses' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('patient.medicalRecords.medicalDiagnoses')}</h3>
              {diagnoses.length > 0 ? (
                <div className="grid gap-4">
                  {diagnoses.map((diagnosis) => (
                    <div
                      key={diagnosis.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{diagnosis.diagnosis_name}</h4>
                          {diagnosis.diagnosis_code && (
                            <p className="text-sm text-muted-foreground">
                              {t('patient.medicalRecords.code')}: {diagnosis.diagnosis_code}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            diagnosis.status === 'active' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {diagnosis.status}
                          </span>
                          {diagnosis.severity && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              diagnosis.severity === 'severe' ? 'bg-red-100 text-red-800' :
                              diagnosis.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {diagnosis.severity}
                            </span>
                          )}
                        </div>
                      </div>
                      {diagnosis.diagnosed_date && (
                        <p className="text-sm text-muted-foreground">
                          {t('patient.medicalRecords.diagnosed')}: {new Date(diagnosis.diagnosed_date).toLocaleDateString()}
                        </p>
                      )}
                      {diagnosis.notes && (
                        <p className="text-sm">{diagnosis.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('patient.medicalRecords.noDiagnosesRecorded')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <>
              {visits.length > 0 ? (
                <div className="space-y-4">
                  {visits.map((visit) => (
                    <VisitHistoryCard
                      key={visit.id}
                      visit={visit}
                      isExpanded={expandedVisit === visit.id}
                      onToggleExpand={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
                      showDetailsButton={false}
                      onDownloadPDF={handleDownloadVisitPDF}
                    />
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('patient.medicalRecords.noVisitHistoryAvailable')}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default PatientMedicalRecords;
