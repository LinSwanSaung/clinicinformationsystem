import { useRef, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const commonMedications = [
  'Acetaminophen',
  'Ibuprofen',
  'Aspirin',
  'Amoxicillin',
  'Azithromycin',
  'Ciprofloxacin',
  'Doxycycline',
  'Metformin',
  'Lisinopril',
  'Amlodipine',
  'Atorvastatin',
  'Omeprazole',
  'Albuterol',
  'Prednisone',
  'Warfarin',
  'Levothyroxine',
  'Gabapentin',
  'Tramadol',
  'Hydrochlorothiazide',
  'Furosemide',
];

const commonDosages = [
  '5mg',
  '10mg',
  '25mg',
  '50mg',
  '100mg',
  '200mg',
  '500mg',
  '1000mg',
  '1 tablet',
  '2 tablets',
  '1 capsule',
  '2 capsules',
  '5ml',
  '10ml',
  '15ml',
  '1 tsp',
  '2 tsp',
  '1 tbsp',
];

const commonFrequencies = [
  { value: 1, label: 'Once daily' },
  { value: 2, label: 'Twice daily' },
  { value: 3, label: 'Three times daily' },
  { value: 4, label: 'Four times daily' },
  { value: 0.5, label: 'Every other day' },
  { value: 0, label: 'As needed (PRN)' },
];

const commonDurations = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '21 days',
  '30 days',
  '60 days',
  '90 days',
];

export const MedicationForm = ({
  medications,
  onChange,
  className = '',
  showLabel = true,
  canAdd = true,
  canRemove = true,
}) => {
  const customInputRefs = useRef({});

  // Focus custom input when switching to custom mode (called imperatively)
  const focusCustomInput = useCallback((index) => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      customInputRefs.current[index]?.focus();
    }, 0);
  }, []);

  const handleAddMedication = () => {
    if (canAdd) {
      onChange([
        ...medications,
        {
          name: '',
          dosage: '',
          frequency: '',
          frequencyValue: 0,
          duration: '',
          durationDays: 0,
          quantity: '',
          refills: 0,
          instructions: '',
          customName: false,
          customDosage: false,
        },
      ]);
    }
  };

  const handleRemoveMedication = (index) => {
    if (canRemove && medications.length > 1) {
      onChange(medications.filter((_, i) => i !== index));
    }
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = medications.map((med, i) => {
      if (i !== index) {
        return med;
      }

      const updated = { ...med, [field]: value };

      // Auto-calculate quantity when frequency or duration changes
      if (field === 'frequency' || field === 'duration') {
        const freq = field === 'frequency' ? value : med.frequency;
        const dur = field === 'duration' ? value : med.duration;

        // Extract frequency value (times per day)
        let frequencyValue = 0;
        if (freq) {
          const freqOption = commonFrequencies.find((f) => f.label === freq);
          frequencyValue = freqOption ? freqOption.value : 0;
        }

        // Extract duration in days
        let durationDays = 0;
        if (dur) {
          const match = dur.match(/(\d+)\s*day/i);
          if (match) {
            durationDays = parseInt(match[1]);
          }
        }

        // Calculate quantity (frequency per day × number of days)
        if (frequencyValue > 0 && durationDays > 0) {
          updated.quantity = Math.ceil(frequencyValue * durationDays).toString();
        } else if (frequencyValue === 0) {
          // "As needed" - default to reasonable quantity
          updated.quantity = '';
        }

        updated.frequencyValue = frequencyValue;
        updated.durationDays = durationDays;
      }

      return updated;
    });

    onChange(updatedMedications);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">
            Prescribed Medications
          </label>
          {canAdd && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMedication}
              className="flex items-center gap-1 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Plus size={14} />
              Add Medication
            </Button>
          )}
        </div>
      )}

      <div className="max-h-[500px] space-y-4 overflow-y-auto">
        {medications.map((medication, index) => (
          <div key={index} className="bg-muted/50 space-y-3 rounded-lg border border-border p-4">
            {/* Header with remove button */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Medication #{index + 1}</span>
              {canRemove && medications.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMedication(index)}
                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                >
                  <X size={16} />
                </Button>
              )}
            </div>

            {/* Row 1: Medication Name and Dosage */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Medication Name <span className="text-red-500">*</span>
                </label>
                {medication.customName ? (
                  <div className="flex gap-2">
                    <Input
                      ref={(el) => {
                        if (el) {
                          customInputRefs.current[index] = el;
                        }
                      }}
                      placeholder="Enter custom medication name..."
                      value={medication.name || ''}
                      onChange={(e) => {
                        // Update name as user types (keep original value, trim on blur)
                        handleMedicationChange(index, 'name', e.target.value);
                      }}
                      onBlur={(e) => {
                        // Trim whitespace when user finishes typing
                        const trimmedName = e.target.value.trim();
                        if (trimmedName !== e.target.value) {
                          handleMedicationChange(index, 'name', trimmedName);
                        }
                      }}
                      className="h-9 flex-1 text-sm"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Switch back to dropdown list view
                        const updated = medications.map((med, i) => {
                          if (i === index) {
                            return { ...med, customName: false, name: '' };
                          }
                          return med;
                        });
                        onChange(updated);
                      }}
                      className="h-9 border-input px-3 text-xs hover:bg-accent"
                    >
                      List
                    </Button>
                  </div>
                ) : (
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    value={medication.customName ? '' : medication.name || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'CUSTOM') {
                        handleMedicationChange(index, 'customName', true);
                        // Focus the custom input after switching to custom mode
                        focusCustomInput(index);
                        // Don't clear name immediately - let user type in custom input
                        // This ensures the medication isn't filtered out during validation
                      } else if (value !== '') {
                        handleMedicationChange(index, 'customName', false);
                        handleMedicationChange(index, 'name', value);
                      }
                    }}
                  >
                    <option value="">Select medication...</option>
                    {commonMedications.map((med, idx) => (
                      <option key={idx} value={med}>
                        {med}
                      </option>
                    ))}
                    <option value="CUSTOM">➕ Custom / Other</option>
                  </select>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Dosage <span className="text-red-500">*</span>
                </label>
                {medication.customDosage ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter custom dosage..."
                      value={medication.dosage || ''}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                      className="h-9 flex-1 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = [...medications];
                        updated[index] = { ...updated[index], customDosage: false, dosage: '' };
                        onChange(updated);
                      }}
                      className="h-9 px-2 text-xs"
                    >
                      List
                    </Button>
                  </div>
                ) : (
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    value={medication.dosage || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'CUSTOM') {
                        const updated = [...medications];
                        updated[index] = { ...updated[index], customDosage: true, dosage: '' };
                        onChange(updated);
                      } else {
                        handleMedicationChange(index, 'dosage', value);
                      }
                    }}
                  >
                    <option value="">Select dosage...</option>
                    {commonDosages.map((dosage, idx) => (
                      <option key={idx} value={dosage}>
                        {dosage}
                      </option>
                    ))}
                    <option value="CUSTOM">➕ Custom / Other</option>
                  </select>
                )}
              </div>
            </div>

            {/* Row 2: Frequency and Duration */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={medication.frequency || ''}
                  onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                >
                  <option value="">Select frequency...</option>
                  {commonFrequencies.map((freq, idx) => (
                    <option key={idx} value={freq.label}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Duration</label>
                <select
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={medication.duration || ''}
                  onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                >
                  <option value="">Select duration...</option>
                  {commonDurations.map((dur, idx) => (
                    <option key={idx} value={dur}>
                      {dur}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Quantity (Auto-calculated) and Refills */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Quantity
                  {medication.quantity && (
                    <span className="ml-1 text-xs text-green-600">(Auto-calculated)</span>
                  )}
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Auto-calculated or enter manually"
                  value={medication.quantity || ''}
                  onChange={(e) => handleMedicationChange(index, 'quantity', e.target.value)}
                  className="h-9 bg-green-50 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Refills</label>
                <select
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={medication.refills || 0}
                  onChange={(e) =>
                    handleMedicationChange(index, 'refills', parseInt(e.target.value))
                  }
                >
                  <option value={0}>No refills (0)</option>
                  <option value={1}>1 refill</option>
                  <option value={2}>2 refills</option>
                  <option value={3}>3 refills</option>
                  <option value={6}>6 refills</option>
                  <option value={11}>11 refills (1 year)</option>
                </select>
              </div>
            </div>

            {/* Row 4: Instructions (full width) */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Instructions</label>
              <textarea
                className="min-h-[60px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Take with food. Avoid alcohol."
                value={medication.instructions || ''}
                onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {medications.length === 0 && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          No medications prescribed
        </div>
      )}
    </div>
  );
};
