import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorState from '@/components/ErrorState';
import { AlertTriangle, Pill, ActivitySquare, Stethoscope } from 'lucide-react';

const LatestVisitSkeleton = () => (
  <Card className="p-6">
    <Skeleton className="h-6 w-64 mb-4" />
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((col) => (
        <div key={col} className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  </Card>
);

const getDiagnosisSummary = (diagnoses, t) => {
  if (!diagnoses?.length) {
    return [
      {
        label: t('patient.latestVisit.notRecorded'),
        code: null
      }
    ];
  }
  return diagnoses.slice(0, 2).map((item) => ({
    label: item.diagnosis_name || t('patient.latestVisit.unknownDiagnosis'),
    code: item.diagnosis_code || t('patient.latestVisit.noCode')
  }));
};

const getMedicationSummary = (prescriptions, t) => {
  if (!prescriptions?.length) {
    return [
      {
        name: t('patient.latestVisit.notRecorded'),
        dose: null,
        frequency: null
      }
    ];
  }
  return prescriptions.slice(0, 2).map((rx) => ({
    id: rx.id,
    name: rx.medication_name || t('patient.latestVisit.unknownMedication'),
    dose: rx.dosage,
    frequency: rx.frequency
  }));
};

const evaluateVitals = (vitals) => {
  if (!vitals) return { fields: [], warnings: [] };
  const warnings = [];

  if (
    (vitals.blood_pressure_systolic && vitals.blood_pressure_systolic >= 140) ||
    (vitals.blood_pressure_diastolic && vitals.blood_pressure_diastolic >= 90)
  ) {
    warnings.push('bloodPressure');
  }

  if (vitals.heart_rate && (vitals.heart_rate >= 100 || vitals.heart_rate <= 55)) {
    warnings.push('heartRate');
  }

  if (vitals.temperature && vitals.temperature >= 38) {
    warnings.push('temperature');
  }

  return {
    warnings,
    fields: [
      {
        id: 'bp',
        label: 'BP',
        value:
          vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic
            ? `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg`
            : null
      },
      {
        id: 'hr',
        label: 'HR',
        value: vitals.heart_rate ? `${vitals.heart_rate} bpm` : null
      },
      {
        id: 'temp',
        label: 'Temp',
        value: vitals.temperature ? `${vitals.temperature}°${vitals.temperature_unit ?? 'C'}` : null
      },
      {
        id: 'weight',
        label: 'Weight',
        value: vitals.weight ? `${vitals.weight} ${vitals.weight_unit ?? 'kg'}` : null
      }
    ]
  };
};

const LatestVisitSummary = ({ visit, loading, error, onRetry }) => {
  const { t } = useTranslation();

  const visitDate = visit?.visit_date ? new Date(visit.visit_date) : null;

  const diagnoses = useMemo(() => getDiagnosisSummary(visit?.visit_diagnoses, t), [visit, t]);
  const medications = useMemo(() => getMedicationSummary(visit?.prescriptions, t), [visit, t]);
  const vitalInfo = useMemo(() => evaluateVitals(visit?.vitals), [visit]);

  if (loading) {
    return <LatestVisitSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message={t('patient.latestVisit.errorTitle')}
        description={t('patient.latestVisit.errorDescription')}
        onRetry={onRetry}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">
              {t('patient.latestVisit.title')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {visitDate
                ? t('patient.latestVisit.subtitle', {
                    date: visitDate.toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }),
                    doctor: visit?.doctor_name ?? t('patient.latestVisit.unknownDoctor')
                  })
                : t('patient.latestVisit.noVisits')}
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {visit?.status ? t(`latestVisit.status.${visit.status}`, { defaultValue: visit.status }) : t('patient.latestVisit.status.unknown')}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-3">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
              <Stethoscope className="h-4 w-4" aria-hidden="true" />
              <span>{t('patient.latestVisit.diagnosesHeading')}</span>
            </div>
            <ul className="space-y-2">
              {diagnoses.map((item, idx) => (
                <li key={idx} className="rounded-md border border-border/60 bg-muted/10 p-3">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  {item.code && <p className="text-xs text-muted-foreground">{item.code}</p>}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
              <Pill className="h-4 w-4" aria-hidden="true" />
              <span>{t('patient.latestVisit.medicationsHeading')}</span>
            </div>
            <ul className="space-y-2">
              {medications.map((rx, idx) => (
                <li key={rx.id ?? idx} className="rounded-md border border-border/60 bg-muted/10 p-3">
                  <p className="text-sm font-semibold text-foreground">{rx.name}</p>
                  {rx.dose || rx.frequency ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {[rx.dose, rx.frequency].filter(Boolean).join(' · ')}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {visit?.prescriptions?.length > 2 && (
              <button
                type="button"
                className="text-sm text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded"
              >
                {t('patient.latestVisit.viewAllMeds')}
              </button>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
              <ActivitySquare className="h-4 w-4" aria-hidden="true" />
              <span>{t('patient.latestVisit.vitalsHeading')}</span>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/10 p-3 space-y-3">
              {vitalInfo.fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {field.label}
                  </span>
                  <span className="text-sm text-foreground">
                    {field.value ?? t('patient.latestVisit.notRecorded')}
                  </span>
                </div>
              ))}
              <Separator />
              {vitalInfo.warnings.length > 0 ? (
                <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-900">
                  <AlertTriangle className="h-4 w-4 mt-0.5" aria-hidden="true" />
                  <span>{t('patient.latestVisit.vitalsWarning')}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t('patient.latestVisit.vitalsNormal')}
                </p>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LatestVisitSummary;


