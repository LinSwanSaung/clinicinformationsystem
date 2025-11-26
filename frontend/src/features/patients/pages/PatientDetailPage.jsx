import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  UserCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  AlertTriangle,
  Pill,
  Shield,
  ClipboardList,
  AlertCircle,
  Edit,
} from 'lucide-react';
import { patientService } from '@/features/patients';
import { allergyService, diagnosisService } from '@/features/medical';
import PageLayout from '@/components/layout/PageLayout';
import { FormModal } from '@/components/library';
import logger from '@/utils/logger';
import { useFeedback } from '@/contexts/FeedbackContext';

const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useFeedback();
  const { t } = useTranslation();
  const [patient, setPatient] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
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

  // Handle opening edit modal
  const handleEditClick = () => {
    setEditFormData({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || '',
      emergency_contact_relationship: patient.emergency_contact_relationship || '',
      blood_group: patient.blood_group || '',
      allergies: patient.allergies || '',
      medical_conditions: patient.medical_conditions || '',
      current_medications: patient.current_medications || '',
      insurance_provider: patient.insurance_provider || '',
      insurance_number: patient.insurance_number || '',
    });
    setIsEditModalOpen(true);
  };

  // Handle input change in edit form
  const handleEditInputChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save patient updates
  const handleSavePatient = async () => {
    try {
      // Validate required fields
      if (!editFormData.first_name || !editFormData.last_name) {
        showError('Please fill in all required fields (First Name, Last Name)');
        return;
      }

      // Build update data with only non-empty fields to avoid Joi validation errors
      const updateData = {
        first_name: editFormData.first_name?.trim(),
        last_name: editFormData.last_name?.trim(),
      };

      // Only include optional fields if they have non-empty values
      if (editFormData.date_of_birth) {
        updateData.date_of_birth = editFormData.date_of_birth;
      }
      if (editFormData.gender?.trim()) {
        updateData.gender = editFormData.gender.trim();
      }
      if (editFormData.phone?.trim()) {
        updateData.phone = editFormData.phone.trim();
      }
      if (editFormData.email?.trim()) {
        updateData.email = editFormData.email.trim();
      }
      if (editFormData.address?.trim()) {
        updateData.address = editFormData.address.trim();
      }
      if (editFormData.emergency_contact_name?.trim()) {
        updateData.emergency_contact_name = editFormData.emergency_contact_name.trim();
      }
      if (editFormData.emergency_contact_phone?.trim()) {
        updateData.emergency_contact_phone = editFormData.emergency_contact_phone.trim();
      }
      if (editFormData.emergency_contact_relationship?.trim()) {
        updateData.emergency_contact_relationship =
          editFormData.emergency_contact_relationship.trim();
      }
      if (editFormData.blood_group?.trim()) {
        updateData.blood_group = editFormData.blood_group.trim();
      }
      if (editFormData.allergies?.trim()) {
        updateData.allergies = editFormData.allergies.trim();
      }
      if (editFormData.medical_conditions?.trim()) {
        updateData.medical_conditions = editFormData.medical_conditions.trim();
      }
      if (editFormData.current_medications?.trim()) {
        updateData.current_medications = editFormData.current_medications.trim();
      }
      if (editFormData.insurance_provider?.trim()) {
        updateData.insurance_provider = editFormData.insurance_provider.trim();
      }
      if (editFormData.insurance_number?.trim()) {
        updateData.insurance_number = editFormData.insurance_number.trim();
      }

      setIsSaving(true);
      const response = await patientService.updatePatient(id, updateData);

      if (response.success) {
        setPatient(response.data);
        setIsEditModalOpen(false);
        showSuccess('Patient information updated successfully!');
      } else {
        showError('Failed to update patient information');
      }
    } catch (error) {
      logger.error('Error updating patient:', error);
      showError('Error updating patient information');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const loadPatient = async () => {
      try {
        setIsLoading(true);
        const response = await patientService.getPatientById(id);
        if (response.success) {
          setPatient(response.data);

          // Load allergies and diagnoses
          try {
            const allergiesData = await allergyService.getAllergiesByPatient(id);
            setAllergies(Array.isArray(allergiesData) ? allergiesData : []);
          } catch (allergyError) {
            logger.error('Error loading allergies:', allergyError);
            setAllergies([]);
          }

          try {
            const diagnosesData = await diagnosisService.getDiagnosesByPatient(id, true);
            setDiagnoses(Array.isArray(diagnosesData) ? diagnosesData : []);
          } catch (diagnosisError) {
            logger.error('Error loading diagnoses:', diagnosisError);
            setDiagnoses([]);
          }
        } else {
          setError('Patient not found');
        }
      } catch (error) {
        logger.error('Error loading patient:', error);
        setError('Failed to load patient details');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadPatient();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageLayout title={t('common.loading')} subtitle={t('common.loading')}>
          <div className="flex h-64 items-center justify-center">
            <p className="text-lg text-muted-foreground">
              {t('receptionist.patients.loadingPatients')}
            </p>
          </div>
        </PageLayout>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-background">
        <PageLayout title={t('common.error')} subtitle={t('receptionist.patients.patientNotFound')}>
          <div className="flex h-64 flex-col items-center justify-center space-y-4">
            <p className="text-lg text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/receptionist/patients')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('receptionist.patients.backToPatients')}
            </Button>
          </div>
        </PageLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageLayout
        title={`${patient.first_name} ${patient.last_name}`}
        subtitle={`Patient #${patient.patient_number}`}
        titleIcon={<UserCircle className="h-8 w-8" />}
      >
        <div className="mx-auto max-w-6xl space-y-6 p-6">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => navigate('/receptionist/patients')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('receptionist.patients.backToPatientList')}
          </Button>

          {/* Patient Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <UserCircle className="h-6 w-6" />
                  {t('receptionist.patients.patientInformation')}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {t('receptionist.patients.editPatient')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('receptionist.patients.fullName')}
                  </p>
                  <p className="text-lg">
                    {patient.first_name} {patient.last_name}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('receptionist.patients.patientNumber')}
                  </p>
                  <p className="text-lg">{patient.patient_number}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('receptionist.patients.dateOfBirth')}
                  </p>
                  <p className="text-lg">
                    {patient.date_of_birth
                      ? new Date(patient.date_of_birth).toLocaleDateString()
                      : t('receptionist.patients.na')}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('receptionist.patients.gender')}
                  </p>
                  <p className="text-lg">{patient.gender || t('receptionist.patients.na')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('receptionist.patients.bloodGroup')}
                  </p>
                  {patient.blood_group ? (
                    <Badge variant="secondary" className="text-base">
                      {patient.blood_group}
                    </Badge>
                  ) : (
                    <p className="text-lg text-muted-foreground">
                      {t('receptionist.patients.notSpecified')}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('receptionist.patients.registrationDate')}
                  </p>
                  <p className="text-lg">
                    {patient.created_at
                      ? new Date(patient.created_at).toLocaleDateString()
                      : t('receptionist.patients.na')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Phone className="h-6 w-6" />
                {t('receptionist.patients.contactInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span>{patient.phone || t('receptionist.patients.na')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span>{patient.email || t('receptionist.patients.na')}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
                    <span>{patient.address || t('receptionist.patients.na')}</span>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">
                    {t('receptionist.patients.emergencyContact')}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>{t('receptionist.registerPatient.contactName')}:</strong>{' '}
                      {patient.emergency_contact_name || t('receptionist.patients.na')}
                    </p>
                    <p>
                      <strong>{t('receptionist.patients.phone')}:</strong>{' '}
                      {patient.emergency_contact_phone || t('receptionist.patients.na')}
                    </p>
                    <p>
                      <strong>{t('receptionist.patients.relationship')}:</strong>{' '}
                      {patient.emergency_contact_relationship || t('receptionist.patients.na')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Heart className="h-6 w-6" />
                {t('receptionist.patients.medicalInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Known Allergies */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <h4 className="font-semibold">{t('receptionist.patients.knownAllergies')}</h4>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    {allergies && allergies.length > 0 ? (
                      <div className="space-y-3">
                        {allergies.map((allergy, index) => (
                          <div
                            key={allergy.id || index}
                            className="flex items-start justify-between border-b border-amber-200 pb-3 last:border-0 last:pb-0"
                          >
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <Badge
                                  variant="destructive"
                                  className="border-red-300 bg-red-100 text-red-800"
                                >
                                  {allergy.allergy_name}
                                </Badge>
                                {allergy.severity && (
                                  <Badge
                                    variant="outline"
                                    className={
                                      allergy.severity === 'life-threatening'
                                        ? 'border-red-600 text-red-600'
                                        : allergy.severity === 'severe'
                                          ? 'border-orange-600 text-orange-600'
                                          : allergy.severity === 'moderate'
                                            ? 'border-yellow-600 text-yellow-600'
                                            : 'border-gray-600 text-gray-600'
                                    }
                                  >
                                    {allergy.severity}
                                  </Badge>
                                )}
                                {allergy.allergen_type && (
                                  <span className="text-xs capitalize text-gray-500">
                                    ({allergy.allergen_type})
                                  </span>
                                )}
                              </div>
                              {allergy.reaction && (
                                <p className="mt-1 text-sm text-gray-600">
                                  <strong>Reaction:</strong> {allergy.reaction}
                                </p>
                              )}
                              {allergy.notes && (
                                <p className="mt-1 text-sm text-gray-600">
                                  <strong>{t('receptionist.appointments.notes')}:</strong>{' '}
                                  {allergy.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-amber-700">{t('receptionist.patients.noAllergies')}</p>
                    )}
                  </div>
                </div>

                {/* Diagnosis History */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-blue-500" />
                    <h4 className="font-semibold">{t('receptionist.patients.diagnoses')}</h4>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                    {diagnoses && diagnoses.length > 0 ? (
                      <div className="space-y-3">
                        {diagnoses.map((diagnosis, index) => (
                          <div
                            key={diagnosis.id || index}
                            className="border-b border-blue-200 pb-3 last:border-0 last:pb-0"
                          >
                            <div className="mb-1 flex items-start justify-between">
                              <div className="flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                  <span className="font-medium text-gray-900">
                                    {diagnosis.diagnosis_name}
                                  </span>
                                  {diagnosis.diagnosis_code && (
                                    <Badge variant="outline" className="text-xs">
                                      {diagnosis.diagnosis_code}
                                    </Badge>
                                  )}
                                  {diagnosis.status && (
                                    <Badge
                                      variant="outline"
                                      className={
                                        diagnosis.status === 'active'
                                          ? 'border-green-600 text-green-600'
                                          : diagnosis.status === 'resolved'
                                            ? 'border-blue-600 text-blue-600'
                                            : diagnosis.status === 'chronic'
                                              ? 'border-purple-600 text-purple-600'
                                              : 'border-gray-600 text-gray-600'
                                      }
                                    >
                                      {diagnosis.status}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                  {diagnosis.diagnosed_date && (
                                    <span>
                                      {t('receptionist.patients.diagnosedOn')}:{' '}
                                      {new Date(diagnosis.diagnosed_date).toLocaleDateString()}
                                    </span>
                                  )}
                                  {diagnosis.severity && (
                                    <span className="capitalize">
                                      {t('receptionist.patients.severity')}: {diagnosis.severity}
                                    </span>
                                  )}
                                </div>
                                {diagnosis.notes && (
                                  <p className="mt-2 text-sm text-gray-600">
                                    <strong>{t('receptionist.appointments.notes')}:</strong>{' '}
                                    {diagnosis.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-blue-700">{t('receptionist.patients.noDiagnoses')}</p>
                    )}
                  </div>
                </div>

                {/* Old text fields - keep for reference if not in separate tables */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">
                        {t('receptionist.patients.medicalConditions')}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {patient.medical_conditions || t('receptionist.patients.na')}
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Pill className="h-5 w-5 text-blue-500" />
                      <h4 className="font-medium">
                        {t('receptionist.patients.currentMedications')}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {patient.current_medications || t('receptionist.patients.na')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6" />
                {t('receptionist.patients.insuranceInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('receptionist.patients.insuranceProvider')}
                  </p>
                  <p className="text-lg">
                    {patient.insurance_provider || t('receptionist.patients.na')}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('receptionist.patients.insuranceNumber')}
                  </p>
                  <p className="text-lg">
                    {patient.insurance_number || t('receptionist.patients.na')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button size="lg" onClick={() => navigate('/receptionist/register-patient')}>
              <Calendar className="mr-2 h-4 w-4" />
              {t('receptionist.patients.scheduleAppointment')}
            </Button>
          </div>
        </div>

        {/* Edit Patient Modal */}
        <FormModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          title={t('receptionist.patients.editPatientInfo')}
          size="xl"
          onSubmit={handleSavePatient}
          cancelText={t('common.cancel')}
          submitText={t('receptionist.patients.saveChanges')}
          isLoading={isSaving}
          submitDisabled={!editFormData.first_name || !editFormData.last_name}
        >
          <div className="max-h-[60vh] space-y-6 overflow-y-auto px-2">
            {/* Personal Information */}
            <div>
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <UserCircle className="h-4 w-4" />
                {t('receptionist.registerPatient.personalInfo')}
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit-first-name">
                    {t('receptionist.registerPatient.firstName')} *
                  </Label>
                  <Input
                    id="edit-first-name"
                    value={editFormData.first_name}
                    onChange={(e) => handleEditInputChange('first_name', e.target.value)}
                    placeholder={t('receptionist.registerPatient.enterFirstName')}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-last-name">
                    {t('receptionist.registerPatient.lastName')} *
                  </Label>
                  <Input
                    id="edit-last-name"
                    value={editFormData.last_name}
                    onChange={(e) => handleEditInputChange('last_name', e.target.value)}
                    placeholder={t('receptionist.registerPatient.enterLastName')}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-dob">{t('receptionist.registerPatient.dateOfBirth')}</Label>
                  <Input
                    id="edit-dob"
                    type="date"
                    value={editFormData.date_of_birth}
                    onChange={(e) => handleEditInputChange('date_of_birth', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-gender">{t('receptionist.registerPatient.gender')}</Label>
                  <select
                    id="edit-gender"
                    value={editFormData.gender}
                    onChange={(e) => handleEditInputChange('gender', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t('receptionist.registerPatient.selectGender')}</option>
                    <option value="Male">{t('common.male')}</option>
                    <option value="Female">{t('common.female')}</option>
                    <option value="Other">{t('common.other')}</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-blood-group">
                    {t('receptionist.registerPatient.bloodGroup')}
                  </Label>
                  <select
                    id="edit-blood-group"
                    value={editFormData.blood_group}
                    onChange={(e) => handleEditInputChange('blood_group', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t('receptionist.registerPatient.selectBloodGroup')}</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Phone className="h-4 w-4" />
                {t('receptionist.registerPatient.contactInfo')}
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit-phone">{t('receptionist.registerPatient.phone')}</Label>
                  <Input
                    id="edit-phone"
                    value={editFormData.phone}
                    onChange={(e) => handleEditInputChange('phone', e.target.value)}
                    placeholder={t('receptionist.registerPatient.enterPhone')}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">{t('receptionist.registerPatient.email')}</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => handleEditInputChange('email', e.target.value)}
                    placeholder={t('receptionist.registerPatient.enterEmail')}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="edit-address">{t('receptionist.registerPatient.address')}</Label>
                  <Textarea
                    id="edit-address"
                    value={editFormData.address}
                    onChange={(e) => handleEditInputChange('address', e.target.value)}
                    placeholder={t('receptionist.registerPatient.enterAddress')}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <AlertTriangle className="h-4 w-4" />
                {t('receptionist.registerPatient.emergencyContact')}
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit-emergency-name">
                    {t('receptionist.registerPatient.contactName')}
                  </Label>
                  <Input
                    id="edit-emergency-name"
                    value={editFormData.emergency_contact_name}
                    onChange={(e) =>
                      handleEditInputChange('emergency_contact_name', e.target.value)
                    }
                    placeholder={t('receptionist.registerPatient.enterContactName')}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-emergency-phone">
                    {t('receptionist.registerPatient.contactPhone')}
                  </Label>
                  <Input
                    id="edit-emergency-phone"
                    value={editFormData.emergency_contact_phone}
                    onChange={(e) =>
                      handleEditInputChange('emergency_contact_phone', e.target.value)
                    }
                    placeholder={t('receptionist.registerPatient.enterContactPhone')}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-emergency-relationship">
                    {t('receptionist.registerPatient.relationship')}
                  </Label>
                  <Input
                    id="edit-emergency-relationship"
                    value={editFormData.emergency_contact_relationship}
                    onChange={(e) =>
                      handleEditInputChange('emergency_contact_relationship', e.target.value)
                    }
                    placeholder={t('receptionist.registerPatient.enterRelationship')}
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Heart className="h-4 w-4" />
                {t('receptionist.registerPatient.medicalInfo')}
              </h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-allergies">
                    {t('receptionist.registerPatient.allergies')}
                  </Label>
                  <Textarea
                    id="edit-allergies"
                    value={editFormData.allergies}
                    onChange={(e) => handleEditInputChange('allergies', e.target.value)}
                    placeholder={t('receptionist.registerPatient.enterAllergies')}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-conditions">
                    {t('receptionist.registerPatient.medicalConditions')}
                  </Label>
                  <Textarea
                    id="edit-conditions"
                    value={editFormData.medical_conditions}
                    onChange={(e) => handleEditInputChange('medical_conditions', e.target.value)}
                    placeholder={t('receptionist.registerPatient.enterMedicalConditions')}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-medications">
                    {t('receptionist.registerPatient.currentMedications')}
                  </Label>
                  <Textarea
                    id="edit-medications"
                    value={editFormData.current_medications}
                    onChange={(e) => handleEditInputChange('current_medications', e.target.value)}
                    placeholder={t('receptionist.registerPatient.enterMedications')}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Insurance Information */}
            <div>
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Shield className="h-4 w-4" />
                {t('receptionist.registerPatient.insuranceInfo')}
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit-insurance-provider">
                    {t('receptionist.registerPatient.insuranceProvider')}
                  </Label>
                  <Input
                    id="edit-insurance-provider"
                    value={editFormData.insurance_provider}
                    onChange={(e) => handleEditInputChange('insurance_provider', e.target.value)}
                    placeholder={t('receptionist.registerPatient.enterInsuranceProvider')}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-insurance-number">
                    {t('receptionist.registerPatient.insuranceNumber')}
                  </Label>
                  <Input
                    id="edit-insurance-number"
                    value={editFormData.insurance_number}
                    onChange={(e) => handleEditInputChange('insurance_number', e.target.value)}
                    placeholder={t('receptionist.registerPatient.enterInsuranceNumber')}
                  />
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              * {t('receptionist.patients.updateAllFields')}
            </p>
          </div>
        </FormModal>
      </PageLayout>
    </div>
  );
};

export default PatientDetailPage;
