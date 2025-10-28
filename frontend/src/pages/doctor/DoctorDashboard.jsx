import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../../components/PageLayout';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Search, 
  UserCheck, 
  UserCog,
  CheckCircle,
  RefreshCw,
  PlayCircle,
  X
} from 'lucide-react';
import PatientCard from '../../components/medical/PatientCard';
import { PatientStats } from '../../components/medical/PatientStats';
import patientService from '../../services/patientService';
import queueService from '../../services/queueService';
import vitalsService from '../../services/vitalsService';

/**
 * Helper function to fetch appropriate vitals for a token
 * Uses the token's visit_id to get vitals for that specific visit only
 */
const fetchTokenVitals = async (token) => {
  try {
    if (!token.visit_id) {
      console.log(`❌ Token #${token.token_number} has no visit_id - treating as fresh visit`);
      return null;
    }
    
    console.log(`🔍 Fetching vitals for token #${token.token_number} - visit_id: ${token.visit_id}`);
    
    // Fetch vitals for this specific visit only
    try {
      const vitalsResponse = await vitalsService.getVisitVitals(token.visit_id);
      // Check if we have actual vitals data (not empty array)
      if (vitalsResponse.success && vitalsResponse.data && vitalsResponse.data.length > 0) {
        console.log(`✅ Found vitals for visit ${token.visit_id}:`, vitalsResponse.data[0]);
        return vitalsResponse.data[0]; // Return first vitals record
      }
      console.log(`❌ No vitals found for visit ${token.visit_id} - showing "Add Vitals & Notes"`);
    } catch (error) {
      console.warn('Failed to fetch visit vitals:', error);
    }
    
    // No vitals for this visit - return null to show "Add Vitals & Notes"
    return null;
  } catch (error) {
    console.warn('Failed to fetch vitals for token:', token.id, error);
    return null;
  }
};

/**
 * Helper function to transform token data to patient data format
 */
const transformTokenToPatientData = (token) => {
  // Construct blood pressure string only if we have valid values
  let bloodPressure = null;
  if (token.patient?.vitals?.blood_pressure_systolic && token.patient?.vitals?.blood_pressure_diastolic) {
    bloodPressure = `${token.patient.vitals.blood_pressure_systolic}/${token.patient.vitals.blood_pressure_diastolic}`;
  }

  // Calculate age from date_of_birth
  let age = 'N/A';
  if (token.patient?.date_of_birth) {
    age = new Date().getFullYear() - new Date(token.patient.date_of_birth).getFullYear();
  } else if (token.patient?.age) {
    age = token.patient.age;
  }

  return {
    id: token.patient?.id || token.id,
    name: `${token.patient?.first_name || ''} ${token.patient?.last_name || ''}`.trim() || 'Unknown Patient',
    age: age,
    gender: token.patient?.gender || 'N/A',
    phone: token.patient?.phone || 'N/A',
    tokenNumber: token.token_number,
    status: token.status,
    priority: token.priority || 3, // Include priority for visual highlighting
    visit_id: token.visit_id, // Include visit_id from token
    // Structure vitals data as expected by PatientCard
    vitals: {
      heartRate: token.patient?.vitals?.heart_rate || null,
      bp: bloodPressure,
      temp: token.patient?.vitals?.temperature || null,
      weight: token.patient?.vitals?.weight || null,
      oxygenSaturation: token.patient?.vitals?.oxygen_saturation || null
    },
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
        })
  };
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('ready'); // ready, consulting, completed
  const [timeFilter, setTimeFilter] = useState('all');
  const [patients, setPatients] = useState([]);
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: string }
  
  // Get current doctor ID from authenticated user
  const currentDoctorId = user?.id;

  // Show notification function
  const showNotification = (type, message) => {
    setNotification({ type, message });
    // Auto-hide notification after 4 seconds
    setTimeout(() => setNotification(null), 4000);
  };

  // Load patients and queue data on component mount
  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      
      // Only proceed if we have a valid doctor ID
      if (!currentDoctorId) {
        setQueueData([]);
        setPatients([]);
        return;
      }
      
      // Load queue status for the doctor
      const queueResponse = await queueService.getDoctorQueueStatus(currentDoctorId);
      
      if (queueResponse.success) {
        const tokens = queueResponse.data.tokens || [];
        
        // Fetch vitals for each patient in the queue
        const tokensWithVitals = await Promise.all(
          tokens.map(async (token) => {
            const vitals = await fetchTokenVitals(token);
            if (vitals) {
              token.patient.vitals = vitals;
              token.patient.vitalsRecorded = true;
              console.log(`✅ [DOCTOR] ${token.patient.first_name} - vitalsRecorded: true, vitals:`, vitals);
            } else {
              // No vitals found - this should trigger "Add Vitals & Notes" button
              token.patient.vitals = null;
              token.patient.vitalsRecorded = false;
              console.log(`❌ [DOCTOR] ${token.patient.first_name} - vitalsRecorded: false, should show "Add Vitals & Notes"`);
            }
            return token;
          })
        );
        
        setQueueData(tokensWithVitals);
      } else {
        setQueueData([]);
      }
      
      // Load general patients data (backup/fallback)
      const patientsResponse = await patientService.getDoctorPatients();
      if (patientsResponse.success) {
        setPatients(patientsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load doctor data:', error);
      // Fallback to empty data
      setQueueData([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh queue data
  const refreshQueue = async () => {
    try {
      setRefreshing(true);
      const queueResponse = await queueService.getDoctorQueueStatus(currentDoctorId);
      
      if (queueResponse.success && queueResponse.data) {
        const newTokens = queueResponse.data.tokens || [];
        
        // Fetch vitals for each patient in the queue
        const tokensWithVitals = await Promise.all(
          newTokens.map(async (token) => {
            const vitals = await fetchTokenVitals(token);
            if (vitals) {
              token.patient.vitals = vitals;
            }
            return token;
          })
        );
        
        setQueueData(tokensWithVitals);
        showNotification('success', 'Queue data refreshed successfully');
      } else {
        showNotification('error', 'Failed to refresh queue data');
      }
    } catch (error) {
      showNotification('error', `Failed to refresh: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter and sort queue data based on search, tab and time
  const filteredQueueData = queueData
    .filter(token => {
      // Search filter
      const patientName = `${token.patient?.first_name || ''} ${token.patient?.last_name || ''}`.toLowerCase();
      const matchesSearch = searchQuery === '' || patientName.includes(searchQuery.toLowerCase()) || 
                           token.token_number?.toString().includes(searchQuery);
      
      // Tab filter based on token status
      const matchesTab = (
        (selectedTab === 'ready' && ['ready', 'called', 'waiting'].includes(token.status)) ||
        (selectedTab === 'consulting' && token.status === 'serving') ||
        (selectedTab === 'completed' && ['completed', 'cancelled'].includes(token.status))
      );
      

      
      // Time filter
      const matchesTime = timeFilter === 'all' || 
                         (timeFilter === 'morning' && new Date(token.created_at).getHours() < 12) ||
                         (timeFilter === 'afternoon' && new Date(token.created_at).getHours() >= 12);
      
      return matchesSearch && matchesTab && matchesTime;
    })
    .sort((a, b) => {
      // Sort by priority first (higher priority = lower number, so descending)
      const priorityDiff = (b.priority || 3) - (a.priority || 3);
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by token number (ascending)
      return a.token_number - b.token_number;
    });



  // Fallback to regular patients if no queue data
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = (
      (selectedTab === 'ready' && (patient.status === 'ready' || patient.status === 'delayed')) ||
      (selectedTab === 'consulting' && patient.status === 'seeing_doctor') ||
      (selectedTab === 'completed' && patient.status === 'completed')
    );

    // Time frame filtering
    const matchesTime = timeFilter === 'all' || 
      (timeFilter === 'morning' && patient.appointmentTime?.includes('AM')) ||
      (timeFilter === 'afternoon' && patient.appointmentTime?.includes('PM'));

    return matchesSearch && matchesTab && matchesTime;
  });

  const handleStartConsultation = async (patientId) => {
    try {
      await patientService.startConsultation(patientId);
      setPatients(patients.map(p => 
        p.id === patientId 
          ? { ...p, status: 'seeing_doctor' }
          : p
      ));
    } catch (error) {
      console.error('Failed to start consultation:', error);
    }
  };

  const handleCompleteVisit = async (patientId) => {
    try {
      await patientService.completeVisit(patientId);
      setPatients(patients.map(p => 
        p.id === patientId 
          ? { ...p, status: 'completed' }
          : p
      ));
    } catch (error) {
      console.error('Failed to complete visit:', error);
    }
  };

  // Complete token consultation (for queue-based patients)
  const handleCompleteTokenConsultation = async (tokenId) => {
    try {
      setRefreshing(true);
      const response = await queueService.completeConsultation(tokenId);
      if (response.success) {
        // Update queue data immediately and force re-render
        const updatedQueueData = queueData.map(token => 
          token.id === tokenId 
            ? { ...token, status: 'completed' }
            : token
        );
        
        // Use React's batch update to update both state and tab together
        setQueueData([...updatedQueueData]); // Spread to create new array reference
        setSelectedTab('completed');
        showNotification('success', 'Consultation completed successfully!');
        
        // Background refresh for server sync
        setTimeout(async () => {
          await refreshQueue();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to complete consultation:', error);
      showNotification('error', `Failed to complete consultation: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Queue-specific action handlers
  const handleCallNextPatient = async () => {
    try {
      setRefreshing(true);
      const response = await queueService.callNextPatient(currentDoctorId);
      if (response.success) {
        // Refresh queue to show updated status
        await refreshQueue();
        showNotification('success', 'Next patient called successfully!');
      }
    } catch (error) {
      console.error('Failed to call next patient:', error);
      showNotification('error', `Failed to call next patient: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartTokenConsultation = async (tokenId) => {
    try {
      setRefreshing(true);
      const response = await queueService.startConsultation(tokenId);
      if (response.success) {
        // Update queue data immediately and force re-render
        const updatedQueueData = queueData.map(token => 
          token.id === tokenId 
            ? { ...token, status: 'serving' }
            : token
        );
        
        // Use React's batch update to update both state and tab together
        setQueueData([...updatedQueueData]); // Spread to create new array reference
        setSelectedTab('consulting');
        showNotification('success', 'Consultation started successfully!');
        
        // Background refresh for server sync
        setTimeout(async () => {
          await refreshQueue();
        }, 500);
      }
    } catch (error) {
      // Handle different error types
      if (error.message && error.message.includes('currently in consultation')) {
        const message = error.message;
        const confirmAction = window.confirm(
          `${message}\n\nClick "OK" to go to "In Consultation" tab to see active consultations.`
        );
        if (confirmAction) {
          // Switch to the "In Consultation" tab
          setSelectedTab('consulting');
        }
      } else if (error.message && error.message.includes("should be 'called'")) {
        const confirmAction = window.confirm(
          `Cannot start consultation: ${error.message}\n\n` +
          `The patient needs to be called first. Click "OK" to call next patient.`
        );
        if (confirmAction) {
          await handleCallNextPatient();
        }
      } else {
        showNotification('error', `Failed to start consultation: ${error.message}`);
      }
    } finally {
      setRefreshing(false);
    }
  };





  return (
    <PageLayout
      title="Doctor Dashboard"
      subtitle="Manage patient consultations and medical records"
      fullWidth
    >
      {/* Notification Component */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 ${
              notification.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <X size={20} />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className={`flex-shrink-0 rounded-full p-1 hover:bg-opacity-20 ${
                notification.type === 'success' 
                  ? 'hover:bg-green-600' 
                  : 'hover:bg-red-600'
              }`}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      
      <div className="space-y-8 p-8">
        {/* Loading state */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading patients...</p>
          </div>
        ) : (
          <>
            {/* Patient Stats */}
            <PatientStats patients={patients} userRole="doctor" />

            {/* Search and actions bar */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input 
                  type="search" 
                  placeholder="Search by patient name or token..." 
                  className="pl-10 h-12 text-base" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="min-w-[200px]">
                <select 
                  className="h-12 px-4 py-2 text-base rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="morning">Morning (AM)</option>
                  <option value="afternoon">Afternoon (PM)</option>
                </select>
              </div>
              <Button 
                onClick={handleCallNextPatient}
                className="h-12 px-6 bg-green-600 hover:bg-green-700 text-white"
                disabled={refreshing}
                title="Call the next waiting patient"
              >
                <PlayCircle className="mr-2" size={18} />
                Call Next Patient
              </Button>
              <Button 
                onClick={refreshQueue}
                variant="outline"
                className="h-12 px-4"
                disabled={refreshing}
              >
                <RefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={18} />
                Refresh
              </Button>
            </div>

        {/* Patient tabs and cards */}
        <Card className="p-8">
          <Tabs 
            value={selectedTab} 
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full max-w-lg mx-auto mb-8 h-12">
              <TabsTrigger value="ready" className="text-base py-3">
                <UserCheck className="w-5 h-5 mr-2" />
                Ready
                <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                  {queueData.filter(t => ['ready', 'called', 'waiting'].includes(t.status)).length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="consulting" className="text-base py-3">
                <UserCog className="w-5 h-5 mr-2" />
                In Consultation
                <span className="ml-2 bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs">
                  {queueData.filter(t => t.status === 'serving').length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-base py-3">
                <CheckCircle className="w-5 h-5 mr-2" />
                Completed
                <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                  {queueData.filter(t => ['completed', 'cancelled'].includes(t.status)).length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ready" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {/* Show queue tokens if available, otherwise show regular patients */}
                {filteredQueueData.length > 0 ? (
                  filteredQueueData.map(token => {
                    const patientData = transformTokenToPatientData(token);
                    
                    return (
                      <PatientCard
                        key={token.id}
                        patient={patientData}
                        userRole="doctor"
                        onStartConsultation={() => handleStartTokenConsultation(token.id)}
                        onCompleteVisit={() => handleCompleteTokenConsultation(token.id)}
                        onViewFullPatientData={(patient) => {
                          navigate('/doctor/patient-record', { 
                            state: { 
                              patient,
                              visit_id: token.visit_id 
                            } 
                          });
                        }}
                      />
                    );
                  })
                ) : (
                  filteredPatients.map(patient => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      userRole="doctor"
                      onStartConsultation={handleStartConsultation}
                      onCompleteVisit={handleCompleteVisit}
                      onViewFullPatientData={(patient) => {
                        navigate('/doctor/patient-record', { state: { patient } });
                      }}
                    />
                  ))
                )}
                {(filteredQueueData.length === 0 && filteredPatients.length === 0) && (
                  <div className="col-span-full text-center py-12 text-gray-500 text-lg">
                    No patients ready for consultation.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="consulting" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {/* Show queue tokens if available, otherwise show regular patients */}
                {filteredQueueData.length > 0 ? (
                  filteredQueueData.map(token => {
                    const patientData = transformTokenToPatientData(token);
                    
                    return (
                      <PatientCard
                        key={token.id}
                        patient={patientData}
                        userRole="doctor"
                        onStartConsultation={() => handleStartTokenConsultation(token.id)}
                        onCompleteVisit={() => handleCompleteTokenConsultation(token.id)}
                        onViewFullPatientData={(patient) => {
                          navigate('/doctor/patient-record', { 
                            state: { 
                              patient,
                              visit_id: token.visit_id 
                            } 
                          });
                        }}
                      />
                    );
                  })
                ) : (
                  filteredPatients.map(patient => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      userRole="doctor"
                      onStartConsultation={handleStartConsultation}
                      onCompleteVisit={handleCompleteVisit}
                      onViewFullPatientData={(patient) => {
                        navigate('/doctor/patient-record', { state: { patient } });
                      }}
                    />
                  ))
                )}
                {(filteredQueueData.length === 0 && filteredPatients.length === 0) && (
                  <div className="col-span-full text-center py-12 text-gray-500 text-lg">
                    No patients currently in consultation.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {/* Show queue tokens if available, otherwise show regular patients */}
                {filteredQueueData.length > 0 ? (
                  filteredQueueData.map(token => {
                    const patientData = transformTokenToPatientData(token);
                    
                    return (
                      <PatientCard
                        key={token.id}
                        patient={patientData}
                        userRole="doctor"
                        readOnly={true}
                        onViewFullPatientData={(patient) => {
                          navigate('/doctor/patient-record', { 
                            state: { 
                              patient,
                              visit_id: token.visit_id 
                            } 
                          });
                        }}
                      />
                    );
                  })
                ) : (
                  filteredPatients.map(patient => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      userRole="doctor"
                      readOnly={true}
                      onViewFullPatientData={(patient) => {
                        navigate('/doctor/patient-record', { state: { patient } });
                      }}
                    />
                  ))
                )}
                {(filteredQueueData.length === 0 && filteredPatients.length === 0) && (
                  <div className="col-span-full text-center py-12 text-gray-500 text-lg">
                    No completed consultations today.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
        </>
        )}
      </div>
    </PageLayout>
  );
};

export default DoctorDashboard;
