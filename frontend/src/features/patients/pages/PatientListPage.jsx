import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePatients, ReceptionistPatientCard } from '@/features/patients';
import { useNavigate, Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { SearchBar, EmptyState, LoadingSpinner } from '@/components/library';

export default function PatientListPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, error, refetch } = usePatients();
  const navigate = useNavigate();

  const normalizedError = (() => {
    if (!error) {
      return null;
    }
    const msg = error?.message || String(error);
    if (msg.includes('Access token required') || msg.includes('401')) {
      return { message: 'Please log in to access patient records', isAuthError: true };
    }
    if (msg.includes('Too many requests') || msg.includes('rate limit')) {
      return {
        message: 'Too many requests. Please wait a moment and try again.',
        isRateLimit: true,
      };
    }
    if (msg.includes('Failed to fetch')) {
      return {
        message: 'Unable to connect to the server. Please check your connection and try again.',
        isNetworkError: true,
      };
    }
    return { message: msg };
  })();

  // Filter patients based on search term using useMemo
  const filteredPatients = useMemo(() => {
    const patients = Array.isArray(data) ? data : [];

    if (!searchTerm.trim()) {
      return patients;
    }

    const term = searchTerm.toLowerCase();
    return patients.filter(
      (patient) =>
        patient.first_name?.toLowerCase().includes(term) ||
        patient.last_name?.toLowerCase().includes(term) ||
        patient.patient_number?.toLowerCase().includes(term) ||
        patient.phone?.includes(term) ||
        patient.email?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleBookAppointment = (patient) => {
    navigate('/receptionist/appointments', {
      state: {
        patient: patient,
      },
    });
  };

  return (
    <PageLayout
      title={t('receptionist.patients.title')}
      subtitle={t('receptionist.patients.subtitle')}
      fullWidth
    >
      <div className="space-y-4 p-3 sm:space-y-6 sm:p-6 md:space-y-8 md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl md:text-2xl">
            {t('receptionist.patients.patientList')}
          </h2>
          <Link to="/receptionist/register-patient">
            <Button className="hover:bg-primary/90 flex w-full items-center gap-2 bg-primary px-4 py-3 text-sm text-primary-foreground sm:w-auto sm:gap-3 sm:px-6 sm:py-4 sm:text-base md:px-8 md:py-6 md:text-lg">
              {t('receptionist.patients.newPatient')}
            </Button>
          </Link>
        </div>

        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder={t('receptionist.patients.searchPlaceholder')}
          ariaLabel={t('receptionist.patients.title')}
        />

        <div className="grid gap-3 sm:gap-4 md:gap-6">
          {isLoading ? (
            <LoadingSpinner label={t('receptionist.patients.loadingPatients')} size="lg" />
          ) : normalizedError ? (
            <Card className="bg-card p-6 text-center sm:p-8 md:p-12">
              <p className="mb-3 text-base text-destructive sm:mb-4 sm:text-lg md:text-xl">
                {normalizedError.isAuthError
                  ? t('receptionist.patients.authRequired')
                  : normalizedError.isRateLimit
                    ? t('receptionist.patients.rateLimitExceeded')
                    : normalizedError.isNetworkError
                      ? t('receptionist.patients.connectionError')
                      : t('receptionist.patients.errorLoading')}
              </p>
              <p className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-base md:text-lg">
                {normalizedError.message}
              </p>
              {normalizedError.isAuthError ? (
                <Button onClick={() => navigate('/')} className="mr-4">
                  {t('receptionist.patients.goToLogin')}
                </Button>
              ) : normalizedError.isRateLimit ? (
                <div>
                  <p className="mb-4 text-xs text-muted-foreground sm:text-sm">
                    {t('receptionist.patients.rateLimitMessage')}
                  </p>
                  <Button onClick={() => window.location.reload()} className="mr-4">
                    {t('receptionist.patients.refreshPage')}
                  </Button>
                </div>
              ) : null}
              <Button onClick={() => refetch()} variant="outline">
                {t('receptionist.patients.tryAgain')}
              </Button>
            </Card>
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <ReceptionistPatientCard
                key={patient.id}
                patient={patient}
                onBookAppointment={handleBookAppointment}
              />
            ))
          ) : (
            <EmptyState
              title={t('receptionist.patients.noPatients')}
              description={t('receptionist.patients.noPatientsMatch')}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
}
