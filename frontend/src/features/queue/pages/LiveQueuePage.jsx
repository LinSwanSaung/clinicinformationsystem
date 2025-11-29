import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  Search,
  Filter,
  X,
  RefreshCw,
  ChevronDown,
  Play,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageLayout from '@/components/layout/PageLayout';
import useDebounce from '@/hooks/useDebounce';
import { queueService, QueueDoctorCard } from '@/features/queue';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { POLLING_INTERVALS } from '@/constants/polling';
import { ROLES } from '@/constants/roles';
import { LoadingSpinner, EmptyState } from '@/components/library';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

const LiveQueuePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State management
  const [doctors, setDoctors] = useState([]);
  const [queueSummary, setQueueSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { user } = useAuth();

  // React Query: doctors + queue status polling
  const doctorsQuery = useQuery({
    queryKey: ['queue', 'allDoctors'],
    queryFn: () => queueService.getAllDoctorsQueueStatus(),
    enabled: !!user && user.role === ROLES.RECEPTIONIST,
    refetchInterval: autoRefresh ? POLLING_INTERVALS.QUEUE : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
  });

  // Derive state from query results
  useEffect(() => {
    if (doctorsQuery.isLoading) {
      setIsLoading(true);
      return;
    }
    if (doctorsQuery.error) {
      setError(doctorsQuery.error.message || 'Failed to load');
      setIsLoading(false);
      return;
    }
    const list = doctorsQuery.data?.data || [];
    setDoctors(list);
    const availableDoctors = list.filter((d) => d.status?.status !== 'unavailable');
    const summary = {
      totalDoctors: availableDoctors.length,
      activeDoctors: availableDoctors.filter((d) => d.queueStatus?.tokens?.length > 0).length,
      totalPatients: availableDoctors.reduce(
        (sum, d) => sum + (d.queueStatus?.tokens?.length || 0),
        0
      ),
      waitingPatients: availableDoctors.reduce((sum, d) => {
        const activeTokens =
          d.queueStatus?.tokens?.filter(
            (token) => token.status === 'waiting' || token.status === 'called'
          ) || [];
        return sum + activeTokens.length;
      }, 0),
      completedToday: availableDoctors.reduce((sum, d) => {
        const completedTokens =
          d.queueStatus?.tokens?.filter((token) => token.status === 'completed') || [];
        return sum + completedTokens.length;
      }, 0),
      busyDoctors: availableDoctors.filter((d) => {
        const servingTokens =
          d.queueStatus?.tokens?.filter((token) => token.status === 'serving') || [];
        return servingTokens.length > 0;
      }).length,
    };
    setQueueSummary(summary);
    setLastUpdated(new Date());
    setIsLoading(false);
    setIsRefreshing(false);
  }, [doctorsQuery.isLoading, doctorsQuery.error, doctorsQuery.data]);

  // Remove manual interval; handled by React Query via refetchInterval

  // Manual refresh
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await doctorsQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setShowFilters(false);
  };

  // Filter doctors based on search, status, and availability
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      // Filter out unavailable doctors completely
      if (doctor.status?.status === 'unavailable') {
        return false;
      }

      const matchesSearch =
        !debouncedSearchTerm ||
        doctor.first_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        doctor.last_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        doctor.specialty?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'available' && doctor.status?.canAcceptPatients) ||
        (statusFilter === 'busy' && doctor.status?.status === 'consulting') ||
        (statusFilter === 'has-queue' && doctor.queueStatus?.tokens?.length > 0);

      return matchesSearch && matchesStatus;
    });
  }, [doctors, debouncedSearchTerm, statusFilter]);

  // Navigate to doctor queue detail
  const handleViewDoctorQueue = (doctorId) => {
    navigate(`/receptionist/queue/${doctorId}`);
  };

  if (isLoading) {
    return (
      <PageLayout
        title={t('receptionist.liveQueue.title')}
        subtitle={t('receptionist.liveQueue.subtitle')}
      >
        <div className="py-12">
          <LoadingSpinner label={t('common.loading')} size="lg" />
        </div>
      </PageLayout>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants}>
      <PageLayout
        title={t('receptionist.liveQueue.title')}
        subtitle={t('receptionist.liveQueue.subtitle')}
        fullWidth
      >
        <div className="space-y-6 p-4 md:p-6">
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => setError(null)}
                    >
                      {t('receptionist.liveQueue.dismiss')}
                    </Button>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Queue Summary Cards */}
          {queueSummary && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
            >
              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {queueSummary.totalPatients || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('receptionist.liveQueue.totalPatients')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-yellow-100 p-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">
                          {queueSummary.waitingPatients || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('receptionist.liveQueue.waitingPatients')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-green-100 p-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {queueSummary.completedToday || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('receptionist.liveQueue.completedToday')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-100 p-2">
                        <Stethoscope className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {queueSummary.activeDoctors || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('receptionist.liveQueue.activeDoctors')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('receptionist.liveQueue.searchDoctors')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>

              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {t('receptionist.liveQueue.showFilters')}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>

              {(searchTerm || statusFilter !== 'all') && (
                <Button onClick={clearFilters} variant="outline" size="sm" className="gap-2">
                  <X className="h-4 w-4" />
                  {t('common.cancel')}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {t('receptionist.liveQueue.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>

              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {autoRefresh ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {autoRefresh
                  ? t('receptionist.liveQueue.stopAutoRefresh')
                  : t('receptionist.liveQueue.startAutoRefresh')}
              </Button>

              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {t('receptionist.liveQueue.refresh')}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('receptionist.liveQueue.status')}
                      </label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('receptionist.liveQueue.allStatuses')}
                          </SelectItem>
                          <SelectItem value="available">
                            {t('receptionist.liveQueue.available')}
                          </SelectItem>
                          <SelectItem value="busy">{t('receptionist.liveQueue.busy')}</SelectItem>
                          <SelectItem value="has-queue">
                            {t('receptionist.liveQueue.hasQueue')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Doctors Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {filteredDoctors.map((doctor) => (
                <QueueDoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onClick={(doctor) => handleViewDoctorQueue(doctor.id)}
                  buttonText={t('receptionist.liveQueue.viewQueue')}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty State */}
          {filteredDoctors.length === 0 && !isLoading && (
            <EmptyState
              title={t('receptionist.liveQueue.noDoctorsFound')}
              description={t('receptionist.liveQueue.noDoctorsDescription')}
              action={
                <Button onClick={clearFilters} variant="outline">
                  {t('receptionist.liveQueue.clearAllFilters')}
                </Button>
              }
              className="py-12"
            />
          )}
        </div>
      </PageLayout>
    </motion.div>
  );
};

export default LiveQueuePage;
