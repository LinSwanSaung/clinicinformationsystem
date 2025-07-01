import React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

const commonMedications = [
  'Acetaminophen', 'Ibuprofen', 'Aspirin', 'Amoxicillin', 'Azithromycin',
  'Ciprofloxacin', 'Doxycycline', 'Metformin', 'Lisinopril', 'Amlodipine',
  'Atorvastatin', 'Omeprazole', 'Albuterol', 'Prednisone', 'Warfarin',
  'Levothyroxine', 'Gabapentin', 'Tramadol', 'Hydrochlorothiazide', 'Furosemide'
];

const commonDosages = [
  '5mg', '10mg', '25mg', '50mg', '100mg', '200mg', '500mg', '1000mg',
  '1 tablet', '2 tablets', '1 capsule', '2 capsules',
  '5ml', '10ml', '15ml', '1 tsp', '2 tsp', '1 tbsp',
  'Once daily', 'Twice daily', 'Three times daily', 'As needed'
];

export const MedicationForm = ({ 
  medications, 
  onChange, 
  className = "",
  showLabel = true,
  canAdd = true,
  canRemove = true
}) => {
  const handleAddMedication = () => {
    if (canAdd) {
      onChange([...medications, { name: '', dosage: '', reason: '' }]);
    }
  };

  const handleRemoveMedication = (index) => {
    if (canRemove && medications.length > 1) {
      onChange(medications.filter((_, i) => i !== index));
    }
  };

  const handleMedicationChange = (index, field, value) => {
    onChange(medications.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    ));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Prescribed Medications
          </label>
          {canAdd && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMedication}
              className="flex items-center gap-1 text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Plus size={14} />
              Add Medication
            </Button>
          )}
        </div>
      )}

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {medications.map((medication, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Medication Name
              </label>
              <select
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={medication.name}
                onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
              >
                <option value="">Select medication...</option>
                {commonMedications.map(med => (
                  <option key={med} value={med}>{med}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Dosage
              </label>
              <select
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={medication.dosage}
                onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
              >
                <option value="">Select dosage...</option>
                {commonDosages.map(dosage => (
                  <option key={dosage} value={dosage}>{dosage}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Reason
                </label>
                <Input
                  placeholder="Reason for prescription..."
                  value={medication.reason}
                  onChange={(e) => handleMedicationChange(index, 'reason', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              {canRemove && medications.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMedication(index)}
                  className="mt-5 h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X size={14} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {medications.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No medications prescribed
        </div>
      )}
    </div>
  );
};
