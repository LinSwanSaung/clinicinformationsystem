import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Phone, Mail } from 'lucide-react';

const PatientInformationHeader = ({ 
  patient, 
  onBackClick, 
  onClearSelection,
  showBackButton = true,
  showClearButton = true,
  className = ""
}) => {
  // Format patient name
  const fullName = patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
  const initials = patient.initials || `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();
  
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center space-x-6">
        <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${patient.avatarColor || 'bg-blue-500'}`}>
          {initials}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <div className="flex space-x-3">
              {showBackButton && onBackClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackClick}
                  className="text-sm px-4 py-2"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Search
                </Button>
              )}
              {showClearButton && onClearSelection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSelection}
                  className="text-sm px-4 py-2"
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Patient ID:</span>
              <p className="font-medium text-gray-900">{patient.patient_number || patient.id}</p>
            </div>
            <div>
              <span className="text-gray-500">Age:</span>
              <p className="font-medium text-gray-900">
                {patient.age || (patient.date_of_birth 
                  ? Math.floor((new Date() - new Date(patient.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
                  : 'N/A')} years
              </p>
            </div>
            <div>
              <span className="text-gray-500">Gender:</span>
              <p className="font-medium text-gray-900">{patient.gender}</p>
            </div>
            <div>
              <span className="text-gray-500">Blood Type:</span>
              <p className="font-medium text-gray-900">{patient.blood_group || patient.bloodType || 'Not specified'}</p>
            </div>
          </div>
          
          {(patient.phone || patient.email) && (
            <div className="flex space-x-6 mt-4">
              {patient.phone && (
                <div className="flex items-center space-x-2">
                  <Phone size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700">{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center space-x-2">
                  <Mail size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700">{patient.email}</span>
                </div>
              )}
            </div>
          )}
          
          {patient.urgency && (
            <div className="mt-4">
              <Badge className="bg-orange-100 text-orange-800 text-sm px-3 py-1">
                Priority: {patient.urgency}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PatientInformationHeader;
