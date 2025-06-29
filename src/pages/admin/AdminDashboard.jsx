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
      color: "text-blue-600"
    },
    {
      title: "Departments",
      value: "6",
      description: "Medical departments",
      icon: BarChart3,
      color: "text-green-600"
    },
    {
      title: "This Month",
      value: "324",
      description: "Patient visits",
      icon: Calendar,
      color: "text-purple-600"
    },
    {
      title: "System Status",
      value: "Active",
      description: "All systems operational",
      icon: Settings,
      color: "text-emerald-600"
    }
  ];

  const actionCards = [
    {
      title: "Employee Management",
      description: "Manage staff, roles, and permissions",
      icon: Users,
      action: () => navigate('/admin/employees'),
      color: "bg-blue-500"
    },
    {
      title: "Schedule Management", 
      description: "Manage doctor schedules and appointments",
      icon: Calendar,
      action: () => alert('Feature coming soon!'),
      color: "bg-green-500"
    },
    {
      title: "Reports & Analytics",
      description: "View clinic performance and statistics", 
      icon: BarChart3,
      action: () => alert('Feature coming soon!'),
      color: "bg-purple-500"
    },
    {
      title: "System Settings",
      description: "Configure system preferences",
      icon: Settings,
      action: () => alert('Feature coming soon!'),
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-2">Overview of your clinic management system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {actionCards.map((action, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={action.action}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-gray-600">
                    {action.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent System Activity</h3>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b">
                  <UserPlus className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New employee added</p>
                    <p className="text-xs text-gray-500">Dr. Ana Martinez joined Obstetrics department</p>
                  </div>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                <div className="flex items-center gap-3 pb-3 border-b">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">System backup completed</p>
                    <p className="text-xs text-gray-500">Daily backup process finished successfully</p>
                  </div>
                  <span className="text-xs text-gray-400">6 hours ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Schedule updated</p>
                    <p className="text-xs text-gray-500">Dr. Smith's schedule modified for next week</p>
                  </div>
                  <span className="text-xs text-gray-400">1 day ago</span>
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
