import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  UserCircle,
  BellRing,
  Settings,
  ChevronDown,
  Heart
} from 'lucide-react';
import { dummyEmployees } from '@/data/dummyData';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Find user details from dummy data
  const userDetails = dummyEmployees.find(
    emp => emp.role === user?.role && emp.email.includes(user?.role.toLowerCase())
  );

  // Role-based colors
  const roleColors = {
    Admin: 'bg-blue-600',
    Receptionist: 'bg-emerald-600',
    Nurse: 'bg-purple-600',
    Doctor: 'bg-amber-600'
  };

  const roleColor = roleColors[user?.role] || 'bg-primary';

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container max-w-5xl mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <div className={`${roleColor} p-2 rounded-lg transition-all hover:shadow-lg`}>
            <Heart
              className="h-6 w-6 text-white"
            />
          </div>
          <div className="hidden md:block">
            <h1 className={`text-xl font-bold ${roleColor.replace('bg-', 'text-')}`}>RealCIS</h1>
            <p className="text-xs text-muted-foreground">Healthcare System</p>
          </div>
        </div>

        {/* User Section */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <BellRing className={`h-5 w-5 ${roleColor.replace('bg-', 'text-')}`} />
            <span className={`absolute top-1 right-1 h-2 w-2 rounded-full ${roleColor}`}></span>
          </Button>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border transition-all hover:shadow-md`}>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">{userDetails?.fullName || user?.role}</p>
              <p className={`text-xs ${roleColor.replace('bg-', 'text-')}`}>{userDetails?.department || 'Healthcare Staff'}</p>
            </div>
            <div className={`${roleColor} rounded-full p-1`}>
              <UserCircle className="h-7 w-7 text-white" />
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={logout}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 ml-1"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
