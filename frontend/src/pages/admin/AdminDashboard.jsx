import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Users, 
  Calendar, 
  Settings, 
  Stethoscope,
  UserPlus,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import api from '@/services/api';
import userService from '@/services/userService';
import doctorAvailabilityService from '@/services/doctorAvailabilityService';
import { visitService } from '@/services/visitService';
import { formatTimeRange } from '@/utils/timeUtils';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [health, setHealth] = useState({ status: 'UNKNOWN', db: { connected: false } });
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState('');
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [statsData, setStatsData] = useState({
    totalEmployees: 0,
    availableDoctorsCount: 0,
    monthlyVisits: 0,
    availableDoctors: []
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const h = await api.health();
        if (mounted) setHealth(h);
      } catch (e) {
        if (mounted) setHealthError(e.message || 'Health check failed');
      } finally {
        if (mounted) setHealthLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError('');

      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const now = new Date();

        const [usersRes, availabilityRes, visitStatsRes] = await Promise.all([
          userService.getAllUsers({ params: { includeDeleted: false } }),
          doctorAvailabilityService.getAllDoctorAvailability(),
          visitService.getVisitStatistics({
            start_date: startOfMonth.toISOString(),
            end_date: now.toISOString()
          })
        ]);

        if (!mounted) return;

        const users = Array.isArray(usersRes?.data)
          ? usersRes.data
          : Array.isArray(usersRes)
            ? usersRes
            : [];
        const activeEmployees = users.filter((user) => user?.is_active !== false && !user?.deleted_at);
        const totalEmployees = activeEmployees.length;

        const availabilityRaw = Array.isArray(availabilityRes?.data)
          ? availabilityRes.data
          : Array.isArray(availabilityRes)
            ? availabilityRes
            : availabilityRes?.data?.data || [];

        const today = new Date();
        const todayName = today.toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = today.toTimeString().slice(0, 5);

        const doctorMap = new Map();
        availabilityRaw.forEach((slot) => {
          if (!slot || slot.is_active === false) return;
          if (slot.day_of_week !== todayName) return;

          const startTime = (slot.start_time || '').slice(0, 5);
          const endTime = (slot.end_time || '').slice(0, 5);
          if (!startTime || !endTime) return;

          if (!doctorMap.has(slot.doctor_id)) {
            doctorMap.set(slot.doctor_id, {
              doctor_id: slot.doctor_id,
              doctor: slot.users || slot.doctor || null,
              slots: [],
              isAvailableNow: false
            });
          }

          const record = doctorMap.get(slot.doctor_id);
          record.slots.push({ start: startTime, end: endTime });
          if (currentTime >= startTime && currentTime <= endTime) {
            record.isAvailableNow = true;
          }
        });

        const availableDoctors = Array.from(doctorMap.values()).map((doc) => {
          const formattedSlots = doc.slots
            .sort((a, b) => a.start.localeCompare(b.start))
            .map((slot) => formatTimeRange(slot.start, slot.end));
          return {
            ...doc,
            formattedSlots
          };
        });

        const visitStatsData = visitStatsRes?.data || visitStatsRes || {};
        const monthlyVisits = visitStatsData.total_visits ?? visitStatsData.totalVisits ?? 0;

        setStatsData({
          totalEmployees,
          availableDoctorsCount: availableDoctors.length,
          monthlyVisits,
          availableDoctors
        });
      } catch (error) {
        if (mounted) {
          console.error('Failed to load dashboard stats', error);
          setStatsError(error.message || 'Failed to load dashboard statistics.');
        }
      } finally {
        if (mounted) {
          setStatsLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      mounted = false;
    };
  }, []);

  const statsCards = [
    {
      title: "Total Employees",
      value: statsLoading ? '...' : statsData.totalEmployees.toLocaleString(),
      description: statsLoading ? 'Loading active staff...' : 'Active staff members',
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Available Doctors",
      value: statsLoading ? '...' : statsData.availableDoctorsCount.toLocaleString(),
      description: statsLoading ? 'Checking schedules...' : 'Doctors scheduled for today',
      icon: Stethoscope,
      color: "text-primary"
    },
    {
      title: "This Month",
      value: statsLoading ? '...' : statsData.monthlyVisits.toLocaleString(),
      description: statsLoading ? 'Calculating visit volume...' : 'Patient visits recorded this month',
      icon: Calendar,
      color: "text-primary"
    },
    {
      title: "System Status",
      value: healthLoading ? 'Checking...' : healthError ? 'Attention' : (health?.status || 'Unknown'),
      description: healthLoading
        ? 'Performing health check...'
        : healthError
          ? 'Health check failed'
          : (health?.db?.connected ? 'Database connected' : 'Database offline'),
      icon: Settings,
      color: healthLoading
        ? 'text-muted-foreground'
        : (healthError || !health?.db?.connected ? 'text-red-500' : 'text-green-500')
    }
  ];

  const quickActions = [
    {
      title: "Resolve Pending Items",
      description: "Review and resolve stuck records",
      icon: AlertTriangle,
      action: () => navigate('/admin/pending-items')
    },
    {
      title: "Payment Transactions",
      description: "View all payment transactions",
      icon: DollarSign,
      action: () => navigate('/admin/payment-transactions')
    },
    {
      title: "System Audit Logs",
      description: "View system activities and audit logs",
      icon: Settings,
      action: () => navigate('/admin/audit-logs')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageLayout 
        title="Admin Dashboard" 
        subtitle="System overview and quick actions"
        fullWidth
      >
        <div className="space-y-8 p-8">
          {statsError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {statsError}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {statsCards.map((stat, index) => (
              <Card key={index} className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <p className="text-base text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Button
                key={action.title}
                variant="outline"
                onClick={action.action}
                className="h-auto w-full flex flex-col items-start gap-3 rounded-xl border-2 border-border bg-card px-5 py-5 text-left hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <action.icon className="h-6 w-6 text-primary" />
                  <span className="text-lg font-semibold text-foreground">{action.title}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {action.description}
                </span>
              </Button>
            ))}
          </div>

          {/* System Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-card col-span-1">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl mb-2">Available Doctors Today</CardTitle>
                <CardDescription className="text-base">
                  {statsLoading
                    ? 'Checking current schedules...'
                    : statsData.availableDoctorsCount > 0
                      ? `${statsData.availableDoctorsCount} doctor${statsData.availableDoctorsCount !== 1 ? 's' : ''} scheduled`
                      : 'No doctors scheduled today'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 rounded bg-muted/60 animate-pulse" />
                    <div className="h-4 rounded bg-muted/40 animate-pulse w-2/3" />
                    <div className="h-4 rounded bg-muted/40 animate-pulse w-1/2" />
                  </div>
                ) : statsData.availableDoctorsCount === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No doctors are scheduled for the remainder of today. Manage working hours from the Doctor Availability page.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {statsData.availableDoctors.slice(0, 5).map((doctor) => (
                      <div key={doctor.doctor_id} className="rounded border border-border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              {doctor.doctor
                                ? `Dr. ${doctor.doctor.first_name} ${doctor.doctor.last_name}`
                                : 'Doctor'}
                            </p>
                            {doctor.doctor?.email && (
                              <p className="text-xs text-muted-foreground">{doctor.doctor.email}</p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              doctor.isAvailableNow
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {doctor.isAvailableNow ? 'Available now' : 'Scheduled'}
                          </span>
                        </div>
                        {doctor.formattedSlots?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {doctor.formattedSlots.map((slot, index) => (
                              <span
                                key={`${doctor.doctor_id}-${slot}-${index}`}
                                className="text-xs px-2 py-1 rounded-full bg-accent text-foreground"
                              >
                                {slot}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {statsData.availableDoctors.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        Showing first 5 of {statsData.availableDoctors.length} doctors. View full schedules in Doctor Availability.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card col-span-1">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl mb-2">System Health</CardTitle>
                <CardDescription className="text-base">Current system metrics and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <span className="text-lg font-medium text-foreground">API Status</span>
                    {healthLoading ? (
                      <span className="text-lg text-muted-foreground">Checking...</span>
                    ) : healthError ? (
                      <span className="text-lg font-bold text-red-500">Unavailable</span>
                    ) : (
                      <span className="text-lg font-bold text-green-500">{health.status}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <span className="text-lg font-medium text-foreground">Database Status</span>
                    {healthLoading ? (
                      <span className="text-lg text-muted-foreground">Checking...</span>
                    ) : (
                      <span className={`text-lg font-bold ${health?.db?.connected ? 'text-green-500' : 'text-red-500'}`}>
                        {health?.db?.connected ? 'Healthy' : 'Unavailable'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <span className="text-lg font-medium text-foreground">Last Backup</span>
                    <span className="text-lg text-muted-foreground">2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default AdminDashboard;






