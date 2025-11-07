import { Card } from '@/components/ui/card';

export const PatientStats = ({ patients = [], userRole = 'nurse', className = '' }) => {
  const getStatsForRole = () => {
    if (userRole === 'doctor') {
      return [
        {
          title: 'Waiting for You',
          count: patients.filter((p) => p.status === 'ready').length,
          description: 'Patients ready for consultation',
          icon: '👩‍⚕️',
        },
        {
          title: 'In Progress',
          count: patients.filter((p) => p.status === 'seeing_doctor').length,
          description: 'Currently consulting',
          icon: '🩺',
        },
        {
          title: 'Completed Today',
          count: patients.filter((p) => p.status === 'completed').length,
          description: 'Consultations finished',
          icon: '✅',
        },
      ];
    } else {
      return [
        {
          title: 'Total Patients',
          count: patients.length,
          description: 'Scheduled for today',
          icon: '👥',
        },
        {
          title: 'Checked In',
          count: patients.filter((p) => p.vitalsRecorded).length,
          description: 'Vitals recorded',
          icon: '📊',
        },
        {
          title: 'Ready for Doctor',
          count: patients.filter((p) => p.status === 'ready').length,
          description: 'Waiting for consultation',
          icon: '🏥',
        },
      ];
    }
  };

  const stats = getStatsForRole();
  const bgColor = userRole === 'doctor' ? 'bg-blue-600' : 'bg-emerald-600';
  const cardBgColor =
    userRole === 'doctor'
      ? 'bg-blue-500/30 border-blue-300/50'
      : 'bg-emerald-500/30 border-emerald-300/50';

  return (
    <div className={`${bgColor} rounded-lg p-6 text-white shadow-md ${className}`}>
      <h1 className="mb-6 text-center text-2xl font-bold">
        {userRole === 'doctor' ? "Doctor's Patient Queue" : "Today's Patient Summary"}
      </h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className={`${cardBgColor} border text-white backdrop-blur`}>
            <div className="flex flex-col items-center p-4 text-center">
              <div className="mb-2 flex w-full items-center justify-between">
                <h2 className="text-sm font-medium">{stat.title}</h2>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <p className="my-1 text-3xl font-bold">{stat.count}</p>
              <p className="text-xs opacity-80">{stat.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
