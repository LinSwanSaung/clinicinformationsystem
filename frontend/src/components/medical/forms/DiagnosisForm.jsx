import React from 'react';

/**
 * Diagnosis Form Component
 * Reusable form for adding/editing diagnoses
 */
const DiagnosisForm = ({ 
  diagnosis, 
  onChange, 
  disabled = false 
}) => {
  const handleChange = (field, value) => {
    onChange({ ...diagnosis, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Diagnosis Name *
        </label>
        <input
          type="text"
          placeholder="e.g., Hypertension, Type 2 Diabetes, etc."
          value={diagnosis.diagnosis_name}
          onChange={(e) => handleChange('diagnosis_name', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          ICD-10 Code
        </label>
        <input
          type="text"
          placeholder="e.g., I10, E11.9, etc."
          value={diagnosis.icd_10_code}
          onChange={(e) => handleChange('icd_10_code', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Category
        </label>
        <select
          value={diagnosis.category}
          onChange={(e) => handleChange('category', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="comorbidity">Comorbidity</option>
          <option value="rule-out">Rule-out</option>
          <option value="working">Working Diagnosis</option>
          <option value="differential">Differential</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Status
        </label>
        <select
          value={diagnosis.status}
          onChange={(e) => handleChange('status', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="inactive">Inactive</option>
          <option value="recurrence">Recurrence</option>
          <option value="remission">Remission</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Diagnosis Date
        </label>
        <input
          type="date"
          value={diagnosis.diagnosis_date}
          onChange={(e) => handleChange('diagnosis_date', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Clinical Notes
        </label>
        <textarea
          placeholder="Additional clinical observations, symptoms, or treatment notes..."
          value={diagnosis.clinical_notes}
          onChange={(e) => handleChange('clinical_notes', e.target.value)}
          disabled={disabled}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
    </div>
  );
};

export default DiagnosisForm;