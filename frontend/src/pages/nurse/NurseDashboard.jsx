import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import QueueDoctorCard from '../../components/QueueDoctorCard';
import PatientCard from '../../components/medical/PatientCard';
import SearchInput from '../../components/SearchInput';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import vitalsService from '../../services/vitalsService';
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
import doctorService from '../../services/doctorService';
import queueService from '../../services/queueService';

/**
 * Helper function to fetch appropriate vitals for a token
 * Uses the token's visit_id to get vitals for that specific visit only
 */
const fetchTokenVitals = async (token) => {
  try {
    if (!token.visit_id) {
      console.log(`❌ [NURSE] Token #${token.token_number} has no visit_id - treating as fresh visit`);
      return null;
    }
    
    console.log(`🔍 [NURSE] Fetching vitals for token #${token.token_number} - visit_id: ${token.visit_id}`);
    
    // Fetch vitals for this specific visit only
    try {
      const vitalsResponse = await vitalsService.getVisitVitals(token.visit_id);
      // Check if we have actual vitals data (not empty array)
      if (vitalsResponse.success && vitalsResponse.data && vitalsResponse.data.length > 0) {
        console.log(`✅ [NURSE] Found vitals for visit ${token.visit_id}:`, vitalsResponse.data[0]);
        return vitalsResponse.data[0]; // Return first vitals record
      }
      console.log(`❌ [NURSE] No vitals found for visit ${token.visit_id} - showing "Add Vitals & Notes"`);
    } catch (error) {
      console.warn('[NURSE] Failed to fetch visit vitals:', error);
    }
    
    // No vitals for this visit - return null to show "Add Vitals & Notes"
    return null;
  } catch (error) {
    console.warn('[NURSE] Failed to fetch vitals for token:', token.id, error);
    return null;
  }
};

const NurseDashboard = () => {
  const navigate = useNavigate();
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

  // Load doctors and queue data on component mount
  useEffect(() => {
    const loadDoctorsAndQueues = async () => {
      try {
        setLoading(true);
        // Use the same method as the working NursePatientQueuePage
        const doctorsData = await queueService.getAllDoctorsQueueStatus();
        
        const doctors = doctorsData.data || [];
        
        setDoctors(doctors);
        
        // Calculate stats (only count available doctors)
        const availableDoctors = doctors.filter(d => d.status?.status !== 'unavailable');
        const totalDoctors = availableDoctors.length;
        const activeDoctors = availableDoctors.filter(d => d.queueStatus?.tokens?.length > 0).length;
        const totalPatients = availableDoctors.reduce((sum, d) => sum + (d.queueStatus?.tokens?.length || 0), 0);
        const waitingPatients = availableDoctors.reduce((sum, d) => sum + (d.queueStatus?.tokens?.filter(t => t.status === 'waiting').length || 0), 0);
        
        setQueueStats({
          totalDoctors,
          activeDoctors,
          totalPatients,
          waitingPatients
        });
        
        setLastRefresh(new Date());
        
      } catch (error) {
        console.error('Failed to load doctors and queues:', error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    loadDoctorsAndQueues();
    
    // Smarter refresh strategy - only refresh if user is not actively interacting
    const interval = setInterval(() => {
      // Don't auto-refresh if user is actively interacting (typing, modals open, etc.)
      if (!isUserActive) {
        loadDoctorsAndQueues();
      }
    }, 60000); // Increased to 60 seconds
    
    return () => clearInterval(interval);
  }, [isUserActive]);

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
      await loadDoctorsAndQueues();
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
      
      // Get the tokens from the fresh queue data
      const queueTokens = queueResponse.data?.tokens || [];
      console.log(`📋 [NURSE] Received ${queueTokens.length} tokens from backend`);
      
      // Fetch vitals for each patient using the new per-visit logic
      const tokensWithVitals = await Promise.all(
        queueTokens.map(async (token) => {
          try {
            const vitals = await fetchTokenVitals(token);
            
            return {
              ...token,
              latestVitals: vitals
            };
          } catch (error) {
            console.log(`No vitals found for patient ${token.patient?.id}`);
            return {
              ...token,
              latestVitals: null
            };
          }
        })
      );
      
      console.log('✅ [NURSE] Patient list updated with fresh vitals');
      setPatients(tokensWithVitals);
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
          <LoadingState />
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
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input 
                      type="search" 
                      placeholder="Search doctors by name or specialty..." 
                      className="pl-10 h-12 text-base" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
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
                          id: token.patient?.id || token.id,
                          name: `${token.patient?.first_name || ''} ${token.patient?.last_name || ''}`.trim() || 'Unknown Patient',
                          age: token.patient?.age || token.patient?.date_of_birth 
                            ? new Date().getFullYear() - new Date(token.patient.date_of_birth).getFullYear() 
                            : 'N/A',
                          gender: token.patient?.gender || 'N/A',
                          phone: token.patient?.phone || 'N/A',
                          tokenNumber: token.token_number,
                          status: token.status,
                          priority: token.priority || 3, // Include priority for visual highlighting
                          appointmentTime: token.appointment?.appointment_time 
                            ? new Date(token.appointment.appointment_time).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })
                            : new Date(token.created_at).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              }),
                          vitals: token.latestVitals ? {
                            bp: token.latestVitals.blood_pressure_systolic && token.latestVitals.blood_pressure_diastolic 
                              ? `${token.latestVitals.blood_pressure_systolic}/${token.latestVitals.blood_pressure_diastolic}` 
                              : '',
                            temp: token.latestVitals.temperature ? token.latestVitals.temperature.toString() : '',
                            weight: token.latestVitals.weight ? token.latestVitals.weight.toString() : '',
                            heartRate: token.latestVitals.heart_rate ? token.latestVitals.heart_rate.toString() : ''
                          } : {},
                          conditions: token.conditions || [],
                          urgency: token.urgency || 'Normal',
                          vitalsRecorded: !!token.latestVitals,
                          vitalsDate: token.latestVitals?.recorded_at ? new Date(token.latestVitals.recorded_at).toLocaleString() : null
                        }}
                        userRole="nurse"
                        onSaveVitals={async (patientId, vitalsForm, notes) => {
                          try {
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
                            
                            // Wait a moment for backend to process
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            // Refresh the patient data to show updated vitals
                            if (selectedDoctor) {
                              console.log('🔄 [NURSE] Refreshing patient list...');
                              await handleViewPatients(selectedDoctor);
                            }
                            
                            alert('Vitals saved successfully!');
                          } catch (error) {
                            console.error('Failed to save vitals:', error);
                            alert(`Failed to save vitals: ${error.message}`);
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
                        onDelayPatient={async (patientId, reason) => {
                          try {
                            // Find the token for this patient
                            const token = patients.find(p => p.patient?.id === patientId || p.id === patientId);
                            if (token) {
                              // For now, we'll mark as missed since there's no specific delay endpoint
                              await queueService.markPatientMissed(token.id);
                              
                              // Refresh the patient data
                              if (selectedDoctor) {
                                await handleViewPatients(selectedDoctor);
                              }
                            }
                          } catch (error) {
                            console.error('Failed to delay patient:', error);
                            alert('Failed to delay patient. Please try again.');
                          }
                        }}
                        onRemoveDelay={async (patientId) => {
                          try {
                            // TODO: Implement remove delay functionality
                            // await queueService.removeDelay(patientId);
                          } catch (error) {
                            console.error('Failed to remove delay:', error);
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
