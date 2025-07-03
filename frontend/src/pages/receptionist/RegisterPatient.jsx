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
import Alert from '@/components/Alert';
import PageLayout from '@/components/PageLayout';

const RegisterPatient = () => {
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  const [date, setDate] = useState(new Date());

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowAlert(true);
    setTimeout(() => {
      navigate('/receptionist/patients');
    }, 2000);
  };

  return (
    <PageLayout
      title="Register New Patient"
      subtitle="Add a new patient to the system"
      fullWidth
    >
      <div className="space-y-8 p-8">
        {showAlert && (
          <Alert
            type="success"
            message="Patient registered successfully!"
            onClose={() => setShowAlert(false)}
          />
        )}

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 text-lg py-6 px-8"
          >
            <ArrowLeft className="h-6 w-6" />
            Back
          </Button>
        </div>

        <Card className="bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Patient Information</CardTitle>
            <CardDescription className="text-lg">Enter the patient's basic information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-lg font-medium block mb-2">Full Name</label>
                    <Input 
                      placeholder="Enter patient's full name" 
                      className="h-12 text-lg border-2 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-lg font-medium block mb-2">Date of Birth</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-12 font-normal text-lg justify-start text-left border-2 hover:border-primary"
                        >
                          <CalendarIcon className="mr-3 h-5 w-5" />
                          {date ? format(date, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-lg font-medium block mb-2">Contact Number</label>
                    <Input 
                      type="tel" 
                      placeholder="Enter contact number" 
                      className="h-12 text-lg border-2 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-lg font-medium block mb-2">Email Address</label>
                    <Input 
                      type="email" 
                      placeholder="Enter email address" 
                      className="h-12 text-lg border-2 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-lg font-medium block mb-2">Address</label>
                    <Input 
                      placeholder="Enter full address" 
                      className="h-12 text-lg border-2 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-lg font-medium block mb-2">Emergency Contact</label>
                    <Input 
                      placeholder="Emergency contact number" 
                      className="h-12 text-lg border-2 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="pt-6">
                <h3 className="text-xl font-semibold mb-6">Medical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-lg font-medium block mb-2">Medical History</label>
                    <Input 
                      placeholder="Enter relevant medical history" 
                      className="h-12 text-lg border-2 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-lg font-medium block mb-2">Current Medications</label>
                    <Input 
                      placeholder="List current medications" 
                      className="h-12 text-lg border-2 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-lg font-medium block mb-2">Allergies</label>
                    <Input 
                      placeholder="List any allergies" 
                      className="h-12 text-lg border-2 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-lg font-medium block mb-2">Blood Type</label>
                    <Input 
                      placeholder="Enter blood type" 
                      className="h-12 text-lg border-2 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="text-lg py-6 px-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6 px-8"
                >
                  <Save className="mr-2 h-5 w-5" />
                  Register Patient
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default RegisterPatient;
