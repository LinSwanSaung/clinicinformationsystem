import { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const commonMedications = [
  'Acetaminophen', 'Ibuprofen', 'Aspirin', 'Amoxicillin', 'Azithromycin',
  'Ciprofloxacin', 'Doxycycline', 'Metformin', 'Lisinopril', 'Amlodipine',
  'Atorvastatin', 'Omeprazole', 'Albuterol', 'Prednisone', 'Warfarin',
  'Levothyroxine', 'Gabapentin', 'Tramadol', 'Hydrochlorothiazide', 'Furosemide'
];

const commonDosages = [
  '5mg', '10mg', '25mg', '50mg', '100mg', '200mg', '500mg', '1000mg',
  '1 tablet', '2 tablets', '1 capsule', '2 capsules',
  '5ml', '10ml', '15ml', '1 tsp', '2 tsp', '1 tbsp'
];

const commonFrequencies = [
  { value: 1, label: 'Once daily' },
  { value: 2, label: 'Twice daily' },
  { value: 3, label: 'Three times daily' },
  { value: 4, label: 'Four times daily' },
  { value: 0.5, label: 'Every other day' },
  { value: 0, label: 'As needed (PRN)' }
];

const commonDurations = [
  '3 days', '5 days', '7 days', '10 days', '14 days', 
  '21 days', '30 days', '60 days', '90 days'
];

// Combobox component for autocomplete with free text (reserved for future use)
// eslint-disable-next-line unused-imports/no-unused-vars
const Combobox = ({ value, onChange, options, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 2,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes((inputValue || '').toLowerCase())
  );

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelectOption = (option) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            className="w-full h-9 px-3 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={inputValue || ''}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
          />
          <ChevronDown 
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" 
            size={16}
            onClick={toggleDropdown}
          />
        </div>
      </div>
      
      {/* Portal-style dropdown with fixed positioning */}
      {isOpen && filteredOptions.length > 0 && (
        <div 
          className="fixed z-[9999] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          {filteredOptions.map((option, idx) => (
            <div
              key={idx}
              className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
              onClick={() => handleSelectOption(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export const MedicationForm = ({ 
  medications, 
  onChange, 
  className = "",
  showLabel = true,
  canAdd = true,
  canRemove = true
}) => {
  const customInputRefs = useRef({});
  
  // Focus custom input when it becomes visible
  useEffect(() => {
    medications.forEach((med, index) => {
      if (med.customName && customInputRefs.current[index]) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          customInputRefs.current[index]?.focus();
        }, 0);
      }
    });
  }, [medications]);
  
  const handleAddMedication = () => {
    if (canAdd) {
      onChange([...medications, { 
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
        customDosage: false
      }]);
    }
  };

  const handleRemoveMedication = (index) => {
    if (canRemove && medications.length > 1) {
      onChange(medications.filter((_, i) => i !== index));
    }
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = medications.map((med, i) => {
      if (i !== index) return med;
      
      const updated = { ...med, [field]: value };
      
      // Auto-calculate quantity when frequency or duration changes
      if (field === 'frequency' || field === 'duration') {
        const freq = field === 'frequency' ? value : med.frequency;
        const dur = field === 'duration' ? value : med.duration;
        
        // Extract frequency value (times per day)
        let frequencyValue = 0;
        if (freq) {
          const freqOption = commonFrequencies.find(f => f.label === freq);
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

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {medications.map((medication, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
            {/* Header with remove button */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Medication #{index + 1}</span>
              {canRemove && medications.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMedication(index)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X size={16} />
                </Button>
              )}
            </div>

            {/* Row 1: Medication Name and Dosage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Medication Name <span className="text-red-500">*</span>
                </label>
                {medication.customName ? (
                  <div className="flex gap-2">
                    <Input
                      ref={(el) => {
                        if (el) customInputRefs.current[index] = el;
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
                      className="h-9 text-sm flex-1"
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
                      className="h-9 px-3 text-xs border-gray-300 hover:bg-gray-50"
                    >
                      List
                    </Button>
                  </div>
                ) : (
                  <select
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={medication.customName ? '' : (medication.name || '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'CUSTOM') {
                        handleMedicationChange(index, 'customName', true);
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
                      <option key={idx} value={med}>{med}</option>
                    ))}
                    <option value="CUSTOM">➕ Custom / Other</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Dosage <span className="text-red-500">*</span>
                </label>
                {medication.customDosage ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter custom dosage..."
                      value={medication.dosage || ''}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                      className="h-9 text-sm flex-1"
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
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <option key={idx} value={dosage}>{dosage}</option>
                    ))}
                    <option value="CUSTOM">➕ Custom / Other</option>
                  </select>
                )}
              </div>
            </div>

            {/* Row 2: Frequency and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={medication.frequency || ''}
                  onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                >
                  <option value="">Select frequency...</option>
                  {commonFrequencies.map((freq, idx) => (
                    <option key={idx} value={freq.label}>{freq.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Duration
                </label>
                <select
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={medication.duration || ''}
                  onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                >
                  <option value="">Select duration...</option>
                  {commonDurations.map((dur, idx) => (
                    <option key={idx} value={dur}>{dur}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Quantity (Auto-calculated) and Refills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Quantity 
                  {medication.quantity && (
                    <span className="text-green-600 text-xs ml-1">(Auto-calculated)</span>
                  )}
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Auto-calculated or enter manually"
                  value={medication.quantity || ''}
                  onChange={(e) => handleMedicationChange(index, 'quantity', e.target.value)}
                  className="h-9 text-sm bg-green-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Refills
                </label>
                <select
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={medication.refills || 0}
                  onChange={(e) => handleMedicationChange(index, 'refills', parseInt(e.target.value))}
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
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Instructions
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[60px] resize-none"
                placeholder="e.g., Take with food. Avoid alcohol."
                value={medication.instructions || ''}
                onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
              />
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
