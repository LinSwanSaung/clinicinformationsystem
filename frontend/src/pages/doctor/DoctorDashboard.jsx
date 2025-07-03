import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FileText
} from 'lucide-react';
import PatientCard from '../../components/medical/PatientCard';
import { PatientStats } from '../../components/medical/PatientStats';
import patientService from '../../services/patientService';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('waiting'); // waiting, in_progress, completed
  const [timeFilter, setTimeFilter] = useState('all');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load patients on component mount
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await patientService.getDoctorPatients();
        if (response.success) {
          setPatients(response.data);
        }
      } catch (error) {
        console.error('Failed to load patients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  // Filter patients based on search, tab and time
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = (
      (selectedTab === 'waiting' && (patient.status === 'ready' || patient.status === 'delayed')) ||
      (selectedTab === 'in_progress' && patient.status === 'seeing_doctor') ||
      (selectedTab === 'completed' && patient.status === 'completed')
    );

    // Time frame filtering
    const matchesTime = timeFilter === 'all' || 
      (timeFilter === 'morning' && patient.appointmentTime.includes('AM')) ||
      (timeFilter === 'afternoon' && patient.appointmentTime.includes('PM'));

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

  return (
    <PageLayout
      title="Doctor Dashboard"
      subtitle="Manage patient consultations and medical records"
      fullWidth
    >
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
                  placeholder="Search by patient name..." 
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
              <option value="all">All Appointments</option>
              <option value="morning">Morning (AM)</option>
              <option value="afternoon">Afternoon (PM)</option>
            </select>
          </div>
        </div>

        {/* Patient tabs and cards */}
        <Card className="p-8">
          <Tabs 
            value={selectedTab} 
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full max-w-lg mx-auto mb-8 h-12">
              <TabsTrigger value="waiting" className="text-base py-3">
                <UserCheck className="w-5 h-5 mr-2" />
                Waiting
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="text-base py-3">
                <UserCog className="w-5 h-5 mr-2" />
                In Progress
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-base py-3">
                <CheckCircle className="w-5 h-5 mr-2" />
                Completed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="waiting" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredPatients.map(patient => (
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
                ))}
                {filteredPatients.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500 text-lg">
                    No patients waiting for consultation.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="in_progress" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredPatients.map(patient => (
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
                ))}
                {filteredPatients.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500 text-lg">
                    No patients currently in consultation.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredPatients.map(patient => (
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
                ))}
                {filteredPatients.length === 0 && (
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
