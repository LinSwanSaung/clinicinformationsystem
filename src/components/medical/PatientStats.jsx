import React from 'react';
import { Card } from '../ui/card';

export const PatientStats = ({ patients = [], userRole = 'nurse', className = "" }) => {
  const getStatsForRole = () => {
    if (userRole === 'doctor') {
      return [
        {
          title: 'Waiting for You',
          count: patients.filter(p => p.status === 'ready').length,
          description: 'Patients ready for consultation',
          icon: '👩‍⚕️'
        },
        {
          title: 'In Progress',
          count: patients.filter(p => p.status === 'seeing_doctor').length,
          description: 'Currently consulting',
          icon: '🩺'
        },
        {
          title: 'Completed Today',
          count: patients.filter(p => p.status === 'completed').length,
          description: 'Consultations finished',
          icon: '✅'
        }
      ];
    } else {
      return [
        {
          title: 'Total Patients',
          count: patients.length,
          description: 'Scheduled for today',
          icon: '👥'
        },
        {
          title: 'Checked In',
          count: patients.filter(p => p.vitalsRecorded).length,
          description: 'Vitals recorded',
          icon: '📊'
        },
        {
          title: 'Ready for Doctor',
          count: patients.filter(p => p.status === 'ready').length,
          description: 'Waiting for consultation',
          icon: '🏥'
        }
      ];
    }
  };

  const stats = getStatsForRole();
  const bgColor = userRole === 'doctor' ? 'bg-blue-600' : 'bg-emerald-600';
  const cardBgColor = userRole === 'doctor' 
    ? 'bg-blue-500/30 border-blue-300/50' 
    : 'bg-emerald-500/30 border-emerald-300/50';

  return (
    <div className={`${bgColor} text-white p-6 rounded-lg shadow-md ${className}`}>
      <h1 className="text-2xl font-bold text-center mb-6">
        {userRole === 'doctor' ? "Doctor's Patient Queue" : "Today's Patient Summary"}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className={`${cardBgColor} backdrop-blur text-white border`}>
            <div className="p-4 flex flex-col items-center text-center">
              <div className="flex justify-between items-center w-full mb-2">
                <h2 className="text-sm font-medium">{stat.title}</h2>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <p className="text-3xl font-bold my-1">{stat.count}</p>
              <p className="text-xs opacity-80">{stat.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
