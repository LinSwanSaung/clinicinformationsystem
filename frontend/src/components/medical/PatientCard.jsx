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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
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
        className="w-full flex justify-center items-center h-11 text-base font-medium"
        onClick={handleViewFullPatientData}
      >
        <FileText size={18} className="mr-2" /> 
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
            className="w-full flex justify-center items-center border-blue-200 text-blue-700 hover:bg-blue-50 h-11 text-base font-medium"
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

      if (patient.status !== 'delayed') {
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
      } else {
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
      if (patient.status === 'ready' || patient.status === 'delayed') {
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

      if (patient.status === 'seeing_doctor') {
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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="p-5 md:p-6 flex flex-col h-full">
        {/* Header section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 truncate mb-2">
              {patient.name}
            </h3>
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
            <span>{`${patient.age} years, ${patient.gender}`}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Heart size={18} className="mr-2" />
            <span>{patient.vitals?.heartRate || '-'} bpm</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Activity size={18} className="mr-2" />
            <span>{patient.vitals?.bp || '-'}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <ThermometerSnowflake size={18} className="mr-2" />
            <span>{patient.vitals?.temp ? `${patient.vitals.temp}°F` : '-'}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Scale size={18} className="mr-2" />
            <span>{patient.vitals?.weight ? `${patient.vitals.weight} kg` : '-'}</span>
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
          <Dialog
            isOpen={isVitalsModalOpen}
            onClose={() => setIsVitalsModalOpen(false)}
            title={`${patient.vitalsRecorded ? 'Edit' : 'Add'} Vitals & Notes for ${patient.name}`}
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
                  value={vitalsForm.urgency || 'Normal'}
                  onChange={(e) => setVitalsForm(prev => ({ ...prev, urgency: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Normal">Normal</option>
                  <option value="Priority">Priority</option>
                  <option value="Urgent">Urgent</option>
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
              
              <div className="flex space-x-2 pt-4 border-t">
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
            title={patient.status === 'delayed' ? 'Update Delay Reason' : 'Delay Patient'}
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
              <div className="flex space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setIsDelayModalOpen(false);
                  setDelayReason('');
                }}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (delayReason.trim()) {
                      onDelayPatient(patient.id, delayReason.trim());
                      setIsDelayModalOpen(false);
                      setDelayReason('');
                    }
                  }}
                  disabled={!delayReason.trim()}
                >
                  {patient.status === 'delayed' ? 'Update Delay' : 'Confirm Delay'}
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
