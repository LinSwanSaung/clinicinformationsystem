import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * PrescriptionForm Component
 * Form for adding prescriptions during consultations
 */
const PrescriptionForm = ({ formData, onChange }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    onChange({ ...formData, [name]: value });
  };

  return (
    <div className="space-y-4">
      {/* Medication Name */}
      <div>
        <Label htmlFor="medication_name" className="text-sm font-medium">
          Medication Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="medication_name"
          name="medication_name"
          placeholder="e.g., Amoxicillin"
          value={formData.medication_name || ''}
          onChange={handleInputChange}
          required
          className="mt-1"
        />
      </div>

      {/* Dosage and Frequency - Side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="dosage" className="text-sm font-medium">
            Dosage <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dosage"
            name="dosage"
            placeholder="e.g., 500mg"
            value={formData.dosage || ''}
            onChange={handleInputChange}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="frequency" className="text-sm font-medium">
            Frequency <span className="text-red-500">*</span>
          </Label>
          <Input
            id="frequency"
            name="frequency"
            placeholder="e.g., 3 times daily"
            value={formData.frequency || ''}
            onChange={handleInputChange}
            required
            className="mt-1"
          />
        </div>
      </div>

      {/* Duration and Quantity - Side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="duration" className="text-sm font-medium">
            Duration
          </Label>
          <Input
            id="duration"
            name="duration"
            placeholder="e.g., 7 days"
            value={formData.duration || ''}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="quantity" className="text-sm font-medium">
            Quantity
          </Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            placeholder="e.g., 21"
            value={formData.quantity || ''}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>
      </div>

      {/* Refills and Status - Side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="refills" className="text-sm font-medium">
            Refills
          </Label>
          <Input
            id="refills"
            name="refills"
            type="number"
            min="0"
            max="12"
            placeholder="0"
            value={formData.refills || 0}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="status" className="text-sm font-medium">
            Status
          </Label>
          <Select
            value={formData.status || 'active'}
            onValueChange={(value) => handleSelectChange('status', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <Label htmlFor="instructions" className="text-sm font-medium">
          Instructions
        </Label>
        <textarea
          id="instructions"
          name="instructions"
          placeholder="e.g., Take with food. Avoid alcohol."
          value={formData.instructions || ''}
          onChange={handleInputChange}
          rows={3}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
};

export default PrescriptionForm;
