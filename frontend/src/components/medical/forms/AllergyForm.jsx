import React from 'react';

/**
 * Allergy Form Component
 * Reusable form for adding/editing allergies
 */
const AllergyForm = ({ 
  allergy, 
  onChange, 
  disabled = false 
}) => {
  const handleChange = (field, value) => {
    onChange({ ...allergy, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Allergy Name *
        </label>
        <input
          type="text"
          placeholder="e.g., Penicillin, Peanuts, etc."
          value={allergy.allergy_name}
          onChange={(e) => handleChange('allergy_name', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Allergen Type
        </label>
        <select
          value={allergy.allergen_type}
          onChange={(e) => handleChange('allergen_type', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="medication">Medication</option>
          <option value="food">Food</option>
          <option value="environmental">Environmental</option>
          <option value="latex">Latex</option>
          <option value="insect">Insect</option>
          <option value="animal">Animal</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Severity
        </label>
        <select
          value={allergy.severity}
          onChange={(e) => handleChange('severity', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="mild">Mild</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
          <option value="life-threatening">Life-threatening</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Reaction Description
        </label>
        <textarea
          placeholder="e.g., Skin rash, difficulty breathing, swelling..."
          value={allergy.reaction}
          onChange={(e) => handleChange('reaction', e.target.value)}
          disabled={disabled}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
    </div>
  );
};

export default AllergyForm;