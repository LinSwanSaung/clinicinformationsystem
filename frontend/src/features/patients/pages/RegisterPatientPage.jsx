import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarIcon, UserPlus, Save, ArrowLeft } from 'lucide-react';
import { AlertModal } from '@/components/library';
import PageLayout from '@/components/layout/PageLayout';
import { patientService } from '@/features/patients';
import { useFeedback } from '@/contexts/FeedbackContext';
import logger from '@/utils/logger';

const RegisterPatient = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showSuccess } = useFeedback();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [isLoading, setIsLoading] = useState(false);

  // Form state matching database schema
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: null, // Start as null so user must select a date
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    blood_group: '',
    allergies: '',
    medical_conditions: '',
    current_medications: '',
    insurance_provider: '',
    insurance_number: '',
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Collect validation errors
    const errors = [];

    if (!formData.first_name?.trim()) {
      errors.push(t('receptionist.registerPatient.validation.firstNameRequired'));
    }
    if (!formData.last_name?.trim()) {
      errors.push(t('receptionist.registerPatient.validation.lastNameRequired'));
    }
    if (!formData.date_of_birth) {
      errors.push(t('receptionist.registerPatient.validation.dobRequired'));
    }
    if (!formData.gender) {
      errors.push(t('receptionist.registerPatient.validation.genderRequired'));
    }

    if (errors.length > 0) {
      setAlertType('error');
      setAlertMessage(errors.join('. ') + '.');
      setShowAlert(true);
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for API - only include non-empty optional fields
      // Backend Joi validation rejects empty strings for optional fields
      const patientData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        date_of_birth: formData.date_of_birth.toISOString().split('T')[0],
        gender: formData.gender,
      };

      // Only add optional fields if they have values
      if (formData.phone?.trim()) {
        patientData.phone = formData.phone.trim();
      }
      if (formData.email?.trim()) {
        patientData.email = formData.email.trim();
      }
      if (formData.address?.trim()) {
        patientData.address = formData.address.trim();
      }
      if (formData.emergency_contact_name?.trim()) {
        patientData.emergency_contact_name = formData.emergency_contact_name.trim();
      }
      if (formData.emergency_contact_phone?.trim()) {
        patientData.emergency_contact_phone = formData.emergency_contact_phone.trim();
      }
      if (formData.emergency_contact_relationship?.trim()) {
        patientData.emergency_contact_relationship = formData.emergency_contact_relationship.trim();
      }
      if (formData.blood_group) {
        patientData.blood_group = formData.blood_group;
      }
      if (formData.allergies?.trim()) {
        patientData.allergies = formData.allergies.trim();
      }
      if (formData.medical_conditions?.trim()) {
        patientData.medical_conditions = formData.medical_conditions.trim();
      }
      if (formData.current_medications?.trim()) {
        patientData.current_medications = formData.current_medications.trim();
      }
      if (formData.insurance_provider?.trim()) {
        patientData.insurance_provider = formData.insurance_provider.trim();
      }
      if (formData.insurance_number?.trim()) {
        patientData.insurance_number = formData.insurance_number.trim();
      }

      logger.debug('Sending patient data:', patientData);
      const response = await patientService.createPatient(patientData);
      logger.debug('Response from server:', response);

      if (response.success) {
        // Show toast notification
        const _patientName = `${formData.first_name} ${formData.last_name}`;
        const patientNumber = response.data?.patient_number || '';
        showSuccess(
          `${t('receptionist.registerPatient.registeredSuccess')} ${patientNumber ? `(ID: ${patientNumber})` : ''}`
        );

        setAlertType('success');
        setAlertMessage(t('receptionist.registerPatient.registeredSuccess'));
        setShowAlert(true);

        // Navigate after delay
        setTimeout(() => {
          navigate('/receptionist/dashboard');
        }, 2000);
      } else {
        setAlertType('error');
        setAlertMessage(response.message || 'Failed to register patient');
        setShowAlert(true);
      }
    } catch (error) {
      logger.error('Error registering patient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageLayout
        title={t('receptionist.registerPatient.title')}
        subtitle={t('receptionist.registerPatient.subtitle')}
        titleIcon={<UserPlus className="h-8 w-8" />}
      >
        <div className="mx-auto max-w-4xl p-6">
          {showAlert && (
            <AlertModal
              type={alertType}
              message={alertMessage}
              onClose={() => setShowAlert(false)}
            />
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {t('receptionist.registerPatient.formTitle')}
                  </CardTitle>
                  <CardDescription>
                    {t('receptionist.registerPatient.formDescription')}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/receptionist/dashboard')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('receptionist.registerPatient.back')}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="border-b pb-2 text-lg font-semibold">
                    {t('receptionist.registerPatient.personalInfo')}
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('receptionist.registerPatient.firstName')} *
                      </label>
                      <Input
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder={t('receptionist.registerPatient.enterFirstName')}
                        className="h-11"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('receptionist.registerPatient.lastName')} *
                      </label>
                      <Input
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder={t('receptionist.registerPatient.enterLastName')}
                        className="h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('receptionist.registerPatient.dateOfBirth')} *
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-11 w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.date_of_birth ? (
                              format(formData.date_of_birth, 'PPP')
                            ) : (
                              <span>{t('receptionist.registerPatient.pickDate')}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.date_of_birth}
                            onSelect={(date) => handleInputChange('date_of_birth', date)}
                            allowPastDates={true}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('receptionist.registerPatient.gender')} *
                      </label>
                      <Select onValueChange={(value) => handleInputChange('gender', value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue
                            placeholder={t('receptionist.registerPatient.selectGender')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">{t('common.male')}</SelectItem>
                          <SelectItem value="Female">{t('common.female')}</SelectItem>
                          <SelectItem value="Other">{t('common.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="border-b pb-2 text-lg font-semibold">
                    {t('receptionist.registerPatient.contactInfo')}
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('receptionist.registerPatient.phone')}
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder={t('receptionist.registerPatient.enterPhone')}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('receptionist.registerPatient.email')}
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder={t('receptionist.registerPatient.enterEmail')}
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {t('receptionist.registerPatient.address')}
                    </label>
                    <Input
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder={t('receptionist.registerPatient.enterAddress')}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="border-b pb-2 text-lg font-semibold">
                    {t('receptionist.registerPatient.emergencyContact')}
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('receptionist.registerPatient.contactName')}
                      </label>
                      <Input
                        value={formData.emergency_contact_name}
                        onChange={(e) =>
                          handleInputChange('emergency_contact_name', e.target.value)
                        }
                        placeholder={t('receptionist.registerPatient.enterContactName')}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('receptionist.registerPatient.contactPhone')}
                      </label>
                      <Input
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) =>
                          handleInputChange('emergency_contact_phone', e.target.value)
                        }
                        placeholder={t('receptionist.registerPatient.enterContactPhone')}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('receptionist.registerPatient.relationship')}
                      </label>
                      <Input
                        value={formData.emergency_contact_relationship}
                        onChange={(e) =>
                          handleInputChange('emergency_contact_relationship', e.target.value)
                        }
                        placeholder={t('receptionist.registerPatient.enterRelationship')}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <h3 className="border-b pb-2 text-lg font-semibold">
                    {t('receptionist.registerPatient.medicalInfo')}
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('receptionist.registerPatient.bloodGroup')}
                      </label>
                      <Select onValueChange={(value) => handleInputChange('blood_group', value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue
                            placeholder={t('receptionist.registerPatient.selectBloodGroup')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {t('receptionist.registerPatient.allergies')}
                    </label>
                    <Input
                      value={formData.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                      placeholder={t('receptionist.registerPatient.enterAllergies')}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {t('receptionist.registerPatient.medicalConditions')}
                    </label>
                    <Input
                      value={formData.medical_conditions}
                      onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                      placeholder={t('receptionist.registerPatient.enterMedicalConditions')}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {t('receptionist.registerPatient.currentMedications')}
                    </label>
                    <Input
                      value={formData.current_medications}
                      onChange={(e) => handleInputChange('current_medications', e.target.value)}
                      placeholder={t('receptionist.registerPatient.enterMedications')}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Insurance Information */}
                <div className="space-y-4">
                  <h3 className="border-b pb-2 text-lg font-semibold">
                    {t('receptionist.registerPatient.insuranceInfo')}
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('receptionist.registerPatient.insuranceProvider')}
                      </label>
                      <Input
                        value={formData.insurance_provider}
                        onChange={(e) => handleInputChange('insurance_provider', e.target.value)}
                        placeholder={t('receptionist.registerPatient.enterInsuranceProvider')}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('receptionist.registerPatient.insuranceNumber')}
                      </label>
                      <Input
                        value={formData.insurance_number}
                        onChange={(e) => handleInputChange('insurance_number', e.target.value)}
                        placeholder={t('receptionist.registerPatient.enterInsuranceNumber')}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col gap-4 pt-6 sm:flex-row">
                  <Button type="submit" size="lg" className="h-12 flex-1" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading
                      ? t('receptionist.registerPatient.registering')
                      : t('receptionist.registerPatient.registerPatient')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-12 flex-1"
                    onClick={() => navigate('/receptionist/dashboard')}
                    disabled={isLoading}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </div>
  );
};

export default RegisterPatient;
