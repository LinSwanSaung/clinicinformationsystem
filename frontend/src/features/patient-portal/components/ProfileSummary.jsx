import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/library/feedback/ErrorState';
import { Copy } from 'lucide-react';

const motionProps = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

const getInitials = (patient) => {
  if (!patient) {
    return 'PT';
  }
  const first = patient.first_name?.[0] ?? '';
  const last = patient.last_name?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || 'PT';
};

const copyToClipboard = async (value) => {
  if (!value) {
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
  } catch (error) {
    console.warn('Clipboard copy failed:', error);
  }
};

const ProfileSkeleton = () => (
  <Card className="p-6">
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="w-full space-y-3 md:w-auto">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-44" />
      </div>
    </div>
  </Card>
);

const ProfileSummary = ({ data, lastVisit, loading, error, onRetry }) => {
  const { t } = useTranslation();

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message={t('patient.profile.errorTitle')}
        description={t('patient.profile.errorDescription')}
        onRetry={onRetry}
      />
    );
  }

  const patient = data?.patient;
  const user = data?.user;

  const fullName = patient
    ? `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim()
    : user
      ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
      : t('patient.profile.unknownName');

  const patientNumber = patient?.patient_number ?? t('patient.profile.noPatientCode');

  const lastVisitDate = lastVisit?.visit_date ? new Date(lastVisit.visit_date) : null;

  const age = patient?.date_of_birth
    ? Math.max(
        0,
        new Date().getFullYear() -
          new Date(patient.date_of_birth).getFullYear() -
          (new Date() <
          new Date(new Date(patient.date_of_birth).setFullYear(new Date().getFullYear()))
            ? 1
            : 0)
      )
    : null;

  const lastDoctorName = lastVisit?.doctor_name;

  const patientGreeting = fullName
    ? t('patient.profile.greeting', { name: fullName })
    : t('patient.profile.genericGreeting');

  return (
    <motion.div {...motionProps}>
      <Card className="border-border/80 overflow-hidden border shadow-sm">
        <CardHeader className="bg-muted/30 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-foreground">
              {patientGreeting}
            </CardTitle>
            <p className="text-sm text-muted-foreground md:text-base">
              {age !== null
                ? t('patient.profile.summaryLabel', { age })
                : t('patient.profile.summaryFallback')}
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[auto,1fr] md:items-center">
          <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
            <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-primary">
              {getInitials(patient || user)}
            </div>
            <div className="space-y-1">
              <p className="text-xl font-semibold text-foreground">{fullName}</p>
              {patient?.gender && (
                <p className="text-sm text-muted-foreground">
                  {t('patient.profile.genderLabel')}:{' '}
                  <span className="font-medium text-foreground">{patient.gender}</span>
                </p>
              )}
              {patient?.date_of_birth && (
                <p className="text-sm text-muted-foreground">
                  {t('patient.profile.dobLabel')}:{' '}
                  {new Date(patient.date_of_birth).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('patient.profile.patientCodeLabel')}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm md:text-base">{patientNumber}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(patientNumber)}
                    aria-label={t('patient.profile.copyPatientCodeAria')}
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-primary/40 bg-primary/5 rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium text-primary">
                {lastVisitDate
                  ? t('patient.profile.lastVisitLabel', {
                      date: lastVisitDate.toLocaleDateString(),
                      doctor: lastDoctorName ?? t('patient.profile.unknownDoctor'),
                    })
                  : t('patient.profile.noVisits')}
              </p>
              {lastVisit?.appointment?.reason_for_visit && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('patient.profile.lastVisitReason', {
                    reason: lastVisit.appointment.reason_for_visit,
                  })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfileSummary;
