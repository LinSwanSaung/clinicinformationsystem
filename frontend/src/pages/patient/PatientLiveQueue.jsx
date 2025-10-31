import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  AlertCircle,
  Timer,
  Stethoscope,
  Activity,
  RefreshCw,
  CheckCircle,
  ArrowLeft,
  UserCheck,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageLayout from '@/components/PageLayout';
import patientPortalService from '@/services/patientPortalService';
import queueService from '@/services/queueService';
import clinicSettingsService from '@/services/clinicSettingsService';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const PatientLiveQueue = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [queueStatus, setQueueStatus] = useState(null);
  const [doctorQueue, setDoctorQueue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [consultationDuration, setConsultationDuration] = useState(15); // Default 15 minutes

  const refreshInterval = 10000; // 10 seconds

  // Load clinic settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const duration = await clinicSettingsService.getConsultationDuration();
      setConsultationDuration(duration);
    };
    loadSettings();
  }, []);

  // Load patient's queue status
  const loadQueueStatus = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setError(null);

      // Get patient's current queue status
      const response = await patientPortalService.getQueueStatus();
      const status = response?.data || response;
      
      setQueueStatus(status);

      // If patient is in queue, load the doctor's full queue status
      if (status.token && status.token.doctor_id) {
        const queueDate = status.token.issued_date || new Date().toISOString().split('T')[0];
        const doctorQueueResponse = await queueService.getDoctorQueueStatus(
          status.token.doctor_id,
          queueDate
        );
        setDoctorQueue(doctorQueueResponse?.data || doctorQueueResponse);
      } else {
        setDoctorQueue(null);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load queue status:', err);
      setError(err.message || 'Failed to load queue status');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadQueueStatus();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadQueueStatus(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Manual refresh
  const handleRefresh = () => {
    loadQueueStatus(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-blue-500';
      case 'called':
        return 'bg-yellow-500';
      case 'serving':
        return 'bg-green-500 animate-pulse';
      case 'completed':
        return 'bg-gray-400';
      case 'missed':
        return 'bg-red-500';
      case 'delayed':
        return 'bg-orange-400';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'waiting':
        return t('patient.liveQueue.waitingInQueue');
      case 'called':
        return t('patient.liveQueue.readyProceed');
      case 'serving':
        return t('patient.liveQueue.inConsultation');
      case 'completed':
        return t('patient.liveQueue.consultationComplete');
      case 'missed':
        return t('patient.liveQueue.missed');
      case 'delayed':
        return t('patient.liveQueue.delayed');
      default:
        return t('patient.liveQueue.unknown');
    }
  };

  const formatWaitTime = (minutes) => {
    if (!minutes || minutes < 0) return t('patient.liveQueue.unknown');
    if (minutes === 0) return t('patient.liveQueue.now');
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  if (isLoading) {
    return (
      <PageLayout
        title={t('patient.liveQueue.title')}
        subtitle={t('patient.liveQueue.subtitle')}
      >
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </PageLayout>
    );
  }

  const token = queueStatus?.token;
  const position = queueStatus?.position;
  const isInQueue = Boolean(token);

  // Calculate estimated wait based on clinic settings and queue position
  const calculateEstimatedWait = () => {
    if (!position || position <= 0) return 0;
    // If currently being served, wait time is 0
    if (token?.status === 'serving' || token?.status === 'called') return 0;
    // Calculate: consultation time * (people ahead in queue)
    return consultationDuration * (position - 1);
  };

  const estimatedWait = calculateEstimatedWait();

  // Get current token being consulted
  const getCurrentToken = () => {
    if (!doctorQueue?.tokens) return null;
    return doctorQueue.tokens.find(t => t.status === 'serving');
  };

  const currentToken = getCurrentToken();

  return (
    <PageLayout
      title={t('patient.liveQueue.title')}
      subtitle={t('patient.liveQueue.subtitle')}
    >
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-6"
      >
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate('/patient/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('patient.liveQueue.backToDashboard')}
        </Button>

        {/* Auto-refresh Toggle and Last Updated */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{t('patient.liveQueue.lastUpdated')}: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-pulse" />
                  {t('patient.liveQueue.autoRefreshOn')}
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  {t('patient.liveQueue.autoRefreshOff')}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t('patient.liveQueue.refresh')}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isInQueue ? (
          /* Not in Queue State */
          <Card className="border-2 border-dashed border-muted-foreground/30">
            <CardContent className="pt-10 pb-10 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-6">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{t('patient.liveQueue.notInQueue')}</h3>
                  <p className="text-muted-foreground max-w-md">
                    {t('patient.liveQueue.notInQueueMessage')}
                  </p>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button onClick={() => navigate('/patient/dashboard')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('patient.liveQueue.viewAppointments')}
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/patient/medical-records')}>
                    {t('patient.liveQueue.viewMedicalRecords')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* In Queue State */
          <>
            {/* Current Token Being Consulted */}
            {currentToken && (
              <Card className="border-2 border-blue-500/50 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Activity className="h-5 w-5 animate-pulse" />
                    {t('patient.liveQueue.currentlyConsulting')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('patient.liveQueue.doctorNowSeeing')}</p>
                      <div className="text-3xl font-bold text-blue-600">
                        Token #{currentToken.token_number}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">{t('patient.liveQueue.patient')}</p>
                      <p className="text-lg font-semibold">{currentToken.patient_name || t('patient.liveQueue.anonymous')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Your Status Card */}
            <Card className="border-2 border-primary/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{t('patient.liveQueue.yourQueueStatus')}</CardTitle>
                  <Badge className={`${getStatusColor(token.status)} text-white px-4 py-1 text-sm`}>
                    {getStatusLabel(token.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Token Number */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserCheck className="h-4 w-4" />
                      <span className="text-sm font-medium">{t('patient.liveQueue.tokenNumber')}</span>
                    </div>
                    <div className="text-4xl font-bold text-primary">
                      #{token.token_number}
                    </div>
                  </div>

                  {/* Current Token / Now Serving */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm font-medium">{t('patient.liveQueue.nowServing')}</span>
                    </div>
                    <div className="text-4xl font-bold">
                      {currentToken ? (
                        <>
                          #{currentToken.token_number}
                        </>
                      ) : (
                        <span className="text-2xl text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  {/* Estimated Wait */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span className="text-sm font-medium">{t('patient.liveQueue.estimatedWait')}</span>
                    </div>
                    {position === 1 || estimatedWait === 0 ? (
                      <div className="text-2xl font-bold text-green-600">
                        {t('patient.liveQueue.youreUpNext')}
                      </div>
                    ) : (
                      <div className="text-4xl font-bold">
                        {formatWaitTime(estimatedWait)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor Information */}
                {token.doctor_name && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-3">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('patient.liveQueue.consultingWith')}</p>
                        <p className="text-lg font-semibold">{token.doctor_name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status-specific messages */}
                {token.status === 'called' && (
                  <Alert className="mt-6 border-yellow-500 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>{t('patient.liveQueue.proceedNow')}</strong> {t('patient.liveQueue.doctorReady')}
                    </AlertDescription>
                  </Alert>
                )}

                {token.status === 'serving' && (
                  <Alert className="mt-6 border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {t('patient.liveQueue.consultationInProgress')}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Doctor's Queue Overview */}
            {doctorQueue && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('patient.liveQueue.queueOverview')}</CardTitle>
                  <CardDescription>
                    {t('patient.liveQueue.currentStatusOf')} {token.doctor_name}{t('patient.liveQueue.sQueue')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">{t('patient.liveQueue.totalInQueue')}</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {doctorQueue.tokens?.filter(t => t.status !== 'completed' && t.status !== 'missed').length || 0}
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{t('patient.liveQueue.waiting')}</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {doctorQueue.tokens?.filter(t => t.status === 'waiting').length || 0}
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm">{t('patient.liveQueue.inProgress')}</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {doctorQueue.tokens?.filter(t => t.status === 'serving').length || 0}
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">{t('patient.liveQueue.completedToday')}</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {doctorQueue.tokens?.filter(t => t.status === 'completed').length || 0}
                      </div>
                    </div>
                  </div>

                  {/* Live Queue List */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">{t('patient.liveQueue.liveQueue')}</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {doctorQueue.tokens
                        ?.filter(t => t.status !== 'completed' && t.status !== 'missed')
                        .sort((a, b) => a.token_number - b.token_number)
                        .map((queueToken) => {
                          const isYourToken = queueToken.id === token?.id;
                          return (
                            <div
                              key={queueToken.id}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                isYourToken 
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                  : 'border-border hover:border-primary/30'
                              } ${queueToken.status === 'serving' ? 'bg-blue-50 border-blue-300' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`text-xl font-bold ${
                                  isYourToken ? 'text-primary' : 
                                  queueToken.status === 'serving' ? 'text-blue-600' :
                                  'text-muted-foreground'
                                }`}>
                                  #{queueToken.token_number}
                                </div>
                                <div>
                                  <p className={`font-medium ${isYourToken ? 'text-primary' : ''}`}>
                                    {isYourToken ? t('patient.liveQueue.you') : (queueToken.patient_name || t('patient.liveQueue.patient'))}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {queueToken.visit_reason || t('patient.liveQueue.generalConsultation')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={`${getStatusColor(queueToken.status)} text-white`}
                                  variant="secondary"
                                >
                                  {getStatusLabel(queueToken.status)}
                                </Badge>
                                {isYourToken && (
                                  <Badge variant="outline" className="border-primary text-primary">
                                    {t('patient.liveQueue.you')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {doctorQueue.average_consultation_time && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Timer className="h-4 w-4" />
                        <span>
                          {t('patient.liveQueue.averageConsultationTime')}: <strong>{doctorQueue.average_consultation_time} {t('patient.liveQueue.minutes')}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </motion.div>
    </PageLayout>
  );
};

export default PatientLiveQueue;
