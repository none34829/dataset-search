'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'], display: 'swap' });

interface User {
  type: string;
  email: string;
}

export default function MentorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Load user info from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/'); // Redirect to login if no user found
      return;
    }
    
    const parsedUser = JSON.parse(userStr);
    if (parsedUser.type !== 'mentor') {
      router.push('/search'); // Redirect non-mentors to dataset search
      return;
    }
    
    setUser(parsedUser);
  }, [router]);

  const getProfileInitials = () => {
    if (!user) return '';
    
    const name = user.email.split('@')[0];
    const parts = name.split(/[._-]/);
    
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      const matches = name.match(/[A-Z]|[0-9]|\b[a-z]/g);
      if (matches && matches.length > 1) {
        return (matches[0] + (matches[1] || '')).toUpperCase();
      } else {
        return name.substring(0, 2).toUpperCase();
      }
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      {/* Navigation Bar */}
      <header className="border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="flex justify-center">
              <Link 
                href="/mentor"
                className="cursor-pointer"
              >
                <img 
                  src="/updated+logo+3.15.24-2.png" 
                  alt="INSPIRIT AI Logo" 
                  className="h-13 w-48 mr-2"
                />
              </Link>
            </div>
            <h1 className="ml-8 text-xl font-semibold">Mentor Portal</h1>
          </div>
          
          <div className="flex items-center">
            {/* Profile Button with Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {getProfileInitials()}
                </button>
              </PopoverTrigger>
              <PopoverContent className={`w-32 p-0 ${inter.className}`} align="end">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Log Out
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <h2 className="text-2xl font-bold mb-6">Welcome, {user.email.split('@')[0]}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dataset Tool Card */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Dataset Search Tool</CardTitle>
              <CardDescription>
                Access curated datasets and external databases for your students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Browse through our collection of AI datasets and external resources to support your teaching.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => router.push('/search')}
              >
                Access Dataset Tool
              </Button>
            </CardFooter>
          </Card>
          
          {/* Attendance Tracker Card */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Student Attendance Tracker</CardTitle>
              <CardDescription>
                Track student attendance and progress through sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                View and manage student attendance records, session progress, and completion status.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => router.push('/mentor/attendance')}
              >
                View Attendance Records
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t p-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Inspirit AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
