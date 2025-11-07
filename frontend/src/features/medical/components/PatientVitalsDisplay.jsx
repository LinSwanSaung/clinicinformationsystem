import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity,
  Heart,
  ThermometerSnowflake,
  Scale
} from 'lucide-react';

const PatientVitalsDisplay = ({ vitals, onAddVitals, onEditVitals, showAddButton = false, showEditButton = false, className = "" }) => {
  const { t } = useTranslation();
  // Helper function to safely get vitals values - handles both snake_case and camelCase
  const getVitalValue = (snakeCase, camelCase) => {
    return vitals?.[snakeCase] !== undefined ? vitals[snakeCase] : vitals?.[camelCase];
  };

  const vitalsData = [
    {
      key: 'bp',
      label: t('patient.vitals.bloodPressure'),
      icon: Heart,
      color: 'text-red-500',
      unit: '',
      value: (() => {
        const systolic = getVitalValue('blood_pressure_systolic', 'bloodPressureSystolic');
        const diastolic = getVitalValue('blood_pressure_diastolic', 'bloodPressureDiastolic');
        // Also check for legacy 'bp' format
        if (!systolic && !diastolic && vitals?.bp) {
          return vitals.bp;
        }
        return systolic && diastolic ? `${systolic}/${diastolic}` : null;
      })()
    },
    {
      key: 'heartRate',
      label: t('patient.vitals.heartRate'),
      icon: Activity,
      color: 'text-green-500',
      unit: 'bpm',
      value: getVitalValue('heart_rate', 'heartRate')
    },
    {
      key: 'temp',
      label: t('patient.vitals.temperature'),
      icon: ThermometerSnowflake,
      color: 'text-blue-500',
      unit: (() => {
        const unit = getVitalValue('temperature_unit', 'temperatureUnit');
        // Also check legacy 'temp' property
        return unit === 'F' || unit === 'f' ? '°F' : '°C';
      })(),
      value: getVitalValue('temperature', 'temp')
    },
    {
      key: 'weight',
      label: t('patient.vitals.weight'),
      icon: Scale,
      color: 'text-purple-500',
      unit: getVitalValue('weight_unit', 'weightUnit') || 'kg',
      value: vitals?.weight
    }
  ];

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity size={24} className="text-emerald-600" />
          <h3 className="text-lg font-bold">{t('patient.medicalRecords.currentVitals')}</h3>
        </div>
        <div className="flex space-x-2">
          {showAddButton && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm px-4 py-2"
              onClick={onAddVitals}
            >
              + {t('patient.medicalRecords.addVitals')}
            </Button>
          )}
          {showEditButton && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm px-4 py-2"
              onClick={onEditVitals}
            >
              {t('patient.medicalRecords.editVitals')}
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
        <p className="text-gray-500 italic text-sm">{t('patient.medicalRecords.noVitalsRecorded')}</p>
      )}
    </Card>
  );
};

export default PatientVitalsDisplay;
