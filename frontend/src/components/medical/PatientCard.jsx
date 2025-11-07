import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Clock,
  FileText,
  ClipboardCheck,
  AlertCircle,
  Check,
  X,
  Heart,
  Activity,
  Scale,
  ThermometerSnowflake,
  User,
} from 'lucide-react';
import { FormModal } from '@/components/library';

// Removed bespoke Dialog in favor of library FormModal (accessible)

const PatientCard = ({ 
  patient, 
  onMarkReady, 
  onUnmarkReady,
  onDelayPatient, 
  onSaveVitals,
  onRemoveDelay,
  onStartConsultation,
  onCompleteVisit,
  readOnly = false,
  readyTab = false,
  userRole = 'nurse',
  onViewFullPatientData
}) => {
  const navigate = useNavigate();
  // Form states for nurse role
  const [vitalsForm, setVitalsForm] = useState({
    bp: patient.vitals?.bp || '',
    temp: patient.vitals?.temp || '',
    weight: patient.vitals?.weight || '',
    heartRate: patient.vitals?.heartRate || '',
    urgency: patient.urgency || 'Normal'
  });
  
  // Modal states
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [delayReason, setDelayReason] = useState(patient.delayReason || '');
  const [urgency, setUrgency] = useState(patient.urgency || 'Normal');
  const [notes, setNotes] = useState(patient.notes || '');

  // Role-based navigation handler
  const handleViewFullPatientData = () => {
    if (onViewFullPatientData) {
      onViewFullPatientData(patient);
    } else {
      const route = userRole === 'doctor' ? '/doctor/patient-record' : '/nurse/emr';
      navigate(route, { state: { patient } });
    }
  };

  const statusColors = {
    waiting: "bg-amber-100 text-amber-800",
    delayed: "bg-red-100 text-red-800", 
    ready: "bg-green-100 text-green-800",
    called: "bg-green-100 text-green-800", // Waiting for doctor - green like ready
    seeing_doctor: "bg-blue-100 text-blue-800",
    serving: "bg-blue-100 text-blue-800", // In consultation - blue
    completed: "bg-purple-100 text-purple-800",
    missed: "bg-gray-100 text-gray-800",
    cancelled: "bg-gray-100 text-gray-800"
  };
  
  const urgencyColors = {
    'Normal': "bg-blue-100 text-blue-800",
    'Priority': "bg-orange-100 text-orange-800",
    'Urgent': "bg-red-100 text-red-800"
  };

  // Get formatted status text
  const getStatusText = (status) => {
    switch (status) {
      case 'waiting': return 'Waiting';
      case 'delayed': return 'Delayed';
      case 'ready': return 'Waiting for Doctor';
      case 'called': return 'Waiting for Doctor'; // Nurse marked ready
      case 'seeing_doctor': return 'In Consultation';
      case 'serving': return 'In Consultation'; // Same as seeing_doctor
      case 'completed': return 'Completed';
      case 'missed': return 'Missed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  // Role-based button configuration
  const getActionButtons = () => {
    const buttons = [];

    // Common button for all roles - View Full Patient Data
    buttons.push(
      <Button 
        key="view-data"
        variant="outline" 
        className="w-full flex justify-center items-center h-11 text-base font-medium"
        onClick={handleViewFullPatientData}
      >
        <FileText size={18} className="mr-2" /> 
        {userRole === 'doctor' ? 'View Medical Record' : 'View Full Patient Data'}
      </Button>
    );

    if (userRole === 'nurse' && !readOnly) {
      // Nurse-specific buttons based on patient status
      if (patient.status === 'waiting') {
        // Check if vitals exist for this patient/visit
        console.log(`[PatientCard] Token #${patient.token_number} - Checking vitals:`, {
          hasLatestVitals: !!patient.latestVitals,
          latestVitals: patient.latestVitals,
          vitalsKeys: patient.latestVitals ? Object.keys(patient.latestVitals) : []
        });
        
        const hasVitals = patient.latestVitals && (
          patient.latestVitals.heart_rate ||
          patient.latestVitals.blood_pressure_systolic ||
          patient.latestVitals.temperature ||
          patient.latestVitals.weight
        );
        
        console.log(`[PatientCard] Token #${patient.token_number} - Has vitals?`, hasVitals);
        
        // For waiting patients, first they need vitals, then can be marked ready
        if (!hasVitals) {
          buttons.unshift(
            <Button 
              key="add-vitals"
              variant="outline" 
              className="w-full flex justify-center items-center border-blue-200 text-blue-700 hover:bg-blue-50 h-11 text-base font-medium"
              onClick={() => setIsVitalsModalOpen(true)}
            >
              <FileText size={18} className="mr-2" /> Add Vitals & Notes
            </Button>
          );
        } else {
          buttons.unshift(
            <>
              <Button 
                key="mark-ready"
                variant="default" 
                className="w-full flex justify-center items-center bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-base font-medium"
                onClick={() => onMarkReady(patient.id)}
              >
                <ClipboardCheck size={18} className="mr-2" /> Mark Ready for Doctor
              </Button>
              <Button 
                key="edit-vitals"
                variant="outline" 
                className="w-full flex justify-center items-center border-orange-200 text-orange-700 hover:bg-orange-50 h-11 text-base font-medium"
                onClick={() => setIsVitalsModalOpen(true)}
              >
                <FileText size={18} className="mr-2" /> Edit Vitals & Notes
              </Button>
            </>
          );
        }
      } else if (patient.status === 'ready' || patient.status === 'called') {
        // Patient is ready - nurse can unmark ready or edit vitals
        buttons.unshift(
          <>
            <Button 
              key="unmark-ready"
              variant="outline" 
              className="w-full flex justify-center items-center border-yellow-200 text-yellow-700 hover:bg-yellow-50 h-11 text-base font-medium"
              onClick={() => onUnmarkReady?.(patient.id)}
            >
              <X size={18} className="mr-2" /> Unmark Ready
            </Button>
            <Button 
              key="edit-vitals"
              variant="outline" 
              className="w-full flex justify-center items-center border-orange-200 text-orange-700 hover:bg-orange-50 h-11 text-base font-medium"
              onClick={() => setIsVitalsModalOpen(true)}
            >
              <FileText size={18} className="mr-2" /> Edit Vitals & Notes
            </Button>
          </>
        );
      }

      // Delay functionality for any non-delayed status
      if (patient.status !== 'delayed' && patient.status !== 'serving' && patient.status !== 'completed') {
        buttons.push(
          <Button 
            key="delay"
            variant="destructive" 
            className="w-full flex justify-center items-center h-11 text-base font-medium"
            onClick={() => setIsDelayModalOpen(true)}
          >
            <AlertCircle size={18} className="mr-2" /> Delay Patient
          </Button>
        );
      } else if (patient.status === 'delayed') {
        buttons.push(
          <>
            <Button 
              key="update-delay"
              variant="destructive" 
              className="w-full flex justify-center items-center h-11 text-base font-medium"
              onClick={() => setIsDelayModalOpen(true)}
            >
              <AlertCircle size={18} className="mr-2" /> Update Delay Reason
            </Button>
            <Button 
              key="remove-delay"
              variant="outline" 
              className="w-full flex justify-center items-center border-green-200 text-green-700 hover:bg-green-50 h-11 text-base font-medium"
              onClick={() => onRemoveDelay?.(patient.id)}
            >
              <Check size={18} className="mr-2" /> Remove Delay
            </Button>
          </>
        );
      }
    } else if (userRole === 'doctor') {
      // Doctor-specific buttons
      if (patient.status === 'ready' || patient.status === 'called' || patient.status === 'delayed') {
        buttons.unshift(
          <Button 
            key="start-consultation"
            variant="default" 
            className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white h-11 text-base font-medium"
            onClick={() => onStartConsultation?.(patient.id)}
          >
            <User size={18} className="mr-2" /> Start Consultation
          </Button>
        );
      }

      if (patient.status === 'seeing_doctor' || patient.status === 'serving') {
        buttons.unshift(
          <Button 
            key="complete-visit"
            variant="default" 
            className="w-full flex justify-center items-center bg-green-600 hover:bg-green-700 text-white h-11 text-base font-medium"
            onClick={() => onCompleteVisit?.(patient.id)}
          >
            <ClipboardCheck size={18} className="mr-2" /> Complete Visit
          </Button>
        );
      }
    }

    return buttons;
  };

  // Check if patient is high priority (priority >= 4)
  const isHighPriority = patient.priority >= 4;
  const isUrgent = patient.priority === 5;

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col ${
      isUrgent 
        ? 'border-2 border-red-500 shadow-red-100 ring-2 ring-red-200' 
        : isHighPriority 
        ? 'border-2 border-orange-400 shadow-orange-100 ring-2 ring-orange-200' 
        : ''
    }`}>
      {/* Priority Badge Banner - Compact */}
      {isHighPriority && (
        <div className={`${
          isUrgent ? 'bg-red-500' : 'bg-orange-500'
        } text-white text-center py-0.5 px-2 font-semibold text-xs flex items-center justify-center gap-1.5`}>
          <span className="text-sm">⭐</span>
          <span>{isUrgent ? 'URGENT' : 'PRIORITY'}</span>
        </div>
      )}
      <div className={`p-5 md:p-6 flex flex-col flex-1 ${
        isUrgent ? 'bg-red-50/30' : isHighPriority ? 'bg-orange-50/30' : ''
      }`}>
        {/* Header section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {isHighPriority && (
                <span className="text-xl">⭐</span>
              )}
              <h3 className="text-xl font-semibold text-gray-900 truncate">
                {patient.name}
              </h3>
              {patient.tokenNumber && (
                <Badge className={`text-lg font-bold px-2 py-1 ${
                  isUrgent 
                    ? 'bg-red-100 text-red-800 border-red-300' 
                    : isHighPriority 
                    ? 'bg-orange-100 text-orange-800 border-orange-300'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  #{patient.tokenNumber}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center mb-2">
              <Badge variant="outline" className="text-sm">
                <Clock size={14} className="mr-1" />
                {patient.appointmentTime}
              </Badge>
              {patient.urgency && (
                <Badge className={urgencyColors[patient.urgency]}>
                  {patient.urgency}
                </Badge>
              )}
            </div>
            <div className="mb-2">
              <Badge 
                className={`${statusColors[patient.status]} text-base px-3 py-1 font-medium`}
              >
                {getStatusText(patient.status)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Patient info grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-base mb-4">
          <div className="flex items-center text-gray-600">
            <User size={18} className="mr-2" />
            <span>{`${patient.age || patient.patient?.age || '-'} years, ${patient.gender || patient.patient?.gender || '-'}`}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Heart size={18} className="mr-2" />
            <span>{patient.latestVitals?.heart_rate || patient.vitals?.heartRate || '-'} bpm</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Activity size={18} className="mr-2" />
            <span>
              {patient.latestVitals?.blood_pressure_systolic && patient.latestVitals?.blood_pressure_diastolic
                ? `${patient.latestVitals.blood_pressure_systolic}/${patient.latestVitals.blood_pressure_diastolic}`
                : patient.vitals?.bp || '-'
              }
            </span>
          </div>
          <div className="flex items-center text-gray-600">
            <ThermometerSnowflake size={18} className="mr-2" />
            <span>
              {patient.latestVitals?.temperature
                ? `${patient.latestVitals.temperature}°${patient.latestVitals.temperature_unit || 'C'}`
                : patient.vitals?.temp ? `${patient.vitals.temp}°F` : '-'
              }
            </span>
          </div>
          <div className="flex items-center text-gray-600">
            <Scale size={18} className="mr-2" />
            <span>
              {patient.latestVitals?.weight
                ? `${patient.latestVitals.weight} ${patient.latestVitals.weight_unit || 'kg'}`
                : patient.vitals?.weight ? `${patient.vitals.weight} kg` : '-'
              }
            </span>
          </div>
        </div>

        {/* Show delay reason if patient is delayed */}
        {patient.status === 'delayed' && patient.delayReason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle size={16} className="text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-red-800 mb-1">Delay Reason:</div>
                <div className="text-sm text-red-700">{patient.delayReason}</div>
              </div>
            </div>
          </div>
        )}

        {/* Show clinical notes if available */}
        {patient.notes && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <FileText size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-blue-800 mb-1">Clinical Notes:</div>
                <div className="text-sm text-blue-700">{patient.notes}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-auto pt-4">
          {getActionButtons()}
        </div>
      </div>

      {/* Nurse-only modals */}
      {userRole === 'nurse' && (
        <>
          <FormModal
            isOpen={isVitalsModalOpen}
            onOpenChange={setIsVitalsModalOpen}
            title={`${patient.vitalsRecorded ? 'Edit' : 'Add'} Vitals & Notes for ${patient.name}`}
            submitText="Save Vitals"
            onSubmit={(e) => {
              // Preserve existing save logic
              const resolvedPatientId = patient?.patientId ?? patient?.patient_id ?? patient?.patient?.id ?? patient?.id;
              if (!resolvedPatientId) {
                // eslint-disable-next-line no-console
                console.error('[PatientCard] Unable to resolve patient ID for vitals save:', patient);
                alert('Could not determine patient ID. Please refresh and try again.');
                return;
              }
              const visitId = patient?.visit_id ?? patient?.current_visit_id ?? patient?.latestVitals?.visit_id ?? null;
              onSaveVitals(resolvedPatientId, vitalsForm, notes, visitId);
              setIsVitalsModalOpen(false);
            }}
          >
            {/* Vitals form content */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    <Heart size={16} className="inline mr-1" />
                    Blood Pressure
                  </label>
                  <Input
                    name="bp"
                    placeholder="e.g., 120/80"
                    value={vitalsForm.bp}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, bp: e.target.value }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    <ThermometerSnowflake size={16} className="inline mr-1" />
                    Temperature (°F)
                  </label>
                  <Input
                    name="temp"
                    placeholder="e.g., 98.6"
                    value={vitalsForm.temp}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, temp: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    <Scale size={16} className="inline mr-1" />
                    Weight (kg)
                  </label>
                  <Input
                    name="weight"
                    placeholder="e.g., 70"
                    value={vitalsForm.weight}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    <Activity size={16} className="inline mr-1" />
                    Heart Rate (bpm)
                  </label>
                  <Input
                    name="heartRate"
                    placeholder="e.g., 72"
                    value={vitalsForm.heartRate}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, heartRate: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Priority Level
                </label>
                <select
                  value={vitalsForm.priorityLevel || vitalsForm.urgency || 'normal'}
                  onChange={(e) => setVitalsForm(prev => ({ ...prev, priorityLevel: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Clinical Notes
                </label>
                <textarea
                  placeholder="Additional observations or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] resize-none"
                />
              </div>
              
            </div>
          </FormModal>

          <FormModal
            isOpen={isDelayModalOpen}
            onOpenChange={setIsDelayModalOpen}
            title={patient.status === 'delayed' ? 'Update Delay Reason' : 'Delay Patient'}
            submitText={patient.status === 'delayed' ? 'Update Delay' : 'Confirm Delay'}
            submitDisabled={!delayReason.trim()}
            onSubmit={() => {
              if (delayReason.trim()) {
                onDelayPatient(patient.id, delayReason.trim());
                setIsDelayModalOpen(false);
                setDelayReason('');
              }
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  {patient.status === 'delayed' ? 'Update delay reason:' : 'Reason for delay:'}
                </label>
                <textarea
                  placeholder="Enter reason for delaying this patient..."
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-none"
                />
              </div>
            </div>
          </FormModal>
        </>
      )}
    </Card>
  );
};

export default PatientCard;
