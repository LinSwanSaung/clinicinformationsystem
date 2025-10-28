import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Timer,
  Stethoscope,
  Activity,
  Search,
  Filter,
  X,
  RefreshCw,
  ChevronDown,
  Play,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageLayout from '@/components/PageLayout';
import useDebounce from '@/utils/useDebounce';
import queueService from '@/services/queueService';
import QueueDoctorCard from '@/components/QueueDoctorCard';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.3, 
      ease: "easeOut" 
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.4, 
      ease: "easeOut",
      type: "spring",
      stiffness: 100
    }
  },
  hover: { 
    y: -4,
    scale: 1.02,
    transition: { 
      duration: 0.2,
      ease: "easeOut"
    }
  },
  tap: { scale: 0.98 }
};

const LiveQueuePage = () => {
  const navigate = useNavigate();
  
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

  const refreshInterval = 10000; // 10 seconds
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load queue data
  const loadQueueData = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setError(null);

      // Load doctors with their queue status
      const doctorsData = await queueService.getAllDoctorsQueueStatus();

      const doctors = doctorsData.data || [];
      setDoctors(doctors);

      // Filter out unavailable doctors for summary calculation
      const availableDoctors = doctors.filter(d => d.status?.status !== 'unavailable');

      // Calculate summary from actual backend data structure
      const summary = {
        totalDoctors: availableDoctors.length, // Only count available doctors
        activeDoctors: availableDoctors.filter(d => d.queueStatus?.tokens?.length > 0).length,
        totalPatients: availableDoctors.reduce((sum, d) => sum + (d.queueStatus?.tokens?.length || 0), 0),
        waitingPatients: availableDoctors.reduce((sum, d) => {
          const activeTokens = d.queueStatus?.tokens?.filter(token => 
            token.status === 'waiting' || token.status === 'called'
          ) || [];
          return sum + activeTokens.length;
        }, 0),
        completedToday: availableDoctors.reduce((sum, d) => {
          const completedTokens = d.queueStatus?.tokens?.filter(token => token.status === 'completed') || [];
          return sum + completedTokens.length;
        }, 0),
        busyDoctors: availableDoctors.filter(d => {
          const servingTokens = d.queueStatus?.tokens?.filter(token => token.status === 'serving') || [];
          return servingTokens.length > 0;
        }).length
      };

      setQueueSummary(summary);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    loadQueueData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadQueueData(false);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadQueueData(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setShowFilters(false);
  };

  // Filter doctors based on search, status, and availability
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      // Filter out unavailable doctors completely
      if (doctor.status?.status === 'unavailable') {
        return false;
      }

      const matchesSearch = !debouncedSearchTerm || 
        doctor.first_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        doctor.last_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        doctor.specialty?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'available' && doctor.status?.canAcceptPatients) ||
        (statusFilter === 'busy' && doctor.status?.status === 'consulting') ||
        (statusFilter === 'has-queue' && doctor.queueStatus?.tokens?.length > 0);

      return matchesSearch && matchesStatus;
    });
  }, [doctors, debouncedSearchTerm, statusFilter]);

  // Get doctor status (now comes from the backend)
  const getDoctorStatus = (doctor) => {
    return doctor.status || {
      text: 'Unknown',
      color: 'bg-gray-100 text-gray-600',
      canAcceptPatients: false
    };
  };

  // Navigate to doctor queue detail
  const handleViewDoctorQueue = (doctorId) => {
    navigate(`/receptionist/queue/${doctorId}`);
  };

  if (isLoading) {
    return (
      <PageLayout title="Live Queue Management" subtitle="Monitor and manage patient queues in real-time">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      <PageLayout 
        title="Live Queue Management" 
        subtitle="Monitor and manage patient queues in real-time"
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
                      Dismiss
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{queueSummary.totalPatients || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Patients</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">{queueSummary.waitingPatients || 0}</p>
                        <p className="text-sm text-muted-foreground">Active Patients</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{queueSummary.completedToday || 0}</p>
                        <p className="text-sm text-muted-foreground">Completed Today</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Stethoscope className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{queueSummary.activeDoctors || 0}</p>
                        <p className="text-sm text-muted-foreground">Active Doctors</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>

              {(searchTerm || statusFilter !== 'all') && (
                <Button onClick={clearFilters} variant="outline" size="sm" className="gap-2">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
              
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {autoRefresh ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {autoRefresh ? 'Stop' : 'Start'} Auto-refresh
              </Button>

              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="busy">Busy</SelectItem>
                          <SelectItem value="has-queue">Has Queue</SelectItem>
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
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
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
                  buttonText="View Queue"
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty State */}
          {filteredDoctors.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No doctors found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            </motion.div>
          )}
        </div>
      </PageLayout>
    </motion.div>
  );
};

export default LiveQueuePage;