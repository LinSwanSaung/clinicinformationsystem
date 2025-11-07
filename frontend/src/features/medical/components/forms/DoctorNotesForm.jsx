import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MedicationForm } from './MedicationForm';

export const DoctorNotesForm = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isEditing = false,
  className = '',
}) => {
  const handleInputChange = (field, value) => {
    onChange((prev) => ({ ...prev, [field]: value }));
  };

  const handleMedicationChange = (medications) => {
    onChange((prev) => ({ ...prev, medications }));
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
        <label className="mb-2 block text-sm font-medium text-gray-700">
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
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Clinical Notes <span className="text-red-500">*</span>
        </label>
        <textarea
          className="min-h-[120px] w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <div className="flex justify-end space-x-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isEditing ? 'Update Note' : 'Save Note'}
        </Button>
      </div>
    </form>
  );
};
