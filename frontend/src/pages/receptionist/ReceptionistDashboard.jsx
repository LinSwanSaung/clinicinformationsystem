import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calendar,
  Users,
  UserCircle,
  FileText,
  Star,
  Clock,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  User,
  Stethoscope,
  MoreHorizontal,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppointmentCard from '@/components/AppointmentCard';
import WalkInModal from '@/components/WalkInModal';
import NotificationBell from '@/components/NotificationBell';
import { 
  getStatusColor, 
  getStatusIcon, 
  getStatusDisplayName, 
  getActionsForRole,
  shouldShowActions 
} from '@/utils/appointmentConfig';
import userService from '@/services/userService';
import patientService from '@/services/patientService';
import appointmentService from '@/services/appointmentService';
import queueService from '@/services/queueService';
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/PageLayout';
import useDebounce from '@/utils/useDebounce';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('needs-action');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    availableDoctorCount: 0,
    totalPatients: 0,
    arrived: 0,
    delayed: 0,
    noShow: 0,
    scheduled: 0,
    overdue: 0
  });

  // Helper function to check if appointment is overdue
  const isAppointmentOverdue = (appointment) => {
    // Only check overdue for appointments that haven't been processed yet (pending status)
    if (appointment.status === 'ready' || appointment.status === 'late' || appointment.status === 'no-show') {
      return false;
    }
    
    const now = new Date();
    const [hours, minutes] = appointment.appointment_time.split(':');
    const appointmentTime = new Date();
    appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Consider overdue if more than 15 minutes past appointment time
    const overdueThreshold = 15 * 60 * 1000; // 15 minutes in milliseconds
    return now - appointmentTime > overdueThreshold;
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Get all required data
        const [appointmentsResponse, doctorsResponse, patientsResponse] = await Promise.all([
          appointmentService.getAllAppointments(),
          userService.getUsersByRole('doctor'),
          patientService.getAllPatients()
        ]);

        // Filter today's appointments
        const today = new Date().toDateString();
        const todayAppts = appointmentsResponse.success 
          ? appointmentsResponse.data.filter(
              app => new Date(app.appointment_date).toDateString() === today
            )
          : [];

        // Mock data for demonstration since backend might not have complete data
        const mockTodayAppointments = [
          {
            id: '1',
            patient_name: 'Sarah Johnson',
            appointment_time: '09:00',
            doctor_name: 'Dr. Smith',
            visit_type: 'Consultation',
            status: 'pending'
          },
          {
            id: '2', 
            patient_name: 'Michael Chen',
            appointment_time: '09:30',
            doctor_name: 'Dr. Johnson',
            visit_type: 'Follow-up',
            status: 'ready'
          },
          {
            id: '3',
            patient_name: 'Emma Wilson',
            appointment_time: '10:00',
            doctor_name: 'Dr. Smith',
            visit_type: 'Check-up',
            status: 'late'
          },
          {
            id: '4',
            patient_name: 'David Brown',
            appointment_time: '08:30', // Past appointment time for alert demo
            doctor_name: 'Dr. Johnson',
            visit_type: 'Consultation',
            status: 'pending'
          },
          {
            id: '5',
            patient_name: 'Lisa Garcia',
            appointment_time: '11:00',
            doctor_name: 'Dr. Smith',
            visit_type: 'Follow-up',
            status: 'no-show'
          }
        ];

        setTodayAppointments(mockTodayAppointments);
        setFilteredAppointments(mockTodayAppointments);

        // Calculate stats
        const statusCounts = mockTodayAppointments.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {});

        setStats({
          todayAppointments: mockTodayAppointments.length,
          availableDoctorCount: doctorsResponse.success ? doctorsResponse.data.length : 0,
          totalPatients: patientsResponse.success ? patientsResponse.data.length : 0,
          arrived: statusCounts.ready || 0,
          delayed: statusCounts.late || 0,
          noShow: statusCounts['no-show'] || 0,
          scheduled: statusCounts.pending || 0,
          overdue: mockTodayAppointments.filter(app => isAppointmentOverdue(app)).length || 0
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Filter appointments based on search and status
  useEffect(() => {
    let filtered = todayAppointments;

    // Apply search filter
    if (debouncedSearch) {
      filtered = filtered.filter(appointment =>
        appointment.patient_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        appointment.doctor_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        appointment.visit_type.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter === 'needs-action') {
      filtered = filtered.filter(appointment => 
        appointment.status === 'pending' || 
        isAppointmentOverdue(appointment)
      );
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }

    setFilteredAppointments(filtered);
  }, [debouncedSearch, statusFilter, todayAppointments]);

  const updateAppointmentStatus = (appointmentId, newStatus) => {
    setTodayAppointments(prev => 
      prev.map(app => 
        app.id === appointmentId ? { ...app, status: newStatus } : app
      )
    );

    // Update stats
    const updatedAppointments = todayAppointments.map(app => 
      app.id === appointmentId ? { ...app, status: newStatus } : app
    );
    
    const statusCounts = updatedAppointments.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    setStats(prev => ({
      ...prev,
      arrived: statusCounts.ready || 0,
      delayed: statusCounts.late || 0,
      noShow: statusCounts['no-show'] || 0,
      scheduled: statusCounts.pending || 0,
      overdue: updatedAppointments.filter(app => isAppointmentOverdue(app)).length || 0
    }));
  };

  const handleWalkInSubmit = async (walkInData) => {
    try {
      // Prepare data for backend API - only the fields the backend expects
      const tokenData = {
        patient_id: walkInData.patient.id, // UUID string
        doctor_id: walkInData.doctor.id,   // UUID string
        priority: 1 // number - normal priority for walk-ins
      };

      // Call backend API to create queue token
      const response = await queueService.issueToken(tokenData);
      
      if (response.success) {
        const tokenResult = response.data || {};
        const issuedToken = tokenResult.token || null;
        const tokenMessage = tokenResult.message || response.message;

        // Create a new appointment entry for local state
        const newAppointment = {
          id: issuedToken?.id || `walkin-${Date.now()}`,
          patient_name: `${walkInData.patient.first_name} ${walkInData.patient.last_name}`,
          appointment_time: walkInData.appointment_time,
          doctor_name: `Dr. ${walkInData.doctor.first_name} ${walkInData.doctor.last_name}`,
          visit_type: walkInData.visit_type,
          status: walkInData.status,
          notes: walkInData.notes,
          isWalkIn: true,
          token_number: issuedToken?.token_number || tokenResult.token_number || null,
          queueMessage: tokenMessage
        };

        // Add to the appointment list
        setTodayAppointments(prev => [...prev, newAppointment]);

        // Update stats
        setStats(prev => ({
          ...prev,
          todayAppointments: prev.todayAppointments + 1,
          arrived: prev.arrived + 1 // Walk-ins are marked as ready/arrived
        }));
      } else {
        throw new Error(response.message || 'Failed to create walk-in appointment');
      }
    } catch (error) {
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-b-2 border-primary rounded-full"
        />
      </div>
    );
  }

  return (
    <PageLayout
      title={t('receptionist.dashboard.title')}
      subtitle={t('receptionist.dashboard.subtitle')}
      fullWidth
    >
      <div className="space-y-8 p-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
        >
          {[
            {
              title: t('receptionist.dashboard.totalToday'),
              value: stats.todayAppointments,
              icon: Calendar,
              color: "text-blue-600",
              delay: 0
            },
            {
              title: t('receptionist.dashboard.arrived'), 
              value: stats.arrived,
              icon: CheckCircle,
              color: "text-green-600",
              delay: 0.1
            },
            {
              title: t('receptionist.dashboard.overdue'),
              value: stats.overdue,
              icon: AlertCircle,
              color: "text-orange-600",
              delay: 0.2
            },
            {
              title: t('receptionist.dashboard.noShow'),
              value: stats.noShow,
              icon: XCircle,
              color: "text-red-600",
              delay: 0.3
            }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: stat.delay, duration: 0.4 }}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="bg-card hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center pt-1 sm:pt-0">
                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                      <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.color}`} />
                      <span className="text-lg sm:text-2xl font-bold">{stat.value}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-card rounded-lg border p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('receptionist.dashboard.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
              
              <Button 
                onClick={() => setIsWalkInModalOpen(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm px-3 py-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>{t('receptionist.dashboard.walkIn')}</span>
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="needs-action">{t('receptionist.dashboard.needsAction')}</SelectItem>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ready">Ready/Checked In</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="no-show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {statusFilter !== 'needs-action' && statusFilter !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter('needs-action')}
                  className="text-xs w-full sm:w-auto"
                >
                  ← Back to Actions
                </Button>
              )}
            </div>
          </div>

          {/* Appointments Table */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredAppointments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 text-muted-foreground"
                >
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {statusFilter === 'needs-action' ? (
                    <>
                      <p className="text-lg">No appointments need action</p>
                      <p className="text-sm">All appointments are up to date</p>
                    </>
                  ) : statusFilter === 'late' ? (
                    <>
                      <p className="text-lg">No late appointments</p>
                      <p className="text-sm">Great! All appointments are on time</p>
                    </>
                  ) : statusFilter === 'no-show' ? (
                    <>
                      <p className="text-lg">No no-show appointments</p>
                      <p className="text-sm">Excellent attendance today</p>
                    </>
                  ) : statusFilter === 'ready' ? (
                    <>
                      <p className="text-lg">No ready appointments</p>
                      <p className="text-sm">No patients are currently checked in</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg">No appointments found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </>
                  )}
                </motion.div>
              ) : (
                filteredAppointments.map((appointment, index) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    index={index}
                    onStatusUpdate={updateAppointmentStatus}
                    actions={getActionsForRole('receptionist', appointment)}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    getStatusDisplayName={getStatusDisplayName}
                    isAppointmentOverdue={isAppointmentOverdue}
                    showActions={shouldShowActions('receptionist', appointment)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Walk-in Modal */}
      <WalkInModal 
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onSubmit={handleWalkInSubmit}
      />
    </PageLayout>
  );
};

export default ReceptionistDashboard;
