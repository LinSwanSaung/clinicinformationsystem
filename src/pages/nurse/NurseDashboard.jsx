import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Search, 
  FileText 
} from 'lucide-react';
import PatientCard from '../../components/medical/PatientCard';
import { PatientStats } from '../../components/medical/PatientStats';
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
        {/* Patient Stats */}
        <PatientStats patients={patients} userRole="nurse" />

        {/* Search and actions bar */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input 
              type="search" 
              placeholder="Search by patient name..." 
              className="pl-10 h-12 text-base" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="min-w-[200px]">
            <select 
              className="h-12 px-4 py-2 text-base rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
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
            className="flex items-center space-x-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-12 px-6 text-base"
            onClick={() => navigate('/nurse/emr')}
          >
            <FileText size={18} />
            <span>Patient EMR</span>
          </Button>
        </div>

        {/* Patient tabs and cards */}
        <Tabs defaultValue="waiting" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-6 h-12">
            <TabsTrigger value="waiting" className="text-base">Waiting</TabsTrigger>
            <TabsTrigger value="ready" className="text-base">Ready</TabsTrigger>
            <TabsTrigger value="completed" className="text-base">Completed</TabsTrigger>
          </TabsList>
          
          {/* Waiting patients tab */}
          <TabsContent value="waiting" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No patients waiting</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Ready for doctor tab */}
          <TabsContent value="ready" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No patients ready for doctor</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Completed tab */}
          <TabsContent value="completed" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {seeingDoctorPatients.map(patient => (
                <PatientCard 
                  key={patient.id} 
                  patient={patient}
                  onRemoveDelay={handleRemoveDelay}
                  readOnly={true}
                />
              ))}
              {seeingDoctorPatients.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No patients currently seeing doctor</p>
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
