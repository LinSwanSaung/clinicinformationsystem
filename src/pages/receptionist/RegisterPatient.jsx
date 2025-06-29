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
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  Camera, 
  UserPlus,
  Save,
  ArrowLeft
} from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import Alert from '@/components/Alert';
import { cn } from '@/lib/utils';

const RegisterPatient = () => {
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: undefined,
    idNumber: '',
    contact: '',
    email: '',
    address: '',
  });
  const [photoPreview, setPhotoPreview] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateSelect = (date) => {
    setFormData(prev => ({
      ...prev,
      dateOfBirth: date
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would normally submit the data to your backend
    setShowAlert(true);
  };

  return (
    <PageLayout
      title="Register New Patient"
      subtitle="Enter patient details to create a new record"
    >
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex justify-end mb-6">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-border text-foreground hover:bg-accent"
            onClick={() => navigate('/receptionist/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Photo Upload Card */}
          <Card className="md:col-span-4 bg-card border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-card-foreground">Patient Photo</CardTitle>
              <CardDescription className="text-muted-foreground">Upload a clear photo of the patient</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-48 h-48 rounded-full bg-muted flex items-center justify-center overflow-hidden mb-4">
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Patient preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <label className="w-full">
                <Button 
                  className="w-full border-border text-foreground hover:bg-accent" 
                  variant="outline" 
                  onClick={() => document.getElementById('photo-upload').click()}
                >
                  Choose Photo
                </Button>
                <input
                  type="file"
                  id="photo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </label>
            </CardContent>
          </Card>

          {/* Patient Details Form */}
          <Card className="md:col-span-8 bg-card border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-card-foreground">Patient Information</CardTitle>
              <CardDescription className="text-muted-foreground">Fill in the required patient details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Full Name
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter patient's full name"
                      className="border-input"
                      required
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Date of Birth
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal border-input',
                            !formData.dateOfBirth && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dateOfBirth ? (
                            format(formData.dateOfBirth, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover border-border">
                        <Calendar
                          mode="single"
                          selected={formData.dateOfBirth}
                          onSelect={handleDateSelect}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                          className="text-popover-foreground"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* ID Number */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      ID Number
                    </label>
                    <Input
                      name="idNumber"
                      value={formData.idNumber}
                      onChange={handleInputChange}
                      placeholder="Enter ID number"
                      className="border-input"
                      required
                    />
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Contact Number
                    </label>
                    <Input
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      placeholder="Enter contact number"
                      className="border-input"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Email Address
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      className="border-input"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Address
                    </label>
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter address"
                      className="border-input"
                    />
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border text-foreground hover:bg-accent"
                    onClick={() => navigate('/receptionist/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register Patient
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {showAlert && (
        <Alert
          type="success"
          title="Patient Registered Successfully!"
          message="The patient has been added to the system. You can now proceed to schedule an appointment."
          showConfirm={true}
          onConfirm={() => {
            setShowAlert(false);
            navigate('/receptionist/appointments');
          }}
          onClose={() => {
            setShowAlert(false);
            navigate('/receptionist/dashboard');
          }}
        />
      )}
    </PageLayout>
  );
};

export default RegisterPatient;
