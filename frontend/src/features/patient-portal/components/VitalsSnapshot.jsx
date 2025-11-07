import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/library/feedback/ErrorState';
import { Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const VitalsSkeleton = () => (
  <Card className="p-6">
    <Skeleton className="h-6 w-48 mb-6" />
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1, 2, 3].map((idx) => (
        <div key={idx} className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ))}
    </div>
  </Card>
);

const coerceNumber = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundValue = (value, decimals = 1) =>
  typeof value === 'number' ? Math.round((value + Number.EPSILON) * Math.pow(10, decimals)) / Math.pow(10, decimals) : value;

const prepareVitalSeries = (visits = []) => {
  const sorted = [...visits]
    .filter((visit) => visit?.visit_date && visit?.vitals)
    .sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date))
    .slice(-6); // Last 6 data points

  console.log('[VitalsSnapshot] Total visits with vitals:', sorted.length);

  const chartData = sorted.map((visit) => {
    const vitals = visit.vitals;
    const date = new Date(visit.visit_date);
    
    const dataPoint = {
      t: date.getTime(), // timestamp for X-axis
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      systolic: coerceNumber(vitals.blood_pressure_systolic),
      diastolic: coerceNumber(vitals.blood_pressure_diastolic),
      heartRate: coerceNumber(vitals.heart_rate),
      temperature: coerceNumber(vitals.temperature),
      temperatureUnit: vitals.temperature_unit || '°C',
      weight: coerceNumber(vitals.weight),
      weightUnit: vitals.weight_unit || 'kg',
      recordedAt: visit.vitals.recorded_at || visit.visit_date
    };
    
    console.log('[VitalsSnapshot] Data point:', dataPoint);
    return dataPoint;
  });

  const latest = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const previous = chartData.length > 1 ? chartData[chartData.length - 2] : null;

  return { chartData, latest, previous };
};

const calculateDelta = (current, previous, isGoodWhenLower = false) => {
  if (current === null || previous === null) return { value: null, indicator: null, color: 'text-muted-foreground' };
  
  const delta = current - previous;
  const absDelta = Math.abs(delta);
  
  if (absDelta < 0.1) return { value: 0, indicator: <Minus className="h-3 w-3" />, color: 'text-muted-foreground' };
  
  const isIncrease = delta > 0;
  let color = 'text-muted-foreground';
  
  if (isGoodWhenLower) {
    color = isIncrease ? 'text-destructive' : 'text-green-600';
  } else {
    color = isIncrease ? 'text-green-600' : 'text-destructive';
  }
  
  const icon = isIncrease ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  
  return { value: roundValue(delta, 1), indicator: icon, color };
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const date = new Date(data.recordedAt).toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-foreground mb-2">{date}</p>
      {payload.map((entry, index) => {
        const unit = entry.unit || '';
        return (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold text-foreground">{entry.value}{unit}</span>
          </div>
        );
      })}
    </div>
  );
};

const VitalCard = React.memo(({ title, value, unit, delta, chartData, dataKey, color }) => {
  // Check if we have enough data points
  const validValues = useMemo(() => {
    if (!chartData || chartData.length < 1) return [];
    const values = chartData.map(d => d[dataKey]).filter(v => v !== null && Number.isFinite(v));
    console.log(`[VitalCard ${title}] Raw data:`, chartData);
    console.log(`[VitalCard ${title}] dataKey: ${dataKey}, values:`, values);
    return values;
  }, [chartData, dataKey, title]);

  const hasValidData = validValues.length >= 1;
  const showDots = validValues.length <= 3; // Show dots when we have 3 or fewer points

  const computedDomain = useMemo(() => {
    if (!hasValidData) return [0, 100];
    
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    
    console.log(`[VitalCard ${title}] Domain calc - min: ${min}, max: ${max}`);
    
    // Handle flat line case (single point or all same values)
    if (min === max) {
      return [min - 1, max + 1];
    }
    
    const range = max - min;
    const padding = range * 0.1; // 10% padding
    
    return [
      (dataMin) => Math.floor((dataMin || min) - padding),
      (dataMax) => Math.ceil((dataMax || max) + padding)
    ];
  }, [validValues, hasValidData, title]);

  console.log(`[VitalCard ${title}] validValues:`, validValues.length, 'showDots:', showDots, 'hasValidData:', hasValidData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group"
    >
      <Card className="h-full border-border/60 hover:border-border transition-colors">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="space-y-1">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" tabIndex={0}>
              {title}
            </h3>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground tabular-nums" aria-label={`${value} ${unit}`}>
                  {value !== null && value !== undefined ? value : '—'}
                </span>
                <span className="text-sm font-medium text-muted-foreground">{unit}</span>
              </div>
              {delta && delta.value !== null && (
                <div className={`flex items-center gap-1 text-xs font-medium ${delta.color}`}>
                  {delta.indicator}
                  <span className="tabular-nums">{Math.abs(delta.value)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="h-[180px]" role="img" aria-label={`${title} trend chart`}>
            {!hasValidData ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground border border-dashed border-muted-foreground/30 rounded-md">
                Not enough data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    opacity={0.2}
                    vertical={false}
                  />
                  
                  <XAxis 
                    dataKey="t"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(timestamp) => {
                      const date = new Date(timestamp);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  
                  <YAxis 
                    domain={computedDomain}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                  />
                  
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  
                  <Line
                    type="monotone"
                    dataKey={dataKey}
                    name={title}
                    stroke="#2563eb"
                    strokeWidth={3}
                    strokeOpacity={1}
                    dot={showDots ? { r: 4, fill: '#2563eb', strokeWidth: 0 } : false}
                    activeDot={{ r: 6, fill: '#2563eb', stroke: 'white', strokeWidth: 2 }}
                    connectNulls
                    unit={` ${unit}`}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

VitalCard.displayName = 'VitalCard';

const BloodPressureCard = React.memo(({ chartData, latest, previous }) => {
  const { t } = useTranslation();
  
  const sysValue = latest?.systolic !== null ? latest.systolic : null;
  const diaValue = latest?.diastolic !== null ? latest.diastolic : null;
  const displayValue = sysValue !== null && diaValue !== null ? `${sysValue}/${diaValue}` : '—';
  
  const sysDelta = calculateDelta(latest?.systolic, previous?.systolic, true);
  const diaDelta = calculateDelta(latest?.diastolic, previous?.diastolic, true);
  
  const combinedDelta = useMemo(() => {
    if (sysDelta.value === null && diaDelta.value === null) return null;
    
    const sysAbs = Math.abs(sysDelta.value || 0);
    const diaAbs = Math.abs(diaDelta.value || 0);
    const dominantDelta = sysAbs > diaAbs ? sysDelta : diaDelta;
    
    return dominantDelta;
  }, [sysDelta, diaDelta]);

  const validValues = useMemo(() => {
    if (!chartData || chartData.length < 1) return [];
    const allValues = [];
    chartData.forEach(d => {
      if (d.systolic !== null && Number.isFinite(d.systolic)) allValues.push(d.systolic);
      if (d.diastolic !== null && Number.isFinite(d.diastolic)) allValues.push(d.diastolic);
    });
    console.log('[BloodPressureCard] Chart data:', chartData);
    console.log('[BloodPressureCard] Valid BP values:', allValues);
    return allValues;
  }, [chartData]);

  const hasValidData = validValues.length >= 1;
  const showDots = validValues.length <= 6; // Show dots when we have 3 or fewer readings (6 values max for 2 lines)

  console.log('[BloodPressureCard] hasValidData:', hasValidData, 'showDots:', showDots, 'validValues count:', validValues.length);

  const computedDomain = useMemo(() => {
    if (!hasValidData) return [40, 160];
    
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    
    if (min === max) {
      return [min - 10, max + 10];
    }
    
    const range = max - min;
    const padding = range * 0.1;
    
    return [
      (dataMin) => Math.floor((dataMin || min) - padding),
      (dataMax) => Math.ceil((dataMax || max) + padding)
    ];
  }, [validValues, hasValidData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group"
    >
      <Card className="h-full border-border/60 hover:border-border transition-colors">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="space-y-1">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" tabIndex={0}>
              {t('patient.vitalsSnapshot.bloodPressure')}
            </h3>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground tabular-nums" aria-label={`${displayValue} mmHg`}>
                  {displayValue}
                </span>
                <span className="text-sm font-medium text-muted-foreground">mmHg</span>
              </div>
              {combinedDelta && combinedDelta.value !== null && (
                <div className={`flex items-center gap-1 text-xs font-medium ${combinedDelta.color}`}>
                  {combinedDelta.indicator}
                  <span className="tabular-nums">{Math.abs(combinedDelta.value)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dual-line Chart */}
          <div className="h-[180px]" role="img" aria-label="Blood pressure trend chart">
            {!hasValidData ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground border border-dashed border-muted-foreground/30 rounded-md">
                Not enough data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData} 
                  margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    opacity={0.2}
                    vertical={false}
                  />
                  
                  <XAxis 
                    dataKey="t"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(timestamp) => {
                      const date = new Date(timestamp);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  
                  <YAxis 
                    domain={computedDomain}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                  />
                  
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  
                  <Legend 
                    verticalAlign="top" 
                    height={20}
                    iconType="line"
                    wrapperStyle={{ fontSize: '10px', paddingBottom: '4px' }}
                  />
                  
                  <Line
                    type="monotone"
                    dataKey="systolic"
                    name="Systolic"
                    stroke="#ef4444"
                    strokeWidth={3}
                    strokeOpacity={1}
                    dot={showDots ? { r: 4, fill: '#ef4444', strokeWidth: 0 } : false}
                    activeDot={{ r: 6, fill: '#ef4444', stroke: 'white', strokeWidth: 2 }}
                    connectNulls
                    unit=" mmHg"
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolic"
                    name="Diastolic"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    strokeOpacity={1}
                    dot={showDots ? { r: 4, fill: '#3b82f6', strokeWidth: 0 } : false}
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }}
                    connectNulls
                    unit=" mmHg"
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

BloodPressureCard.displayName = 'BloodPressureCard';

const VitalsSnapshot = ({ visits, loading, error, onRetry }) => {
  const { t } = useTranslation();

  const { chartData, latest, previous } = useMemo(() => prepareVitalSeries(visits), [visits]);

  const hrDelta = useMemo(() => calculateDelta(latest?.heartRate, previous?.heartRate, false), [latest, previous]);
  const tempDelta = useMemo(() => calculateDelta(latest?.temperature, previous?.temperature, true), [latest, previous]);
  const weightDelta = useMemo(() => calculateDelta(latest?.weight, previous?.weight, false), [latest, previous]);

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

  if (!visits?.length || !latest) {
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
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl font-semibold text-foreground">
              {t('patient.vitalsSnapshot.title')}
            </CardTitle>
            {latest.recordedAt && (
              <p className="text-xs text-muted-foreground">
                {t('patient.vitalsSnapshot.latestRecorded', {
                  date: new Date(latest.recordedAt).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                })}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Blood Pressure - Special dual-line card */}
            <BloodPressureCard chartData={chartData} latest={latest} previous={previous} />

            {/* Heart Rate */}
            <VitalCard
              title={t('patient.vitalsSnapshot.heartRate')}
              value={latest.heartRate !== null ? latest.heartRate : null}
              unit="bpm"
              delta={hrDelta}
              chartData={chartData}
              dataKey="heartRate"
              color="hsl(var(--chart-3))"
            />

            {/* Temperature */}
            <VitalCard
              title={t('patient.vitalsSnapshot.temperature')}
              value={latest.temperature !== null ? roundValue(latest.temperature, 1) : null}
              unit={latest.temperatureUnit || '°C'}
              delta={tempDelta}
              chartData={chartData}
              dataKey="temperature"
              color="hsl(var(--chart-4))"
            />

            {/* Weight */}
            <VitalCard
              title={t('patient.vitalsSnapshot.weight')}
              value={latest.weight !== null ? roundValue(latest.weight, 1) : null}
              unit={latest.weightUnit || 'kg'}
              delta={weightDelta}
              chartData={chartData}
              dataKey="weight"
              color="hsl(var(--chart-5))"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VitalsSnapshot;
