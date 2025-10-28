import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  Activity,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PageLayout from '@/components/PageLayout';
import useDebounce from '@/utils/useDebounce';
import queueService from '@/services/queueService';
import QueueDoctorCard from '@/components/QueueDoctorCard';
import PatientCard from '@/components/medical/PatientCard';

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

const NursePatientQueuePage = () => {
  const navigate = useNavigate();
  
  // State management
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshInterval = 15000; // 15 seconds for nurse interface
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load doctors and their queues
  const loadDoctorsData = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setError(null);

      const doctorsData = await queueService.getAllDoctorsQueueStatus();
      const doctors = doctorsData.data || [];
      setDoctors(doctors);
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
    loadDoctorsData();

    const interval = setInterval(() => {
      loadDoctorsData(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDoctorsData(false);
  };

  // Filter doctors based on search and those who have patients
  const filteredDoctors = doctors.filter(doctor => {
    // Only show doctors who have patients in queue or are currently consulting
    const hasPatients = doctor.queueStatus?.tokens?.length > 0;
    if (!hasPatients) return false;

    const matchesSearch = !debouncedSearchTerm || 
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
    const readyPatients = tokens.filter(token => 
      token.status === 'waiting' || token.status === 'called'
    ).length;
    const notReadyPatients = tokens.filter(token => 
      token.status === 'waiting' && !token.vitals_taken
    ).length;
    
    return {
      totalPatients: tokens.length,
      waitingPatients: readyPatients,
      completedToday: notReadyPatients // Reusing for "not ready" count
    };
  };

  // Render patients for selected doctor
  const renderPatients = () => {
    if (!selectedDoctor) return null;

    const tokens = selectedDoctor.queueStatus?.tokens || [];
    const patientsNeedingCare = tokens.filter(token => 
      token.status === 'waiting' || token.status === 'called'
    );

    return (
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        <PageLayout 
          title={`Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name} - Patients`}
          subtitle={`${patientsNeedingCare.length} patients need nursing care`}
        >
          <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={handleBackToDoctors}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Doctors
              </Button>
              
              <Button onClick={handleRefresh} variant="outline" className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Patients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                      conditions: token.patient?.conditions || []
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

            {patientsNeedingCare.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No patients need care</h3>
                <p className="text-muted-foreground">
                  All patients for Dr. {selectedDoctor.first_name} {selectedDoctor.last_name} are up to date
                </p>
              </div>
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
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
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <p className="text-red-600">{error}</p>
              <Button onClick={() => setError(null)} variant="outline" size="sm" className="mt-2">
                Dismiss
              </Button>
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
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No patients need care</h3>
              <p className="text-muted-foreground mb-4">
                All doctors' patients are currently up to date with nursing care
              </p>
            </motion.div>
          )}
        </div>
      </PageLayout>
    </motion.div>
  );
};

export default NursePatientQueuePage;