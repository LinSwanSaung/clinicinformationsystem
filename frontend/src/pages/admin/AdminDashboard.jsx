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
import PageLayout from '@/components/PageLayout';

const AdminDashboard = () => {
  const navigate = useNavigate();

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
      color: "text-green-500"
    }
  ];

  const quickActions = [
    {
      title: "Manage Staff",
      description: "Add, edit, or remove employee records",
      icon: Users,
      action: () => navigate('/admin/employees')
    },
    {
      title: "Department Overview",
      description: "View and manage departments",
      icon: BarChart3,
      action: () => console.log("Department Overview")
    },
    {
      title: "Patient Statistics",
      description: "View patient visit analytics",
      icon: FileText,
      action: () => console.log("Patient Statistics")
    },
    {
      title: "Doctor Schedules",
      description: "Manage doctor availability",
      icon: Stethoscope,
      action: () => console.log("Doctor Schedules")
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="bg-card hover:bg-accent cursor-pointer transition-colors"
                onClick={action.action}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <action.icon className="h-7 w-7 text-primary" />
                    <CardTitle className="text-xl">{action.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{action.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* System Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-card col-span-1">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl mb-2">Recent Activities</CardTitle>
                <CardDescription className="text-base">System events from the past 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Activity items would go here */}
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg text-foreground">New employee registered</p>
                      <p className="text-base text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg text-foreground">Updated doctor schedule</p>
                      <p className="text-base text-muted-foreground">4 hours ago</p>
                    </div>
                  </div>
                </div>
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
                    <span className="text-lg font-medium text-foreground">Server Load</span>
                    <span className="text-lg font-bold text-primary">23%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <span className="text-lg font-medium text-foreground">Database Status</span>
                    <span className="text-lg font-bold text-green-500">Healthy</span>
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
