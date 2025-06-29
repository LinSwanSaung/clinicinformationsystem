import React, { useState } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  // Find user details from dummy data
  const userDetails = dummyEmployees.find(
    emp => emp.role === user?.role && emp.email.includes(user?.role.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-8 mx-auto flex h-20 items-center justify-between">
        {/* Logo and Brand */}
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => navigate(user?.role === 'Admin' ? '/admin/dashboard' : '/receptionist/dashboard')}
        >
          <div className="bg-primary p-3 rounded-xl transition-all hover:shadow-lg hover:scale-105">
            <Heart className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">RealCIS</h1>
            <p className="text-sm text-muted-foreground">Healthcare System</p>
          </div>
        </div>

        {/* Right Side Navigation */}
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 border-2">
                <BellRing className="h-6 w-6 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuLabel className="text-lg font-semibold">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-auto">
                <DropdownMenuItem className="py-3">
                  <span className="text-base">No new notifications</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 border-2 border-border hover:bg-accent px-6 h-12">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <UserCircle className="h-8 w-8 text-primary" />
                    <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background`}></div>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-base font-medium text-foreground">
                      {userDetails?.name || user?.role}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.role}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem className="py-3 text-base">
                <Settings className="mr-2 h-5 w-5" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="py-3 text-base text-red-500 focus:text-red-500" 
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
