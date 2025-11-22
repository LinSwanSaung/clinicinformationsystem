import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Activity,
  RefreshCw,
  Phone,
  Home,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/layout/PageLayout';
import { queueService } from '@/features/queue';

// Animation variants (reserved for future use)
const _pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const _containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const _itemVariants = {
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

const _cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      type: 'spring',
      stiffness: 100,
    },
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: { scale: 0.98 },
};

const DoctorQueueDetailPage = () => {
  const navigate = useNavigate();
  const { doctorId } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadQueueData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get queue status from our backend
      const queueStatus = await queueService.getDoctorQueueStatus(doctorId);
      setQueueData(queueStatus);

      // Get all doctors to find the specific doctor info
      const doctorsResponse = await queueService.getAllDoctorsQueueStatus();

      if (doctorsResponse && doctorsResponse.data) {
        const foundDoctor = doctorsResponse.data.find((d) => d.id === doctorId);

        if (foundDoctor) {
          setDoctor(foundDoctor);
        } else {
          setError('Doctor not found');
        }
      } else {
        setError('Unable to load doctor information');
      }
    } catch (err) {
      setError(err.message || 'Failed to load queue data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueueData();
  }, [doctorId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'called':
        return 'bg-green-100 text-green-800'; // Changed to green for "Waiting for Doctor"
      case 'serving':
        return 'bg-blue-100 text-blue-800'; // Changed to blue for "In Consultation"
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'waiting':
        return 'Waiting';
      case 'called':
        return 'Waiting for Doctor';
      case 'serving':
        return 'In Consultation';
      case 'completed':
        return 'Completed';
      case 'missed':
        return 'Missed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4" />;
      case 'called':
        return <Phone className="h-4 w-4" />;
      case 'serving':
        return <Activity className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'missed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Doctor Queue Detail" subtitle="Loading queue information...">
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="mb-4 h-6 w-1/4 rounded bg-gray-200"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-16 rounded bg-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Doctor Queue Detail" subtitle="Error loading queue data">
        <div className="py-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="mb-4 text-red-600">{error}</p>
          <div className="space-x-2">
            <Button onClick={loadQueueData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate('/receptionist/live-queue')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Live Queue
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!doctor) {
    return (
      <PageLayout title="Doctor Queue" subtitle="Doctor not found">
        <div className="p-8 text-center">
          <div className="text-xl text-muted-foreground">Doctor not found</div>
          <Button onClick={() => navigate('/receptionist/live-queue')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Live Queue
          </Button>
        </div>
      </PageLayout>
    );
  }

  const tokens = queueData?.data?.tokens || [];
  const waitingTokens = tokens.filter((t) => t.status === 'waiting');
  const servingTokens = tokens.filter((t) => t.status === 'serving');
  const completedTokens = tokens.filter((t) => t.status === 'completed');
  const currentConsultation = servingTokens[0];

  // Custom breadcrumb component
  const CustomBreadcrumbs = () => (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex items-center space-x-2 text-sm text-muted-foreground"
      role="navigation"
      aria-label="Breadcrumb"
    >
      <motion.button
        onClick={() => navigate('/receptionist/dashboard')}
        className="flex cursor-pointer items-center gap-1 transition-colors duration-200 hover:text-foreground"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Home className="h-4 w-4" />
        <span>Dashboard</span>
      </motion.button>

      <ChevronRight className="text-muted-foreground/50 h-4 w-4" />

      <motion.button
        onClick={() => navigate('/receptionist/live-queue')}
        className="flex cursor-pointer items-center gap-1 transition-colors duration-200 hover:text-foreground"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span>Queue</span>
      </motion.button>

      <ChevronRight className="text-muted-foreground/50 h-4 w-4" />

      <span className="font-medium text-foreground">
        {doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Doctor Queue'}
      </span>
    </motion.nav>
  );

  return (
    <PageLayout
      title={doctor ? `Dr. ${doctor.first_name} ${doctor.last_name} - Queue` : 'Doctor Queue'}
      subtitle={`${tokens.length} patients in queue today`}
      customBreadcrumbs={<CustomBreadcrumbs />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/receptionist/live-queue')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Live Queue
          </Button>

          <Button onClick={loadQueueData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{tokens.length}</div>
              <p className="text-sm text-muted-foreground">Total Patients</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">{waitingTokens.length}</div>
              <p className="text-sm text-muted-foreground">Waiting</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{servingTokens.length}</div>
              <p className="text-sm text-muted-foreground">In Consultation</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-gray-600">{completedTokens.length}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {currentConsultation && (
          <Card className={currentConsultation.priority >= 4 ? 'border-2 border-red-300' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Currently Consulting
                {currentConsultation.priority >= 4 && <span className="text-xl">⭐</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`flex items-center justify-between rounded-lg p-4 ${
                  currentConsultation.priority >= 4 ? 'bg-red-50' : 'bg-green-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${
                      currentConsultation.priority >= 4
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {currentConsultation.priority >= 4 && <span className="mr-1 text-xs">⭐</span>}
                    {currentConsultation.token_number}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {currentConsultation.priority >= 4 && <span className="mr-1">⭐</span>}
                      {currentConsultation.patient?.first_name}{' '}
                      {currentConsultation.patient?.last_name}
                      {currentConsultation.priority >= 4 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          PRIORITY
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Patient ID: {currentConsultation.patient?.patient_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Started:{' '}
                      {currentConsultation.served_at
                        ? new Date(currentConsultation.served_at).toLocaleTimeString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    currentConsultation.priority >= 4
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }
                >
                  <Activity className="mr-1 h-4 w-4" />
                  In Progress
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Queue Details</CardTitle>
          </CardHeader>
          <CardContent>
            {tokens.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No patients in queue today
              </div>
            ) : (
              <div className="space-y-3">
                {tokens.map((token, index) => (
                  <motion.div
                    key={token.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 ${
                      token.priority >= 4 ? 'border-2 border-red-300 bg-red-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                          token.priority >= 4
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {token.priority >= 4 && <span className="mr-1 text-sm">⭐</span>}
                        {token.token_number}
                      </div>

                      <div>
                        <h3 className="flex items-center gap-2 font-medium">
                          {token.priority >= 4 && <span className="text-lg">⭐</span>}
                          {token.patient?.first_name} {token.patient?.last_name}
                          {token.priority >= 4 && (
                            <Badge className="border-red-300 bg-red-100 text-red-700">
                              PRIORITY
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Patient ID: {token.patient?.patient_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Issued: {new Date(token.issued_time).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(token.status)}>
                        {getStatusIcon(token.status)}
                        <span className="ml-1">{getStatusText(token.status)}</span>
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default DoctorQueueDetailPage;
