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

  // Role-based colors using design tokens
  const roleColors = {
    Admin: 'bg-primary',
    Receptionist: 'bg-primary',
    Nurse: 'bg-primary',
    Doctor: 'bg-primary'
  };

  const roleColor = roleColors[user?.role] || 'bg-primary';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background shadow-sm">
      <div className="container max-w-5xl mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate(user?.role === 'Admin' ? '/admin/dashboard' : '/receptionist/dashboard')}
        >
          <div className="bg-primary p-2 rounded-lg transition-all hover:shadow-lg">
            <Heart
              className="h-6 w-6 text-primary-foreground"
            />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-foreground">RealCIS</h1>
            <p className="text-xs text-muted-foreground">Healthcare System</p>
          </div>
        </div>

        {/* User Section */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative hover:bg-accent">
            <BellRing className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
          </Button>

          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-card-foreground">{userDetails?.fullName || user?.role}</p>
              <p className="text-xs text-muted-foreground">{userDetails?.department || 'Healthcare Staff'}</p>
            </div>
            <div className="bg-primary rounded-full p-1.5">
              <UserCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
