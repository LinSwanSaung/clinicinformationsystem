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

// Create the Dialog component for the modals
const Dialog = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const PatientCard = ({ 
  patient, 
  onMarkReady, 
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
  });
  
  // Modal states
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [delayReason, setDelayReason] = useState('');
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
    ready: "bg-emerald-100 text-emerald-800",
    seeing_doctor: "bg-blue-100 text-blue-800",
    completed: "bg-purple-100 text-purple-800"
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
      case 'ready': return 'Ready for Doctor';
      case 'seeing_doctor': return 'With Doctor';
      case 'completed': return 'Completed';
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
        className="w-full flex justify-center items-center py-3 text-base"
        onClick={handleViewFullPatientData}
      >
        <FileText size={16} className="mr-2" /> 
        {userRole === 'doctor' ? 'View Medical Record' : 'View Full Patient Data'}
      </Button>
    );

    if (userRole === 'nurse' && !readOnly) {
      // Nurse-specific buttons
      if (!readyTab && !patient.vitalsRecorded) {
        buttons.unshift(
          <Button 
            key="add-vitals"
            variant="outline" 
            className="w-full flex justify-center items-center border-blue-200 text-blue-700 hover:bg-blue-50 font-medium py-3 text-base"
            onClick={() => setIsVitalsModalOpen(true)}
          >
            <FileText size={18} className="mr-2" /> Add Vitals & Notes
          </Button>
        );
      }

      if (!readyTab && patient.vitalsRecorded) {
        buttons.unshift(
          <>
            <Button 
              key="mark-ready"
              variant="default" 
              className="w-full flex justify-center items-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 text-base"
              onClick={() => onMarkReady(patient.id)}
            >
              <ClipboardCheck size={18} className="mr-2" /> Mark Ready for Doctor
            </Button>
            <Button 
              key="edit-vitals"
              variant="outline" 
              className="w-full flex justify-center items-center border-orange-200 text-orange-700 hover:bg-orange-50 font-medium py-3 text-base"
              onClick={() => setIsVitalsModalOpen(true)}
            >
              <FileText size={18} className="mr-2" /> Edit Vitals & Notes
            </Button>
          </>
        );
      }

      if (patient.status !== 'delayed') {
        buttons.push(
          <Button 
            key="delay"
            variant="destructive" 
            className="w-full flex justify-center items-center py-3 text-base"
            onClick={() => setIsDelayModalOpen(true)}
          >
            <AlertCircle size={16} className="mr-2" /> Delay Patient
          </Button>
        );
      } else {
        buttons.push(
          <>
            <Button 
              key="update-delay"
              variant="destructive" 
              className="w-full flex justify-center items-center py-3 text-base"
              onClick={() => setIsDelayModalOpen(true)}
            >
              <AlertCircle size={16} className="mr-2" /> Update Delay Reason
            </Button>
            <Button 
              key="remove-delay"
              variant="outline" 
              className="w-full flex justify-center items-center border-green-200 text-green-700 hover:bg-green-50 py-3 text-base"
              onClick={() => onRemoveDelay?.(patient.id)}
            >
              <Check size={16} className="mr-2" /> Remove Delay
            </Button>
          </>
        );
      }
    } else if (userRole === 'doctor') {
      // Doctor-specific buttons
      if (patient.status === 'ready') {
        buttons.unshift(
          <Button 
            key="start-consultation"
            variant="default" 
            className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-base"
            onClick={() => onStartConsultation?.(patient.id)}
          >
            <User size={18} className="mr-2" /> Start Consultation
          </Button>
        );
      }

      if (patient.status === 'seeing_doctor') {
        buttons.unshift(
          <Button 
            key="complete-visit"
            variant="default" 
            className="w-full flex justify-center items-center bg-green-600 hover:bg-green-700 text-white font-medium py-3 text-base"
            onClick={() => onCompleteVisit?.(patient.id)}
          >
            <ClipboardCheck size={18} className="mr-2" /> Complete Visit
          </Button>
        );
      }
    }

    return buttons;
  };

  return (
    <Card className="overflow-hidden shadow-lg w-[400px] min-h-[420px] flex flex-col mx-auto border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-200">
      <div className="flex items-center p-4 border-b">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold 
          ${patient.avatarColor || 'bg-blue-500'}`}>
          {patient.initials || patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold">{patient.name}</h3>
            <div className="text-base text-gray-400">ID: {patient.id}</div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center text-base text-gray-500">
              {patient.age && (
                <span className="mr-3">{patient.age} years</span>
              )}
              {patient.gender && (
                <span>{patient.gender}</span>
              )}
            </div>
            {patient.urgency && (
              <Badge className={`${urgencyColors[patient.urgency]} text-base px-3 py-1`}>
                {patient.urgency}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center p-4 bg-gray-50">
        <div className="flex items-center text-base">
          <Clock size={18} className="mr-2 text-gray-500" />
          <span>Appointment:</span>
        </div>
        <span className="font-medium text-base">{patient.appointmentTime}</span>
      </div>
      
      <div className="flex justify-between items-center px-4 py-3">
        <div className="text-base">Status:</div>
        <div className="flex space-x-2">
          <Badge className={`${statusColors[patient.status]} text-base px-4 py-1`}>
            {getStatusText(patient.status)}
          </Badge>
        </div>
      </div>
      
      {patient.delayReason && (
        <div className="px-3 py-2 bg-red-50 text-xs text-red-700">
          <strong>Delay Reason:</strong> {patient.delayReason}
        </div>
      )}
      
      {patient.vitals && patient.vitalsRecorded && (
        <div className="p-4 border-t">
          <h4 className="text-base font-medium mb-3 text-gray-700">Vitals:</h4>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            {patient.vitals.bp && (
              <div className="flex items-center">
                <Activity size={16} className="mr-2 text-gray-500" />
                <span className="text-gray-600 mr-2">BP:</span>
                <span className="font-medium">{patient.vitals.bp}</span>
              </div>
            )}
            {patient.vitals.heartRate && (
              <div className="flex items-center">
                <Heart size={16} className="mr-2 text-gray-500" />
                <span className="text-gray-600 mr-2">BPM:</span>
                <span className="font-medium">{patient.vitals.heartRate}</span>
              </div>
            )}
            {patient.vitals.weight && (
              <div className="flex items-center">
                <Scale size={16} className="mr-2 text-gray-500" />
                <span className="text-gray-600 mr-2">Weight:</span>
                <span className="font-medium">{patient.vitals.weight} kg</span>
              </div>
            )}
            {patient.vitals.temp && (
              <div className="flex items-center">
                <ThermometerSnowflake size={16} className="mr-2 text-gray-500" />
                <span className="text-gray-600 mr-2">Temp:</span>
                <span className="font-medium">{patient.vitals.temp} °F</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {patient.notes && (
        <div className="px-4 py-3 bg-gray-50 text-sm text-gray-700 border-t">
          <strong>Notes:</strong> {patient.notes}
        </div>
      )}

      {/* Action buttons section */}
      <div className="mt-auto p-4 border-t flex flex-col space-y-3 bg-white">
        {getActionButtons()}
      </div>

      {/* Nurse-only modals */}
      {userRole === 'nurse' && (
        <>
          <Dialog
            isOpen={isVitalsModalOpen}
            onClose={() => setIsVitalsModalOpen(false)}
            title={`${patient.vitalsRecorded ? 'Edit' : 'Add'} Vitals & Notes for ${patient.name}`}
          >
            {/* Vitals form content */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">BP</label>
                <Input
                  name="bp"
                  placeholder="e.g., 120/80"
                  value={vitalsForm.bp}
                  onChange={(e) => setVitalsForm(prev => ({ ...prev, bp: e.target.value }))}
                />
              </div>
              {/* Other vital inputs... */}
              <div className="flex space-x-2 pt-2">
                <Button variant="outline" onClick={() => setIsVitalsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  onSaveVitals(patient.id, vitalsForm, notes);
                  setIsVitalsModalOpen(false);
                }}>
                  Save Vitals
                </Button>
              </div>
            </div>
          </Dialog>

          <Dialog
            isOpen={isDelayModalOpen}
            onClose={() => setIsDelayModalOpen(false)}
            title="Delay Patient"
          >
            <div className="space-y-4">
              <Input
                placeholder="Enter delay reason..."
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
              />
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsDelayModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => {
                  onDelayPatient(patient.id, delayReason);
                  setIsDelayModalOpen(false);
                }}>
                  Confirm Delay
                </Button>
              </div>
            </div>
          </Dialog>
        </>
      )}
    </Card>
  );
};

export default PatientCard;
