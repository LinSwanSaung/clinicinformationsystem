/**
 * Diagnosis Form Component
 * Reusable form for adding/editing diagnoses
 */
const DiagnosisForm = ({ diagnosis, onChange, disabled = false }) => {
  const handleChange = (field, value) => {
    onChange({ ...diagnosis, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Diagnosis Name *</label>
        <input
          type="text"
          placeholder="e.g., Hypertension, Type 2 Diabetes, etc."
          value={diagnosis.diagnosis_name}
          onChange={(e) => handleChange('diagnosis_name', e.target.value)}
          disabled={disabled}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">ICD-10 Code</label>
        <input
          type="text"
          placeholder="e.g., I10, E11.9, etc."
          value={diagnosis.icd_10_code}
          onChange={(e) => handleChange('icd_10_code', e.target.value)}
          disabled={disabled}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Category</label>
        <select
          value={diagnosis.category}
          onChange={(e) => handleChange('category', e.target.value)}
          disabled={disabled}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
        >
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="differential">Differential</option>
          <option value="rule_out">Rule Out</option>
          <option value="chronic">Chronic</option>
          <option value="acute">Acute</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
        <select
          value={diagnosis.status}
          onChange={(e) => handleChange('status', e.target.value)}
          disabled={disabled}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
        >
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="chronic">Chronic</option>
          <option value="in_remission">In Remission</option>
          <option value="recurring">Recurring</option>
          <option value="ruled_out">Ruled Out</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Diagnosis Date</label>
        <input
          type="date"
          value={diagnosis.diagnosis_date || ''}
          onChange={(e) => handleChange('diagnosis_date', e.target.value)}
          disabled={disabled}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Severity</label>
        <select
          value={diagnosis.severity || 'mild'}
          onChange={(e) => handleChange('severity', e.target.value)}
          disabled={disabled}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
        >
          <option value="mild">Mild</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Clinical Notes</label>
        <textarea
          placeholder="Additional clinical observations, symptoms, or treatment notes..."
          value={diagnosis.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          disabled={disabled}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
        />
      </div>
    </div>
  );
};

export default DiagnosisForm;
