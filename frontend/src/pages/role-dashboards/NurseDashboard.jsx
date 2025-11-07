import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { QueueDoctorCard } from '@/features/queue';
import { PatientCard } from '@/features/patients';
import { SearchBar, LoadingSpinner, EmptyState } from '@/components/library';
import { vitalsService } from '@/features/medical';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Search, 
  FileText,
  Users,
  Clock,
  Activity,
  Eye,
  UserCog,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import doctorService from '@/services/doctorService';
import { queueService } from '@/features/queue';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/constants/roles';
import { POLLING_INTERVALS } from '@/constants/polling';

/**
 * Helper function to fetch appropriate vitals for a token
 * Uses the token's visit_id to get vitals for that specific visit only
 */
const fetchTokenVitals = async (token) => {
  try {
    const patientId = token.patient?.id || token.patient_id;
    const visitId = token.visit_id || token.current_visit_id;
    
    console.log(`🔍 [NURSE] Fetching vitals - Token #${token.token_number}, PatientID: ${patientId}, VisitID: ${visitId}`);
    console.log(`🔍 [NURSE] Token object keys:`, Object.keys(token));
    console.log(`🔍 [NURSE] Has visit_id property?`, 'visit_id' in token, 'Value:', token.visit_id);
    
    if (!visitId) {
      console.log(`❌ [NURSE] Token #${token.token_number} has no visit_id - treating as fresh visit`);
      return null;
    }
    
    // Fetch vitals for this specific visit only
    try {
      const vitalsResponse = await vitalsService.getVisitVitals(visitId);
      console.log(`📊 [NURSE] Vitals API response for visit ${visitId}:`, vitalsResponse);
      
      // Check if we have actual vitals data (not empty array)
      if (vitalsResponse.success && vitalsResponse.data && vitalsResponse.data.length > 0) {
        console.log(`✅ [NURSE] Found vitals for visit ${visitId}:`, vitalsResponse.data[0]);
        return vitalsResponse.data[0]; // Return first vitals record
      }
      console.log(`❌ [NURSE] No vitals found for visit ${visitId} - showing "Add Vitals & Notes"`);
    } catch (error) {
      console.error('[NURSE] Failed to fetch visit vitals:', error);
    }
    
    // No vitals for this visit - return null to show "Add Vitals & Notes"
    return null;
  } catch (error) {
    console.error('[NURSE] Failed to fetch vitals for token:', token.id, error);
    return null;
  }
};

const NurseDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all'); // New status filter state
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isUserActive, setIsUserActive] = useState(false); // Track user activity
  const [queueStats, setQueueStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    totalPatients: 0,
    waitingPatients: 0
  });

  // React Query: Poll doctors queue with auth/role guard and pause on activity
  const doctorsQuery = useQuery({
    queryKey: ['nurse', 'doctorsQueue'],
    queryFn: () => queueService.getAllDoctorsQueueStatus(),
    enabled: !!user && user.role === ROLES.NURSE && !isUserActive,
    refetchInterval: isUserActive ? false : POLLING_INTERVALS.DASHBOARD,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (doctorsQuery.isLoading) {
      setLoading(true);
      return;
    }
    if (doctorsQuery.error) {
      console.error('Failed to load doctors and queues:', doctorsQuery.error);
      setDoctors([]);
      setLoading(false);
      return;
    }
    const list = doctorsQuery.data?.data || [];
    setDoctors(list);
    const availableDoctors = list.filter(d => d.status?.status !== 'unavailable');
    const totalDoctors = availableDoctors.length;
    const activeDoctors = availableDoctors.filter(d => d.queueStatus?.tokens?.length > 0).length;
    const totalPatients = availableDoctors.reduce((sum, d) => sum + (d.queueStatus?.tokens?.length || 0), 0);
    const waitingPatients = availableDoctors.reduce((sum, d) => sum + (d.queueStatus?.tokens?.filter(t => t.status === 'waiting').length || 0), 0);
    setQueueStats({ totalDoctors, activeDoctors, totalPatients, waitingPatients });
    setLastRefresh(new Date());
    setLoading(false);
  }, [doctorsQuery.isLoading, doctorsQuery.error, doctorsQuery.data]);

  // Track user activity to pause auto-refresh during interactions
  useEffect(() => {
    let activityTimer;
    
    const handleUserActivity = () => {
      setIsUserActive(true);
      clearTimeout(activityTimer);
      // Reset activity flag after 10 seconds of inactivity
      activityTimer = setTimeout(() => {
        setIsUserActive(false);
      }, 10000);
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      clearTimeout(activityTimer);
    };
  }, []);

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (selectedDoctor) {
      await handleViewPatients(selectedDoctor);
    } else {
      await doctorsQuery.refetch();
    }
  };

  // Handle viewing doctor's patients
  const handleViewPatients = async (doctor) => {
    try {
      setLoading(true);
      setSelectedDoctor(doctor);
      
      // Fetch fresh queue data from the backend instead of using cached data
      console.log('🔄 [NURSE] Fetching fresh queue data for doctor:', doctor.id);
      const queueResponse = await queueService.getDoctorQueueStatus(doctor.id);
      
      if (!queueResponse.success) {
        console.error('Failed to fetch queue status:', queueResponse);
        setPatients([]);
        return;
      }
      
      // Get both tokens (walk-ins) and appointments (scheduled) from the fresh queue data
      const queueTokens = queueResponse.data?.tokens || [];
      const queueAppointments = queueResponse.data?.appointments || [];
      console.log(`📋 [NURSE] Received ${queueTokens.length} tokens and ${queueAppointments.length} appointments from backend`);
      
      // Debug: Log first token structure to see if visit_id is included
      if (queueTokens.length > 0) {
        console.log('🔍 [NURSE] First token structure:', JSON.stringify(queueTokens[0], null, 2));
      }
      
      // Filter out cancelled appointments - only show active queue tokens
      const activeTokens = queueTokens.filter(token => token.status !== 'cancelled');
      console.log(`📋 [NURSE] Filtered to ${activeTokens.length} active tokens (excluded ${queueTokens.length - activeTokens.length} cancelled)`);
      
      // Use only queue tokens (no appointment queue)
      const allPatients = activeTokens.map(t => ({ ...t, queueType: 'token' }));
      
      // Deduplicate patients - keep only the most recent token per patient
      const patientMap = new Map();
      allPatients.forEach(patient => {
        const patientId = patient.patient?.id;
        if (!patientId) return;
        
        const existing = patientMap.get(patientId);
        if (!existing || new Date(patient.created_at) > new Date(existing.created_at)) {
          patientMap.set(patientId, patient);
        }
      });
      
      const uniquePatients = Array.from(patientMap.values());
      console.log(`📋 [NURSE] Deduplicated ${allPatients.length} entries to ${uniquePatients.length} unique patients`);
      
      // Fetch vitals for each patient using the new per-visit logic
      const patientsWithVitals = await Promise.all(
        uniquePatients.map(async (patient) => {
          try {
            const vitals = await fetchTokenVitals(patient);
            
            const patientWithVitals = {
              ...patient,
              latestVitals: vitals
            };
            
            console.log(`[NURSE] Patient #${patient.token_number} after vitals fetch:`, {
              token_number: patient.token_number,
              visit_id: patient.visit_id,
              hasLatestVitals: !!patientWithVitals.latestVitals,
              latestVitals: patientWithVitals.latestVitals
            });
            
            return patientWithVitals;
          } catch (error) {
            console.log(`No vitals found for patient ${patient.patient?.id}`);
            return {
              ...patient,
              latestVitals: null
            };
          }
        })
      );
      
      console.log('✅ [NURSE] Patient list updated with fresh vitals and appointments');
      console.log('[NURSE] Total patients with vitals data:', patientsWithVitals.length);
      setPatients(patientsWithVitals);
    } catch (error) {
      console.error('Failed to load patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle going back to doctors view
  const handleBackToDoctors = () => {
    setSelectedDoctor(null);
    setPatients([]);
    setPatientSearchTerm('');
    setSelectedStatus('all'); // Reset status filter
  };

  // Filter doctors based on search term and availability
  const filteredDoctors = doctors.filter(doctor => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      doctor.first_name?.toLowerCase().includes(searchLower) ||
      doctor.last_name?.toLowerCase().includes(searchLower) ||
      doctor.specialty?.toLowerCase().includes(searchLower)
    );
    
    // Only show available doctors (exclude 'unavailable' status)
    const isAvailable = doctor.status?.status !== 'unavailable';
    
    return matchesSearch && isAvailable;
  });

  // Filter patients based on search term and status
  const filteredPatients = patients.filter(token => {
    const patient = token.patient;
    const searchLower = patientSearchTerm.toLowerCase();
    const matchesSearch = (
      patient?.first_name?.toLowerCase().includes(searchLower) ||
      patient?.last_name?.toLowerCase().includes(searchLower) ||
      patient?.phone?.toLowerCase().includes(searchLower) ||
      token.token_number?.toString().includes(searchLower)
    );
    
    const matchesStatus = selectedStatus === 'all' || 
                         token.status === selectedStatus ||
                         (selectedStatus === 'ready' && token.status === 'called'); // Include 'called' status in ready filter
    
    return matchesSearch && matchesStatus;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  return (
    <PageLayout
      title={selectedDoctor ? `${selectedDoctor.first_name} ${selectedDoctor.last_name}'s Patients` : "Patient Care Management"}
      subtitle={selectedDoctor ? "Monitor and provide nursing care" : "Monitor doctors' queues and provide nursing care"}
      fullWidth
    >
      <div className="space-y-6 p-6">
        {loading ? (
          <LoadingSpinner label="Loading..." />
        ) : (
          <>
            {!selectedDoctor ? (
              // Doctors View
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{queueStats.totalDoctors}</div>
                      <p className="text-xs text-muted-foreground">
                        {queueStats.activeDoctors} active today
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Doctors</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{queueStats.activeDoctors}</div>
                      <p className="text-xs text-muted-foreground">
                        Currently available
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{queueStats.totalPatients}</div>
                      <p className="text-xs text-muted-foreground">
                        In all queues
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Waiting Patients</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{queueStats.waitingPatients}</div>
                      <p className="text-xs text-muted-foreground">
                        Need attention
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <SearchBar
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search doctors by name or specialty..."
                      ariaLabel="Search doctors"
                    />
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <Button 
                      variant="outline"
                      className="flex items-center gap-2 h-12 px-4"
                      onClick={handleManualRefresh}
                      disabled={loading}
                    >
                      <Activity size={18} className={loading ? 'animate-spin' : ''} />
                      <span>Refresh</span>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="flex items-center gap-2 h-12 px-6"
                      onClick={() => navigate('/nurse/emr')}
                    >
                      <FileText size={18} />
                      <span>Patient Records</span>
                    </Button>
                    
                    <div className="text-xs text-muted-foreground">
                      Last updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Doctor Cards Grid */}
                {filteredDoctors.length === 0 ? (
                  <EmptyState 
                    title="No doctors found"
                    description={searchTerm ? "Try adjusting your search terms" : "No doctors are currently available"}
                    icon={Users}
                  />
                ) : (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredDoctors.map((doctor) => (
                      <QueueDoctorCard
                        key={doctor.id}
                        doctor={doctor}
                        onClick={handleViewPatients}
                        buttonText="View Patients"
                        buttonIcon={Eye}
                        showCurrentConsultation={true}
                        showNextInQueue={false}
                      />
                    ))}
                  </motion.div>
                )}
              </>
            ) : (
              // Patients View
              <>
                {/* Back Button and Doctor Info */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline" 
                      onClick={handleBackToDoctors}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Doctors
                    </Button>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {selectedDoctor.first_name?.[0]}{selectedDoctor.last_name?.[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold">Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleManualRefresh}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <Activity size={16} className={loading ? 'animate-spin' : ''} />
                      <span>Refresh Patients</span>
                    </Button>
                    
                    <div className="text-xs text-muted-foreground">
                      Updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Patient Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{patients.length}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Waiting</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">
                        {patients.filter(token => token.status === 'waiting').length}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">In Consultation</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {patients.filter(token => token.status === 'serving').length}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {patients.filter(token => token.status === 'completed').length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Patient Search and Status Filters */}
                <div className="space-y-4 mb-6">
                  {/* Search Bar */}
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input 
                      type="search" 
                      placeholder="Search patients..." 
                      className="pl-10 h-12 text-base" 
                      value={patientSearchTerm}
                      onChange={(e) => setPatientSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Status Filter Tabs - Make sure they're visible */}
                  <div className="w-full bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                    <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
                      <button
                        onClick={() => setSelectedStatus('all')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          selectedStatus === 'all'
                            ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        All ({patients.length})
                      </button>
                      <button
                        onClick={() => setSelectedStatus('waiting')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          selectedStatus === 'waiting'
                            ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Waiting ({patients.filter(token => token.status === 'waiting').length})
                      </button>
                      <button
                        onClick={() => setSelectedStatus('ready')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          selectedStatus === 'ready'
                            ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Waiting for Doctor ({patients.filter(token => token.status === 'ready' || token.status === 'called').length})
                      </button>
                      <button
                        onClick={() => setSelectedStatus('serving')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          selectedStatus === 'serving'
                            ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        In Consultation ({patients.filter(token => token.status === 'serving').length})
                      </button>
                      <button
                        onClick={() => setSelectedStatus('completed')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          selectedStatus === 'completed'
                            ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Completed ({patients.filter(token => token.status === 'completed').length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Patient Cards */}
                {filteredPatients.length === 0 ? (
                  <EmptyState 
                    title="No patients found"
                    description={patientSearchTerm ? "Try adjusting your search terms" : "No patients in this doctor's queue"}
                    icon={Users}
                  />
                ) : (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredPatients.map((token) => (
                      <PatientCard
                        key={`${token.id}-${token.token_number}`}
                        patient={{
                          id: token.id, // Use token/queue ID for operations
                          patientId: token.patient?.id, // Store actual patient ID separately
                          visit_id: token.visit_id, // Add visit_id for vitals linking
                          name: `${token.patient?.first_name || ''} ${token.patient?.last_name || ''}`.trim() || 'Unknown Patient',
                          age: token.patient?.age || token.patient?.date_of_birth 
                            ? new Date().getFullYear() - new Date(token.patient.date_of_birth).getFullYear() 
                            : 'N/A',
                          gender: token.patient?.gender || 'N/A',
                          phone: token.patient?.phone || 'N/A',
                          tokenNumber: token.token_number,
                          status: token.status,
                          priority: token.priority || 3, // Include priority for visual highlighting
                          appointmentTime: (() => {
                            // For appointments: combine appointment_date + appointment_time
                            if (token.appointment?.appointment_date && token.appointment?.appointment_time) {
                              const dateStr = token.appointment.appointment_date;
                              const timeStr = token.appointment.appointment_time;
                              const datetime = new Date(`${dateStr}T${timeStr}`);
                              return datetime.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              });
                            }
                            // For walk-ins: use token created_at
                            if (token.created_at) {
                              const datetime = new Date(token.created_at);
                              return datetime.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              });
                            }
                            return 'N/A';
                          })(),
                          vitals: token.latestVitals ? {
                            bp: token.latestVitals.blood_pressure_systolic && token.latestVitals.blood_pressure_diastolic 
                              ? `${token.latestVitals.blood_pressure_systolic}/${token.latestVitals.blood_pressure_diastolic}` 
                              : '',
                            temp: token.latestVitals.temperature ? token.latestVitals.temperature.toString() : '',
                            weight: token.latestVitals.weight ? token.latestVitals.weight.toString() : '',
                            heartRate: token.latestVitals.heart_rate ? token.latestVitals.heart_rate.toString() : ''
                          } : {},
                          latestVitals: token.latestVitals, // Pass the raw vitals data for button logic
                          conditions: token.conditions || [],
                          urgency: token.urgency || 'Normal',
                          vitalsRecorded: !!token.latestVitals,
                          vitalsDate: token.latestVitals?.recorded_at ? new Date(token.latestVitals.recorded_at).toLocaleString() : null
                        }}
                        userRole="nurse"
                        onSaveVitals={async (patientId, vitalsForm, notes, visitId = null) => {
                          try {
                            if (!patientId || typeof patientId !== 'string') {
                              console.error('[NURSE] Invalid patient ID provided when saving vitals:', patientId);
                              alert('Unable to determine the patient record. Please refresh and try again.');
                              return;
                            }

                            // Parse blood pressure with validation
                            let systolic = null;
                            let diastolic = null;
                            let bpError = null;
                            
                            if (vitalsForm.bp && vitalsForm.bp.trim()) {
                              if (!vitalsForm.bp.includes('/')) {
                                bpError = 'Blood pressure must be in format "120/80"';
                              } else {
                                const bpParts = vitalsForm.bp.trim().split('/');
                                if (bpParts.length !== 2) {
                                  bpError = 'Blood pressure must be in format "120/80"';
                                } else {
                                  const sys = parseInt(bpParts[0].trim());
                                  const dia = parseInt(bpParts[1].trim());
                                  
                                  if (isNaN(sys) || isNaN(dia)) {
                                    bpError = 'Blood pressure values must be valid numbers';
                                  } else if (sys < 60 || sys > 250) {
                                    bpError = 'Systolic pressure must be between 60 and 250 mmHg';
                                  } else if (dia < 30 || dia > 150) {
                                    bpError = 'Diastolic pressure must be between 30 and 150 mmHg';
                                  } else {
                                    systolic = sys;
                                    diastolic = dia;
                                  }
                                }
                              }
                            }
                            
                            // If there's a blood pressure validation error, show it
                            if (bpError) {
                              alert(`Invalid blood pressure: ${bpError}`);
                              return;
                            }
                            
                            // Parse and validate temperature
                            let temperature = null;
                            let temperatureUnit = null;
                            let tempError = null;
                            
                            if (vitalsForm.temp && vitalsForm.temp.trim()) {
                              const tempValue = parseFloat(vitalsForm.temp.trim());
                              
                              if (isNaN(tempValue)) {
                                tempError = 'Temperature must be a valid number';
                              } else {
                                // Auto-detect temperature unit based on value
                                if (tempValue >= 30 && tempValue <= 45) {
                                  // Likely Celsius (normal body temp range: 36-40°C)
                                  temperature = tempValue;
                                  temperatureUnit = 'C';
                                } else if (tempValue >= 86 && tempValue <= 113) {
                                  // Likely Fahrenheit (normal body temp range: 97-104°F)
                                  temperature = tempValue;
                                  temperatureUnit = 'F';
                                } else {
                                  tempError = 'Temperature must be between 30-45°C or 86-113°F';
                                }
                              }
                            }
                            
                            // If there's a temperature validation error, show it
                            if (tempError) {
                              alert(`Invalid temperature: ${tempError}`);
                              return;
                            }
                            
                            // Map the vitals form data to backend format
                            const vitalsData = {
                              patient_id: patientId,
                              visit_id: visitId || null,
                              temperature: temperature,
                              temperature_unit: temperatureUnit,
                              blood_pressure_systolic: systolic,
                              blood_pressure_diastolic: diastolic,
                              heart_rate: vitalsForm.heartRate ? parseInt(vitalsForm.heartRate) : null,
                              weight: vitalsForm.weight ? parseFloat(vitalsForm.weight) : null,
                              notes: notes || null,
                              priority_level: vitalsForm.priorityLevel || 'normal' // Add priority level
                            };
                            
                            console.log('💾 [NURSE] Saving vitals:', vitalsData);
                            const result = await vitalsService.saveVitals(patientId, vitalsData);
                            console.log('✅ [NURSE] Vitals saved, result:', result);
                            
                            // Wait longer for backend to process and update the queue
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            // Refresh the patient data to show updated vitals
                            if (selectedDoctor) {
                              console.log('🔄 [NURSE] Refreshing patient list after vitals save...');
                              await handleViewPatients(selectedDoctor);
                              console.log('✅ [NURSE] Patient list refreshed');
                            }
                            
                            alert('Vitals saved successfully!');
                          } catch (error) {
                            console.error('Failed to save vitals:', error);
                            
                            // Check for specific error from backend
                            if (error.response?.data?.code === 'NO_ACTIVE_VISIT') {
                              alert('⚠️ Security Check Failed\n\nCannot record vitals: Patient does not have an active visit.\n\nPlease ensure the patient has an active consultation session before recording vitals.');
                            } else {
                              alert(`Failed to save vitals: ${error.response?.data?.message || error.message}`);
                            }
                          }
                        }}
                        onMarkReady={async (patientId) => {
                          try {
                            // Find the ACTIVE token for this patient (not completed)
                            const token = patients.find(p => 
                              (p.patient?.id === patientId || p.id === patientId) && 
                              p.status === 'waiting'
                            );
                            if (token) {
                              await queueService.markPatientReady(token.id);
                              
                              // Refresh the patient data
                              if (selectedDoctor) {
                                await handleViewPatients(selectedDoctor);
                              }
                            } else {
                              console.error('No active token found for patient:', patientId);
                              alert('Could not find active token for this patient.');
                            }
                          } catch (error) {
                            console.error('Failed to mark patient ready:', error);
                            alert('Failed to mark patient ready. Please try again.');
                          }
                        }}
                        onUnmarkReady={async (patientId) => {
                          try {
                            // Find the token for this patient that is ready/called
                            const token = patients.find(p => 
                              (p.patient?.id === patientId || p.id === patientId) && 
                              (p.status === 'ready' || p.status === 'called')
                            );
                            if (token) {
                              // Change status back to waiting
                              await queueService.markPatientWaiting(token.id);
                              
                              // Refresh the patient data
                              if (selectedDoctor) {
                                await handleViewPatients(selectedDoctor);
                              }
                            }
                          } catch (error) {
                            console.error('Failed to unmark patient ready:', error);
                            alert('Failed to unmark patient ready. Please try again.');
                          }
                        }}
                        onDelayPatient={async (tokenOrQueueId, reason) => {
                          try {
                            console.log('🔍 Searching for patient with ID:', tokenOrQueueId);
                            console.log('🔍 Available patient IDs:', patients.map(p => ({ id: p.id, name: `${p.patient?.first_name} ${p.patient?.last_name}`, token: p.token_number })));
                            
                            // Find the token/queue entry by ID (not by patient ID)
                            const patient = patients.find(p => p.id === tokenOrQueueId);
                            if (!patient) {
                              console.error('❌ Patient not found. TokenOrQueueId:', tokenOrQueueId);
                              console.error('   Available IDs in patients array:', patients.map(p => p.id));
                              alert('Patient not found in current list. Please refresh the page and try again.');
                              return;
                            }
                            
                            console.log('🔄 Delaying patient:', patient);
                            console.log('   Token/Queue ID:', patient.id);
                            console.log('   Queue Type:', patient.queueType);
                            console.log('   Has appointment_id:', !!patient.appointment_id);
                            console.log('   Has token_number vs queue_position:', patient.token_number, patient.queue_position);
                            console.log('   Current Status:', patient.status);
                            
                            // Determine if this is an appointment or token
                            // Appointments have appointment_id, tokens don't
                            const isAppointment = patient.queueType === 'appointment' || patient.appointment_id;
                            
                            console.log('   → Treating as:', isAppointment ? 'APPOINTMENT' : 'TOKEN');
                            
                            // Call the appropriate delay API based on queue type
                            // Delay the token
                            await queueService.delayToken(patient.id, reason);
                            console.log('✅ Token queue patient delayed');
                            alert('✅ Patient has been marked as delayed');
                            
                            // Refresh the patient data
                            if (selectedDoctor) {
                              await handleViewPatients(selectedDoctor);
                            }
                          } catch (error) {
                            console.error('❌ Failed to delay patient:', error);
                            alert('❌ Failed to delay patient: ' + (error.message || 'Please try again.'));
                          }
                        }}
                        onRemoveDelay={async (tokenOrQueueId) => {
                          try {
                            // Find the token/queue entry by ID (not by patient ID)
                            const patient = patients.find(p => p.id === tokenOrQueueId);
                            if (patient) {
                              console.log('🔄 Undelaying patient:', patient);
                              console.log('   Token/Queue ID:', patient.id);
                              console.log('   Queue Type:', patient.queueType);
                              console.log('   Has appointment_id:', !!patient.appointment_id);
                              
                              // Determine if this is an appointment or token
                              // Undelay the token
                              const result = await queueService.undelayToken(patient.id);
                              console.log('✅ Token queue patient undelayed. New token:', result.newTokenNumber);
                              alert(`Patient has been added back to the queue with token #${result.newTokenNumber}`);
                              
                              // Refresh the patient data
                              if (selectedDoctor) {
                                await handleViewPatients(selectedDoctor);
                              }
                            }
                          } catch (error) {
                            console.error('Failed to remove delay:', error);
                            alert('Failed to remove delay: ' + (error.message || 'Please try again.'));
                          }
                        }}
                        readOnly={false}
                      />
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default NurseDashboard;
