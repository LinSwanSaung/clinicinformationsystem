import React, { useState } from 'react';
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
  Clock,
  ClipboardList,
  User,
  FileText,
  Activity
} from 'lucide-react';
import PatientCard from '../../components/medical/PatientCard';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('waiting'); // waiting, in_progress, completed
  const [timeFilter, setTimeFilter] = useState('all');

  // Dummy data - In real app, this would come from your backend
  const [patients, setPatients] = useState([
    {
      id: '1',
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      appointmentTime: '09:00 AM',
      status: 'ready',
      vitals: {
        bp: '120/80',
        temp: '98.6',
        weight: '70',
        heartRate: '72'
      },
      vitalsRecorded: true,
      urgency: 'Normal'
    },
    {
      id: '2',
      name: 'Jane Smith',
      age: 32,
      gender: 'Female',
      appointmentTime: '09:30 AM',
      status: 'seeing_doctor',
      vitals: {
        bp: '118/75',
        temp: '98.4',
        weight: '65',
        heartRate: '75'
      },
      vitalsRecorded: true,
      urgency: 'Priority'
    },
    {
      id: '3',
      name: 'Robert Johnson',
      age: 58,
      gender: 'Male',
      appointmentTime: '10:00 AM',
      status: 'completed',
      vitals: {
        bp: '125/82',
        temp: '98.2',
        weight: '80',
        heartRate: '68'
      },
      vitalsRecorded: true,
      urgency: 'Normal'
    },
    {
      id: '4',
      name: 'Emily Davis',
      age: 29,
      gender: 'Female',
      appointmentTime: '10:30 AM',
      status: 'ready',
      vitals: {
        bp: '115/70',
        temp: '98.8',
        weight: '62',
        heartRate: '78'
      },
      vitalsRecorded: true,
      urgency: 'Priority'
    }
    // Add more dummy patients as needed
  ]);

  // Filter patients based on search, tab and time
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = (
      (selectedTab === 'waiting' && patient.status === 'ready') ||
      (selectedTab === 'in_progress' && patient.status === 'seeing_doctor') ||
      (selectedTab === 'completed' && patient.status === 'completed')
    );

    // Time frame filtering
    const matchesTime = timeFilter === 'all' || 
      (timeFilter === 'morning' && patient.appointmentTime.includes('AM')) ||
      (timeFilter === 'afternoon' && patient.appointmentTime.includes('PM'));

    return matchesSearch && matchesTab && matchesTime;
  });

  const handleStartConsultation = (patientId) => {
    setPatients(patients.map(p => 
      p.id === patientId 
        ? { ...p, status: 'seeing_doctor' }
        : p
    ));
  };

  const handleCompleteVisit = (patientId) => {
    setPatients(patients.map(p => 
      p.id === patientId 
        ? { ...p, status: 'completed' }
        : p
    ));
  };

  return (
    <PageLayout
      title="Doctor Dashboard"
      subtitle="Manage patient consultations and medical records"
      fullWidth
    >
      <div className="space-y-8 p-8">
        {/* Banner and summary cards */}
        <div className="bg-blue-600 text-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-4">Doctor's Patient Queue</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-500/30 backdrop-blur border-blue-300/50 text-white">
              <div className="p-4 flex flex-col items-center text-center">
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-sm font-medium">Waiting for You</h2>
                  <ClipboardList size={20} />
                </div>
                <p className="text-4xl font-bold my-1">{filteredPatients.filter(p => p.status === 'ready').length}</p>
                <p className="text-xs opacity-80">Patients ready for consultation</p>
              </div>
            </Card>

            <Card className="bg-blue-500/30 backdrop-blur border-blue-300/50 text-white">
              <div className="p-4 flex flex-col items-center text-center">
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-sm font-medium">In Progress</h2>
                  <UserCog size={20} />
                </div>
                <p className="text-4xl font-bold my-1">{filteredPatients.filter(p => p.status === 'seeing_doctor').length}</p>
                <p className="text-xs opacity-80">Currently consulting</p>
              </div>
            </Card>

            <Card className="bg-blue-500/30 backdrop-blur border-blue-300/50 text-white">
              <div className="p-4 flex flex-col items-center text-center">
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-sm font-medium">Completed Today</h2>
                  <CheckCircle size={20} />
                </div>
                <p className="text-4xl font-bold my-1">{filteredPatients.filter(p => p.status === 'completed').length}</p>
                <p className="text-xs opacity-80">Consultations finished</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Search and quick actions */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              type="search" 
              placeholder="Search by patient name..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="min-w-[180px]">
            <select 
              className="h-10 px-4 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="all">All Appointments</option>
              <option value="morning">Morning (AM)</option>
              <option value="afternoon">Afternoon (PM)</option>
            </select>
          </div>
          <Button 
            variant="outline"
            className="flex items-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => navigate('/doctor/patient-record')}
          >
            <FileText size={16} />
            <span>Patient EMR</span>
          </Button>
        </div>

        {/* Patient tabs and cards */}
        <Card className="p-6">
          <Tabs 
            value={selectedTab} 
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full mb-6">
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

            <TabsContent value="waiting" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="col-span-full text-center py-10 text-gray-500">
                    No patients waiting for consultation.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="in_progress" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="col-span-full text-center py-10 text-gray-500">
                    No patients currently in consultation.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="col-span-full text-center py-10 text-gray-500">
                    No completed consultations today.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </PageLayout>
  );
};

export default DoctorDashboard;
