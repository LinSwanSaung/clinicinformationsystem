import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCw, UserCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageLayout from '@/components/PageLayout';
import useDebounce from '@/hooks/useDebounce';
import queueService from '@/services/queueService';
import QueueDoctorCard from '@/components/QueueDoctorCard';
import PatientCard from '@/components/medical/PatientCard';
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

const NursePatientQueuePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // React Query: doctors queue polling with auth/role guard
  const doctorsQuery = useQuery({
    queryKey: ['nurse', 'queue', 'doctors'],
    queryFn: () => queueService.getAllDoctorsQueueStatus(),
    enabled: !!user && user.role === ROLES.NURSE,
    refetchInterval: POLLING_INTERVALS.NURSE_QUEUE,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
  });

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
    setLastUpdated(new Date());
    setIsLoading(false);
    setIsRefreshing(false);
  }, [doctorsQuery.isLoading, doctorsQuery.error, doctorsQuery.data]);

  // Manual refresh
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await doctorsQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter doctors based on search and those who have patients
  const filteredDoctors = doctors.filter((doctor) => {
    // Only show doctors who have patients in queue or are currently consulting
    const hasPatients = doctor.queueStatus?.tokens?.length > 0;
    if (!hasPatients) {
      return false;
    }

    const matchesSearch =
      !debouncedSearchTerm ||
      doctor.first_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      doctor.last_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    return matchesSearch;
  });

  // Handle doctor selection to view patients
  const handleViewPatients = (doctor) => {
    setSelectedDoctor(doctor);
  };

  // Handle back to doctors list
  const handleBackToDoctors = () => {
    setSelectedDoctor(null);
  };

  // Get nurse-specific stats for doctor card
  const getNurseStats = (doctor) => {
    const tokens = doctor.queueStatus?.tokens || [];
    const readyPatients = tokens.filter(
      (token) => token.status === 'waiting' || token.status === 'called'
    ).length;
    const notReadyPatients = tokens.filter(
      (token) => token.status === 'waiting' && !token.vitals_taken
    ).length;

    return {
      totalPatients: tokens.length,
      waitingPatients: readyPatients,
      completedToday: notReadyPatients, // Reusing for "not ready" count
    };
  };

  // Render patients for selected doctor
  const renderPatients = () => {
    if (!selectedDoctor) {
      return null;
    }

    const tokens = selectedDoctor.queueStatus?.tokens || [];
    const patientsNeedingCare = tokens.filter(
      (token) => token.status === 'waiting' || token.status === 'called'
    );

    return (
      <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants}>
        <PageLayout
          title={`Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name} - Patients`}
          subtitle={`${patientsNeedingCare.length} patients need nursing care`}
        >
          <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleBackToDoctors} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Doctors
              </Button>

              <Button onClick={handleRefresh} variant="outline" className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Patients Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {patientsNeedingCare.map((token) => (
                  <PatientCard
                    key={token.id}
                    patient={{
                      id: token.patient?.id,
                      name: `${token.patient?.first_name} ${token.patient?.last_name}`,
                      age: token.patient?.age,
                      gender: token.patient?.gender,
                      tokenNumber: token.token_number,
                      status: token.status,
                      appointmentTime: token.issued_time,
                      vitals: token.vitals || {},
                      conditions: token.patient?.conditions || [],
                    }}
                    showVitalsButton={true}
                    onVitalsClick={(patient) => {
                      // Navigate to vitals recording
                      navigate(`/nurse/vitals/${patient.id}`);
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Empty State */}
            {patientsNeedingCare.length === 0 && (
              <EmptyState
                title="No patients need care"
                description="All patients are up to date with nursing care"
                className="py-12"
              />
            )}
          </div>
        </PageLayout>
      </motion.div>
    );
  };

  // Show patient view if doctor is selected
  if (selectedDoctor) {
    return renderPatients();
  }

  // Main doctors view
  if (isLoading) {
    return (
      <PageLayout title="Patient Care Management" subtitle="Loading doctors and patient queues...">
        <div className="py-12">
          <LoadingSpinner label="Loading queues..." size="lg" />
        </div>
      </PageLayout>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants}>
      <PageLayout
        title="Patient Care Management"
        subtitle="Monitor doctors' queues and provide nursing care"
        fullWidth
      >
        <div className="space-y-6 p-4 md:p-6">
          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-200 bg-red-50 p-4"
            >
              <p className="text-red-600">{error}</p>
              <Button onClick={() => setError(null)} variant="outline" size="sm" className="mt-2">
                Dismiss
              </Button>
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>

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
                  onClick={handleViewPatients}
                  buttonText="View Patients"
                  buttonIcon={UserCheck}
                  customStats={getNurseStats(doctor)}
                  showCurrentConsultation={true}
                  showNextInQueue={false}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty State */}
          {filteredDoctors.length === 0 && !isLoading && (
            <EmptyState
              title="No patients need care"
              description="All doctors' patients are currently up to date with nursing care"
              className="py-12"
            />
          )}
        </div>
      </PageLayout>
    </motion.div>
  );
};

export default NursePatientQueuePage;
