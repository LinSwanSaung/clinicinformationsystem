import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Search, 
  ClipboardList, 
  UserCheck, 
  User, 
  Clock, 
  Activity, 
  ThermometerSnowflake, 
  Scale, 
  Heart, 
  FileText, 
  Check,
  X
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import PatientCard from '../../components/nurse/PatientCard';
import { nursePatientsData } from '../../data/dummyNurseData';

const NurseDashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState(nursePatientsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  
  // Filter patients based on the search term and time frame
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Time frame filtering logic (for now we'll simulate this)
    if (timeFilter === 'all') return matchesSearch;
    
    const now = new Date();
    const appointmentTime = patient.appointmentTime;
    
    // Simple time filtering (in real app, this would use actual appointment dates)
    switch (timeFilter) {
      case 'morning':
        return matchesSearch && appointmentTime.includes('AM');
      case 'afternoon':
        return matchesSearch && appointmentTime.includes('PM');
      case 'next_2_hours':
        // Simulate next 2 hours (would use actual time comparison in real app)
        return matchesSearch && ['09:30 AM', '10:45 AM', '11:00 AM', '11:30 AM'].includes(appointmentTime);
      case 'next_4_hours':
        // Simulate next 4 hours
        return matchesSearch && !appointmentTime.includes('12:00 PM');
      default:
        return matchesSearch;
    }
  });
  
  // Group patients by status
  const waitingPatients = filteredPatients.filter(p => p.status === 'waiting' || p.status === 'delayed');
  const readyPatients = filteredPatients.filter(p => p.status === 'ready');
  const seeingDoctorPatients = filteredPatients.filter(p => p.status === 'seeing_doctor');
  
  // Handlers for patient actions
  const handleMarkReady = (patientId) => {
    setPatients(patients.map(p => 
      p.id === patientId ? { ...p, status: 'ready' } : p
    ));
  };
  
  const handleDelayPatient = (patientId, reason) => {
    setPatients(patients.map(p => 
      p.id === patientId ? { ...p, status: 'delayed', delayReason: reason } : p
    ));
  };

  const handleSaveVitals = (patientId, vitals, notes) => {
    setPatients(patients.map(p => 
      p.id === patientId ? { 
        ...p, 
        vitals: { ...p.vitals, ...vitals }, 
        vitalsRecorded: true,
        notes: notes || p.notes,
        urgency: vitals.urgency || 'Normal'
      } : p
    ));
  };

  const handleRemoveDelay = (patientId) => {
    setPatients(patients.map(p => 
      p.id === patientId ? { ...p, status: 'waiting', delayReason: null } : p
    ));
  };

  return (
    <PageLayout
      title="Nurse Dashboard"
      subtitle="Patient queue management and vital signs recording"
      fullWidth
    >
      <div className="space-y-8 p-8">
        {/* Banner and summary cards */}
        <div className="bg-emerald-600 text-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-4">Nurse's Patient Queue</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-emerald-500/30 backdrop-blur border-emerald-300/50 text-white">
              <div className="p-4 flex flex-col items-center text-center">
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-sm font-medium">Patients Waiting</h2>
                  <ClipboardList size={20} />
                </div>
                <p className="text-4xl font-bold my-1">{waitingPatients.length}</p>
                <p className="text-xs opacity-80">Patients waiting and delayed</p>
              </div>
            </Card>

            <Card className="bg-emerald-500/30 backdrop-blur border-emerald-300/50 text-white">
              <div className="p-4 flex flex-col items-center text-center">
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-sm font-medium">Ready for Doctor</h2>
                  <UserCheck size={20} />
                </div>
                <p className="text-4xl font-bold my-1">{readyPatients.length}</p>
                <p className="text-xs opacity-80">Vitals taken, ready for doctor</p>
              </div>
            </Card>

            <Card className="bg-emerald-500/30 backdrop-blur border-emerald-300/50 text-white">
              <div className="p-4 flex flex-col items-center text-center">
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-sm font-medium">Seeing Doctor</h2>
                  <User size={20} />
                </div>
                <p className="text-4xl font-bold my-1">{seeingDoctorPatients.length}</p>
                <p className="text-xs opacity-80">Currently in doctor's room</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              type="search" 
              placeholder="Search by patient name..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="min-w-[180px]">
            <select 
              className="h-10 px-4 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="all">All Appointments</option>
              <option value="next_2_hours">Next 2 Hours</option>
              <option value="next_4_hours">Next 4 Hours</option>
              <option value="morning">Morning (AM)</option>
              <option value="afternoon">Afternoon (PM)</option>
            </select>
          </div>
          <Button 
            variant="outline"
            className="flex items-center space-x-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={() => navigate('/nurse/emr')}
          >
            <FileText size={16} />
            <span>Patient EMR</span>
          </Button>
        </div>

        {/* Patient tabs and cards */}
        <Tabs defaultValue="waiting" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="waiting">Appointed Patients</TabsTrigger>
            <TabsTrigger value="ready">Ready for Doctor</TabsTrigger>
            <TabsTrigger value="seeing">Seeing Doctor</TabsTrigger>
          </TabsList>
          
          {/* Waiting patients tab */}
          <TabsContent value="waiting" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waitingPatients.map(patient => (
                <PatientCard 
                  key={patient.id} 
                  patient={patient} 
                  onMarkReady={handleMarkReady} 
                  onDelayPatient={handleDelayPatient}
                  onSaveVitals={handleSaveVitals}
                  onRemoveDelay={handleRemoveDelay}
                />
              ))}
              {waitingPatients.length === 0 && (
                <div className="col-span-3 text-center py-10">
                  <p className="text-gray-500">No patients waiting</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Ready for doctor tab */}
          <TabsContent value="ready" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyPatients.map(patient => (
                <PatientCard 
                  key={patient.id} 
                  patient={patient} 
                  onMarkReady={handleMarkReady}
                  onDelayPatient={handleDelayPatient}
                  onSaveVitals={handleSaveVitals}
                  onRemoveDelay={handleRemoveDelay}
                  readyTab={true}
                />
              ))}
              {readyPatients.length === 0 && (
                <div className="col-span-3 text-center py-10">
                  <p className="text-gray-500">No patients ready for doctor</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Seeing doctor tab */}
          <TabsContent value="seeing" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seeingDoctorPatients.map(patient => (
                <PatientCard 
                  key={patient.id} 
                  patient={patient}
                  onRemoveDelay={handleRemoveDelay}
                  readOnly={true}
                />
              ))}
              {seeingDoctorPatients.length === 0 && (
                <div className="col-span-3 text-center py-10">
                  <p className="text-gray-500">No patients currently seeing doctor</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default NurseDashboard;
