import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorState from '@/components/ErrorState';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

const VitalsSkeleton = () => (
  <Card className="p-6">
    <Skeleton className="h-6 w-48 mb-6" />
    <div className="space-y-4">
      {[0, 1, 2, 3].map((idx) => (
        <div key={idx} className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      ))}
    </div>
  </Card>
);

const getTrendIcon = (delta) => {
  if (delta > 1) return <TrendingUp className="h-4 w-4 text-red-500" aria-hidden="true" />;
  if (delta < -1) return <TrendingDown className="h-4 w-4 text-green-600" aria-hidden="true" />;
  return <Minus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
};

const roundValue = (value) =>
  typeof value === 'number' ? Math.round((value + Number.EPSILON) * 10) / 10 : value;

const coerceNumber = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const prepareVitalSeries = (visits = []) => {
  const sorted = [...visits]
    .filter((visit) => visit?.visit_date)
    .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))
    .slice(0, 5);

  const points = sorted
    .map((visit) => ({
      date: visit.visit_date,
      vitals: visit.vitals
    }))
    .reverse();

  const bpSeries = points.map(({ date, vitals }) => {
    const systolic = coerceNumber(vitals?.blood_pressure_systolic);
    const diastolic = coerceNumber(vitals?.blood_pressure_diastolic);
    return {
      date,
      display: systolic !== null && diastolic !== null ? `${systolic}/${diastolic}` : null,
      numeric: systolic
    };
  });

  const heartRateSeries = points.map(({ date, vitals }) => {
    const heartRate = coerceNumber(vitals?.heart_rate);
    return {
      date,
      display: heartRate !== null ? `${roundValue(heartRate)}` : null,
      numeric: heartRate
    };
  });

  const temperatureSeries = points.map(({ date, vitals }) => {
    const temperature = coerceNumber(vitals?.temperature);
    const unit = vitals?.temperature_unit ? vitals.temperature_unit : null;
    return {
      date,
      display: temperature !== null ? `${roundValue(temperature)}${unit ? ` ${unit}` : ''}` : null,
      numeric: temperature
    };
  });

  const weightSeries = points.map(({ date, vitals }) => {
    const weight = coerceNumber(vitals?.weight);
    const unit = vitals?.weight_unit ? vitals.weight_unit : null;
    return {
      date,
      display: weight !== null ? `${roundValue(weight)}${unit ? ` ${unit}` : ''}` : null,
      numeric: weight
    };
  });

  return {
    bp: bpSeries,
    hr: heartRateSeries,
    temp: temperatureSeries,
    weight: weightSeries,
    latestDate: points.length ? points[points.length - 1].date : null
  };
};

const Sparkline = ({ series, color = '#10b981' }) => {
  const numericPoints = series
    .map((point) => ({ ...point, numeric: coerceNumber(point.numeric) }))
    .filter((point) => point.numeric !== null);

  if (numericPoints.length < 2) {
    return null;
  }

  const width = 140;
  const height = 48;
  const values = numericPoints.map((point) => point.numeric);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (numericPoints.length - 1);

  const coordinates = numericPoints.map((point, idx) => {
    const x = idx * stepX;
    const y = height - ((point.numeric - min) / range) * height;
    return { x, y };
  });

  const pathD = coordinates
    .map((coord, idx) => `${idx === 0 ? 'M' : 'L'}${coord.x},${coord.y}`)
    .join(' ');

  const lastCoord = coordinates[coordinates.length - 1];

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastCoord.x} cy={lastCoord.y} r="3" fill={color} />
    </svg>
  );
};

const renderSeries = (series, unitSuffix, t, color) => {
  if (!series?.length) {
    return <span className="text-sm text-muted-foreground">{t('patient.vitalsSnapshot.notRecorded')}</span>;
  }

  const displayEntries = series.filter((point) => point.display !== null);
  if (!displayEntries.length) {
    return <span className="text-sm text-muted-foreground">{t('patient.vitalsSnapshot.notRecorded')}</span>;
  }

  const latestEntry = displayEntries[displayEntries.length - 1];
  const numericValues = series
    .map((point) => coerceNumber(point.numeric))
    .filter((value) => value !== null);

  const delta =
    numericValues.length >= 2
      ? numericValues[numericValues.length - 1] - numericValues[numericValues.length - 2]
      : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-foreground">
          {latestEntry.display !== null ? `${latestEntry.display}${unitSuffix}` : t('patient.vitalsSnapshot.notRecorded')}
        </span>
        {getTrendIcon(delta)}
      </div>
      <Sparkline series={series} color={color} />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {series.map((point, idx) => (
          <span key={`${point.date}-${idx}`} className="font-mono">
            {point.display !== null ? `${point.display}${unitSuffix}` : '--'}
          </span>
        ))}
      </div>
    </div>
  );
};

const VitalsSnapshot = ({ visits, loading, error, onRetry }) => {
  const { t } = useTranslation();

  const vitalSeries = useMemo(() => prepareVitalSeries(visits), [visits]);

  if (loading) {
    return <VitalsSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message={t('patient.vitalsSnapshot.errorTitle')}
        description={t('patient.vitalsSnapshot.errorDescription')}
        onRetry={onRetry}
      />
    );
  }

  if (!visits?.length) {
    return (
      <Card className="border border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            {t('patient.vitalsSnapshot.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/10 p-6 text-center space-y-3">
            <Activity className="h-8 w-8 mx-auto text-muted-foreground" aria-hidden="true" />
            <p className="text-base font-medium text-foreground">{t('patient.vitalsSnapshot.emptyTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('patient.vitalsSnapshot.emptyDescription')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">
              {t('patient.vitalsSnapshot.title')}
            </CardTitle>
            {vitalSeries?.latestDate && (
              <p className="text-sm text-muted-foreground">
                {t('patient.vitalsSnapshot.latestRecorded', {
                  date: new Date(vitalSeries.latestDate).toLocaleDateString()
                })}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
              <dt className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('patient.vitalsSnapshot.bloodPressure')}
              </dt>
              <dd>{renderSeries(vitalSeries.bp, ' mmHg', t, '#ef4444')}</dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
              <dt className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('patient.vitalsSnapshot.heartRate')}
              </dt>
              <dd>{renderSeries(vitalSeries.hr, ' bpm', t, '#3b82f6')}</dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
              <dt className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('patient.vitalsSnapshot.temperature')}
              </dt>
              <dd>{renderSeries(vitalSeries.temp, '', t, '#f97316')}</dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
              <dt className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('patient.vitalsSnapshot.weight')}
              </dt>
              <dd>{renderSeries(vitalSeries.weight, '', t, '#22c55e')}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VitalsSnapshot;


