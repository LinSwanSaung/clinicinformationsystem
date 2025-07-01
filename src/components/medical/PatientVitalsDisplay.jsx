import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Activity,
  Heart,
  ThermometerSnowflake,
  Scale
} from 'lucide-react';

const PatientVitalsDisplay = ({ vitals, onAddVitals, onEditVitals, showAddButton = false, showEditButton = false, className = "" }) => {
  const vitalsData = [
    {
      key: 'bp',
      label: 'Blood Pressure',
      icon: Heart,
      color: 'text-red-500',
      unit: '',
      value: vitals?.bp
    },
    {
      key: 'heartRate',
      label: 'Heart Rate',
      icon: Activity,
      color: 'text-green-500',
      unit: 'bpm',
      value: vitals?.heartRate
    },
    {
      key: 'temp',
      label: 'Temperature',
      icon: ThermometerSnowflake,
      color: 'text-blue-500',
      unit: '°F',
      value: vitals?.temp
    },
    {
      key: 'weight',
      label: 'Weight',
      icon: Scale,
      color: 'text-purple-500',
      unit: 'kg',
      value: vitals?.weight
    }
  ];

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity size={24} className="text-emerald-600" />
          <h3 className="text-lg font-bold">Current Vitals</h3>
        </div>
        <div className="flex space-x-2">
          {showAddButton && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm px-4 py-2"
              onClick={onAddVitals}
            >
              + Add Vitals
            </Button>
          )}
          {showEditButton && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm px-4 py-2"
              onClick={onEditVitals}
            >
              Edit Vitals
            </Button>
          )}
        </div>
      </div>
      
      {vitals ? (
        <div className="space-y-4">
          {vitalsData.map(({ key, label, icon: Icon, color, unit, value }) => 
            value && (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon size={20} className={color} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span className="font-bold text-lg">{value}{unit}</span>
              </div>
            )
          )}
        </div>
      ) : (
        <p className="text-gray-500 italic text-sm">No vitals recorded yet</p>
      )}
    </Card>
  );
};

export default PatientVitalsDisplay;
