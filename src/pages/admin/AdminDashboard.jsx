import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  BarChart3,
  Stethoscope,
  LogOut,
  UserPlus
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  const statsCards = [
    {
      title: "Total Employees",
      value: "15",
      description: "Active staff members",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Departments",
      value: "6",
      description: "Medical departments",
      icon: BarChart3,
      color: "text-primary"
    },
    {
      title: "This Month",
      value: "324",
      description: "Patient visits",
      icon: Calendar,
      color: "text-primary"
    },
    {
      title: "System Status",
      value: "Active",
      description: "All systems operational",
      icon: Settings,
      color: "text-primary"
    }
  ];

  const actionCards = [
    {
      title: "Employee Management",
      description: "Manage staff, roles, and permissions",
      icon: Users,
      action: () => navigate('/admin/employees'),
      color: "bg-primary"
    },
    {
      title: "Schedule Management", 
      description: "Manage doctor schedules and appointments",
      icon: Calendar,
      action: () => alert('Feature coming soon!'),
      color: "bg-primary"
    },
    {
      title: "Reports & Analytics",
      description: "View clinic performance and statistics", 
      icon: BarChart3,
      action: () => alert('Feature coming soon!'),
      color: "bg-primary"
    },
    {
      title: "System Settings",
      description: "Configure system preferences",
      icon: Settings,
      action: () => alert('Feature coming soon!'),
      color: "bg-primary"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-2">Overview of your clinic management system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-card-foreground">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {actionCards.map((action, index) => (
              <Card 
                key={index}
                className="cursor-pointer bg-card hover:bg-accent hover:text-accent-foreground transition-colors border border-border"
                onClick={action.action}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary">
                      <action.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg text-card-foreground">{action.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-muted-foreground">
                    {action.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-4">Recent System Activity</h3>
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">New employee added</p>
                    <p className="text-xs text-muted-foreground">Dr. Ana Martinez joined Obstetrics department</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Settings className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">System backup completed</p>
                    <p className="text-xs text-muted-foreground">Daily backup process finished successfully</p>
                  </div>
                  <span className="text-xs text-muted-foreground">6 hours ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">Schedule updated</p>
                    <p className="text-xs text-muted-foreground">Dr. Smith's schedule modified for next week</p>
                  </div>
                  <span className="text-xs text-muted-foreground">1 day ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
