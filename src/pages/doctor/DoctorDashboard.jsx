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
  FileText
} from 'lucide-react';
import PatientCard from '../../components/medical/PatientCard';
import { PatientStats } from '../../components/medical/PatientStats';

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
    },
    {
      id: '5',
      name: 'Michael Brown',
      age: 40,
      gender: 'Male',
      appointmentTime: '11:00 AM',
      status: 'delayed',
      delayReason: 'Waiting for lab results before consultation',
      vitals: {
        bp: '130/85',
        temp: '99.1',
        weight: '75',
        heartRate: '80'
      },
      vitalsRecorded: true,
      urgency: 'Priority',
      notes: 'Patient shows elevated temperature, possible infection'
    }
    // Add more dummy patients as needed
  ]);

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
      </div>
    </PageLayout>
  );
};

export default DoctorDashboard;
