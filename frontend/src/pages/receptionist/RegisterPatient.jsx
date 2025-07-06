import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import {
  CalendarIcon,
  UserPlus,
  Save,
  ArrowLeft
} from 'lucide-react';
import Alert from '@/components/Alert';
import PageLayout from '@/components/PageLayout';
import patientService from '@/services/patientService';

const RegisterPatient = () => {
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state matching database schema
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: new Date(),
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
    insurance_number: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.first_name || !formData.last_name) {
      setAlertType('error');
      setAlertMessage('First name and last name are required fields.');
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare data for API
      const patientData = {
        ...formData,
        date_of_birth: formData.date_of_birth.toISOString().split('T')[0], // Format as YYYY-MM-DD
      };

      console.log('Sending patient data:', patientData);
      const response = await patientService.createPatient(patientData);
      console.log('Response from server:', response);
      
      if (response.success) {
        setAlertType('success');
        setAlertMessage('Patient registered successfully!');
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
      console.error('Error registering patient:', error);
      setAlertType('error');
      setAlertMessage(`Failed to register patient: ${error.message || 'Please try again.'}`);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageLayout 
        title="Register New Patient"
        subtitle="Add a new patient to the system"
        titleIcon={<UserPlus className="h-8 w-8" />}
      >
        <div className="max-w-4xl mx-auto p-6">
          {showAlert && (
            <Alert 
              type={alertType}
              message={alertMessage}
              onClose={() => setShowAlert(false)}
            />
          )}
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Patient Registration</CardTitle>
                  <CardDescription>
                    Complete the form below to register a new patient
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/receptionist/dashboard')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">First Name *</label>
                      <Input
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Enter first name"
                        className="h-11"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Last Name *</label>
                      <Input
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Enter last name"
                        className="h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Date of Birth</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-11 font-normal justify-start text-left"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.date_of_birth ? format(formData.date_of_birth, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.date_of_birth}
                            onSelect={(date) => handleInputChange('date_of_birth', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Gender</label>
                      <Select onValueChange={(value) => handleInputChange('gender', value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Phone Number</label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Email</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter email address"
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Address</label>
                    <Input
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter full address"
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Emergency Contact</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Contact Name</label>
                      <Input
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                        placeholder="Enter contact name"
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Contact Phone</label>
                      <Input
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                        placeholder="Enter contact phone"
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Relationship</label>
                      <Input
                        value={formData.emergency_contact_relationship}
                        onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                        placeholder="e.g. Spouse, Parent"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Medical Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Blood Group</label>
                      <Select onValueChange={(value) => handleInputChange('blood_group', value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select blood group" />
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
                    <label className="text-sm font-medium block mb-2">Known Allergies</label>
                    <Input
                      value={formData.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                      placeholder="Enter any known allergies"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Medical Conditions</label>
                    <Input
                      value={formData.medical_conditions}
                      onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                      placeholder="Enter any existing medical conditions"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Current Medications</label>
                    <Input
                      value={formData.current_medications}
                      onChange={(e) => handleInputChange('current_medications', e.target.value)}
                      placeholder="Enter current medications"
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Insurance Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Insurance Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Insurance Provider</label>
                      <Input
                        value={formData.insurance_provider}
                        onChange={(e) => handleInputChange('insurance_provider', e.target.value)}
                        placeholder="Enter insurance provider"
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Insurance Number</label>
                      <Input
                        value={formData.insurance_number}
                        onChange={(e) => handleInputChange('insurance_number', e.target.value)}
                        placeholder="Enter insurance number"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1 h-12"
                    disabled={isLoading}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? 'Registering...' : 'Register Patient'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1 h-12"
                    onClick={() => navigate('/receptionist/dashboard')}
                    disabled={isLoading}
                  >
                    Cancel
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
