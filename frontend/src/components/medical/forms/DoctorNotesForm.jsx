import React from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { MedicationForm } from './MedicationForm';

export const DoctorNotesForm = ({ 
  formData, 
  onChange, 
  onSubmit, 
  onCancel,
  isEditing = false,
  className = "" 
}) => {
  const handleInputChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const handleMedicationChange = (medications) => {
    onChange(prev => ({ ...prev, medications }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.diagnosis?.trim() && formData.note?.trim()) {
      onSubmit(e);
    }
  };

  const isValid = formData.diagnosis?.trim() && formData.note?.trim();

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Diagnosis <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.diagnosis || ''}
          onChange={(e) => handleInputChange('diagnosis', e.target.value)}
          placeholder="Enter primary diagnosis..."
          required
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Clinical Notes <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-none"
          value={formData.note || ''}
          onChange={(e) => handleInputChange('note', e.target.value)}
          placeholder="Enter your clinical observations, treatment plan, and recommendations..."
          required
        />
      </div>

      <MedicationForm
        medications={formData.medications || [{ name: '', dosage: '', reason: '' }]}
        onChange={handleMedicationChange}
      />

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEditing ? 'Update Note' : 'Save Note'}
        </Button>
      </div>
    </form>
  );
};
