import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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
  readOnly = false,
  readyTab = false
}) => {
  const navigate = useNavigate();
  // Form states
  const [vitalsForm, setVitalsForm] = useState({
    bp: patient.vitals?.bp || '',
    temp: patient.vitals?.temp || '',
    weight: patient.vitals?.weight || '',
    heartRate: patient.vitals?.heartRate || '',
  });
  
  // Modal dialog states
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [delayReason, setDelayReason] = useState('');
  const [urgency, setUrgency] = useState('Normal');
  const [notes, setNotes] = useState(patient.notes || '');
  
  // Update form when modal opens for editing existing vitals
  useEffect(() => {
    if (isVitalsModalOpen && patient.vitalsRecorded && patient.vitals) {
      setVitalsForm({
        bp: patient.vitals.bp || '',
        temp: patient.vitals.temp || '',
        weight: patient.vitals.weight || '',
        heartRate: patient.vitals.heartRate || '',
      });
      setNotes(patient.notes || '');
      setUrgency(patient.urgency || 'Normal');
    }
  }, [isVitalsModalOpen, patient.vitalsRecorded, patient.vitals, patient.notes, patient.urgency]);
  
  const handleVitalsChange = (e) => {
    setVitalsForm({
      ...vitalsForm,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmitVitals = () => {
    // Check if at least some vital data is entered
    const hasVitalData = vitalsForm.bp || vitalsForm.temp || vitalsForm.weight || vitalsForm.heartRate;
    
    if (!hasVitalData) {
      alert('Please enter at least one vital sign (BP, Heart Rate, Weight, or Temperature) before saving.');
      return;
    }
    
    const updatedVitals = {
      ...vitalsForm,
      urgency: urgency
    };
    
    onSaveVitals(patient.id, updatedVitals, notes);
    setIsVitalsModalOpen(false);
  };

  const handleCloseVitalsModal = () => {
    const hasVitalData = vitalsForm.bp || vitalsForm.temp || vitalsForm.weight || vitalsForm.heartRate || notes;
    
    if (hasVitalData && !patient.vitalsRecorded) {
      const confirmClose = window.confirm('You have unsaved vital signs. Are you sure you want to close without saving?');
      if (!confirmClose) return;
    }
    
    setIsVitalsModalOpen(false);
    // Reset form if closing without saving and patient doesn't have vitals recorded
    if (!patient.vitalsRecorded) {
      setVitalsForm({
        bp: '',
        temp: '',
        weight: '',
        heartRate: '',
      });
      setNotes(patient.notes || '');
      setUrgency('Normal');
    }
  };
  
  const handleDelaySubmit = () => {
    if (!delayReason.trim()) return;
    
    onDelayPatient(patient.id, delayReason);
    setIsDelayModalOpen(false);
    setDelayReason('');
  };

  const handleViewFullPatientData = () => {
    navigate('/nurse/emr', { state: { patient } });
  };

  // Format the appointment time
  const formatTime = (timeString) => {
    return timeString;
  };

  // Generate initial avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };
  
  const statusColors = {
    waiting: "bg-amber-100 text-amber-800",
    delayed: "bg-red-100 text-red-800",
    ready: "bg-emerald-100 text-emerald-800",
    normal: "bg-blue-100 text-blue-800",
  };
  
  const urgencyColors = {
    'Normal': "bg-blue-100 text-blue-800",
    'Priority': "bg-orange-100 text-orange-800",
    'Urgent': "bg-red-100 text-red-800"
  };
  
  return (
    <Card className="overflow-hidden shadow-lg w-[400px] min-h-[420px] flex flex-col mx-auto border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-200">
      <div className="flex items-center p-4 border-b">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold 
          ${patient.avatarColor || 'bg-blue-500'}`}>
          {patient.initials || getInitials(patient.name)}
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
              <Badge className={`${urgencyColors[patient.urgency] || "bg-blue-100 text-blue-800"} text-base px-3 py-1`}>
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
        <span className="font-medium text-base">{formatTime(patient.appointmentTime)}</span>
      </div>
      
      <div className="flex justify-between items-center px-4 py-3">
        <div className="text-base">Status:</div>
        <div className="flex space-x-2">
          <Badge className={`${statusColors[patient.status] || "bg-gray-100"} text-base px-4 py-1`}>
            {patient.status === 'waiting' ? 'Waiting' : 
             patient.status === 'delayed' ? 'Delayed' :
             patient.status === 'ready' ? 'Ready' : 
             patient.status === 'seeing_doctor' ? 'With Doctor' : 'Normal'}
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

      {/* Vitals Modal Dialog */}
      <Dialog
        isOpen={isVitalsModalOpen}
        onClose={handleCloseVitalsModal}
        title={`${patient.vitalsRecorded ? 'Edit' : 'Add'} Vitals & Notes for ${patient.name}`}
      >
        <p className="text-sm text-gray-500 mb-4">
          {patient.vitalsRecorded 
            ? 'Update the patient\'s vital signs and observations.' 
            : 'Fill in the patient\'s vital signs and any initial observations.'}
        </p>
        
        <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> At least one vital sign (BP, Heart Rate, Weight, or Temperature) is required to save.
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">BP</label>
            <Input
              name="bp"
              placeholder="e.g., 120/80"
              value={vitalsForm.bp}
              onChange={handleVitalsChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">BPM</label>
            <Input
              name="heartRate"
              placeholder="e.g., 72"
              value={vitalsForm.heartRate}
              onChange={handleVitalsChange}
              type="number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Weight (kg)</label>
            <Input
              name="weight"
              placeholder="e.g., 70"
              value={vitalsForm.weight}
              onChange={handleVitalsChange}
              type="number"
              step="0.1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Temp (°F)</label>
            <Input
              name="temp"
              placeholder="e.g., 98.6"
              value={vitalsForm.temp}
              onChange={handleVitalsChange}
              type="number"
              step="0.1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Urgency</label>
            <select 
              className="w-full h-10 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
            >
              <option value="Normal">Normal</option>
              <option value="Priority">Priority</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows="3"
              placeholder="Add any relevant notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleCloseVitalsModal}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" 
              onClick={handleSubmitVitals}
            >
              {patient.vitalsRecorded ? 'Update Vitals' : 'Save Vitals'}
            </Button>
          </div>
        </div>
      </Dialog>
      
      {/* Delay Patient Modal */}
      <Dialog
        isOpen={isDelayModalOpen}
        onClose={() => setIsDelayModalOpen(false)}
        title="Delay Patient"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Please provide a reason for delaying this patient.
          </p>
          
          <Input
            placeholder="Enter delay reason..."
            value={delayReason}
            onChange={(e) => setDelayReason(e.target.value)}
          />
          
          <div className="flex space-x-2 pt-2">
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={() => setIsDelayModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1" 
              onClick={handleDelaySubmit}
              disabled={!delayReason.trim()}
            >
              Confirm Delay
            </Button>
          </div>
        </div>
      </Dialog>
      
      {/* Action Buttons */}
      <div className="mt-auto p-4 border-t flex flex-col space-y-3 bg-white">
        {!readOnly && !readyTab && !patient.vitalsRecorded && (
          <Button 
            variant="outline" 
            className="w-full flex justify-center items-center border-blue-200 text-blue-700 hover:bg-blue-50 font-medium py-3 text-base"
            onClick={() => setIsVitalsModalOpen(true)}
          >
            <FileText size={18} className="mr-2" /> Add Vitals & Notes
          </Button>
        )}
        
        {!readOnly && !readyTab && patient.vitalsRecorded && (
          <Button 
            variant="default" 
            className="w-full flex justify-center items-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 text-base"
            onClick={() => onMarkReady(patient.id)}
          >
            <ClipboardCheck size={18} className="mr-2" /> Mark Ready for Doctor
          </Button>
        )}
        
        {!readOnly && !readyTab && patient.vitalsRecorded && (
          <Button 
            variant="outline" 
            className="w-full flex justify-center items-center border-orange-200 text-orange-700 hover:bg-orange-50 font-medium py-3 text-base"
            onClick={() => setIsVitalsModalOpen(true)}
          >
            <FileText size={18} className="mr-2" /> Edit Vitals & Notes
          </Button>
        )}
        
        {!readOnly && patient.status !== 'delayed' && (
          <Button 
            variant="destructive" 
            className="w-full flex justify-center items-center py-3 text-base"
            onClick={() => setIsDelayModalOpen(true)}
          >
            <AlertCircle size={16} className="mr-2" /> 
            Delay Patient
          </Button>
        )}
        
        {!readOnly && patient.status === 'delayed' && (
          <>
            <Button 
              variant="destructive" 
              className="w-full flex justify-center items-center py-3 text-base"
              onClick={() => setIsDelayModalOpen(true)}
            >
              <AlertCircle size={16} className="mr-2" /> 
              Update Delay Reason
            </Button>
            <Button 
              variant="outline" 
              className="w-full flex justify-center items-center border-green-200 text-green-700 hover:bg-green-50 py-3 text-base"
              onClick={() => onRemoveDelay && onRemoveDelay(patient.id)}
            >
              <Check size={16} className="mr-2" /> Remove Delay
            </Button>
          </>
        )}
        
        <Button 
          variant="outline" 
          className="w-full flex justify-center items-center py-3 text-base"
          onClick={handleViewFullPatientData}
        >
          <FileText size={16} className="mr-2" /> View Full Patient Data
        </Button>
      </div>
    </Card>
  );
};

export default PatientCard;
