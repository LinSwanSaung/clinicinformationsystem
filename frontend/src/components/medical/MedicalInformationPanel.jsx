import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, AlertCircle, ClipboardList, Pill } from 'lucide-react';

const MedicalInformationPanel = ({ 
  patient, 
  onAddAllergy,
  onAddDiagnosis,
  className = "",
  showActionButtons = true
}) => {
  return (
    <Card className={`p-6 lg:col-span-2 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <FileText size={24} className="text-blue-600" />
        <h3 className="text-lg font-bold">Medical Information</h3>
      </div>
      
      <div className="space-y-6">
        {/* Known Allergies */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800 flex items-center text-sm">
              <AlertCircle size={18} className="mr-2 text-amber-500" />
              Known Allergies
            </h4>
            {showActionButtons && onAddAllergy && (
              <Button variant="outline" size="sm" className="text-xs px-3 py-1" onClick={onAddAllergy}>
                + Add Allergy
              </Button>
            )}
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            {patient.allergies && patient.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy, index) => (
                  <Badge key={index} variant="destructive" className="bg-red-100 text-red-800 border-red-300 text-sm px-3 py-1">
                    {allergy}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-amber-700 text-base">No known allergies</p>
            )}
          </div>
        </div>

        {/* Diagnosis History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800 flex items-center text-sm">
              <ClipboardList size={18} className="mr-2 text-blue-500" />
              Diagnosis History
            </h4>
            {showActionButtons && onAddDiagnosis && (
              <Button variant="outline" size="sm" className="text-xs px-3 py-1" onClick={onAddDiagnosis}>
                + Add Diagnosis
              </Button>
            )}
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            {patient.diagnosisHistory && patient.diagnosisHistory.length > 0 ? (
              <div className="space-y-2">
                {patient.diagnosisHistory.map((diagnosis, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-base">{diagnosis.condition}</span>
                    <span className="text-sm text-gray-500">{diagnosis.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-blue-700 text-base">No diagnosis history available</p>
            )}
          </div>
        </div>

        {/* Current Medications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800 flex items-center text-sm">
              <Pill size={18} className="mr-2 text-green-500" />
              Current Medications/Prescriptions
            </h4>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            {patient.currentMedications && patient.currentMedications.length > 0 ? (
              <div className="space-y-2">
                {patient.currentMedications.map((medication, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="text-base font-medium">{medication.name}</span>
                      <span className="text-sm text-gray-600 ml-2">({medication.dosage})</span>
                    </div>
                    <span className="text-sm text-gray-500">{medication.frequency}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-700 text-base">No current medications</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MedicalInformationPanel;
