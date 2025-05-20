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

  // Extract mentor first name from email (or update if you have a name field)
  const mentorFirstName = user.email.split('@')[0].split(/[._-]/)[0].charAt(0).toUpperCase() + user.email.split('@')[0].split(/[._-]/)[0].slice(1);

  return (
    <div className={`min-h-screen bg-[#F8F8F8] flex flex-col ${inter.className}`}> 
      {/* Header Bar */}
      <header className="w-full bg-[#565889] py-4 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <img src="/updated+logo+3.15.24-2.png" alt="INSPIRIT AI Logo" className="h-10 w-auto" />
          <span className="text-white text-2xl font-semibold tracking-wide">Mentor Portal</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search"
            className="rounded-full px-4 py-1.5 bg-white text-[#535353] focus:outline-none focus:ring-2 focus:ring-[#565889] w-48 shadow-sm placeholder:text-[#b0b0b0]"
            style={{ border: '1px solid #E0E0E0' }}
          />
          {/* Profile Button */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-10 w-10 rounded-full bg-[#565889] text-white flex items-center justify-center font-bold text-lg shadow hover:bg-[#2f3167] transition-colors">
                {getProfileInitials()}
              </button>
            </PopoverTrigger>
            <PopoverContent className={`w-32 p-0 ${inter.className}`} align="end">
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-[#2f3167] hover:bg-[#F8F8F8] transition-colors">Log Out</button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center py-10 px-2">
        <h2 className="text-3xl font-bold mb-8 text-[#2f3167] drop-shadow-sm">Welcome, {mentorFirstName}!</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl">
          {/* Submit Attendance Forms */}
          <button
            className="rounded-full bg-gradient-to-r from-[#565889] to-[#2f3167] shadow-lg text-white text-xl font-semibold py-8 px-6 flex flex-col items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#F29129]/30"
            onClick={() => router.push('/mentor/attendance')}
            style={{ minHeight: '120px' }}
          >
            <span>Submit Attendance Forms</span>
            <span className="text-sm font-normal mt-2 opacity-80">Submit attendance forms for your assigned students</span>
          </button>

          {/* View Student Progress */}
          <button
            className="rounded-full bg-gradient-to-r from-[#565889] to-[#2f3167] shadow-lg text-white text-xl font-semibold py-8 px-6 flex flex-col items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#FAC63B]/30"
            onClick={() => router.push('/mentor/attendance')}
            style={{ minHeight: '120px' }}
          >
            <span>View Student Progress</span>
<span className="text-sm font-normal mt-2 opacity-80">Track student attendance and session progress</span>
          </button>

          {/* Access Instructor Resources */}
          <button
            className="rounded-full bg-gradient-to-r from-[#565889] to-[#2f3167] shadow-lg text-white text-xl font-semibold py-8 px-6 flex flex-col items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#F29129]/30"
            onClick={() => router.push('/mentor/resources')}
            style={{ minHeight: '120px' }}
          >
            <span>Access Instructor Resources</span>
            <span className="text-sm font-normal mt-2 opacity-80">Reference all instructor resources</span>
          </button>

          {/* Dataset Search Tool */}
          <button
            className="rounded-full bg-gradient-to-r from-[#565889] to-[#2f3167] shadow-lg text-white text-xl font-semibold py-8 px-6 flex flex-col items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#FAC63B]/30"
            onClick={() => router.push('/search')}
            style={{ minHeight: '120px' }}
          >
            <span>Dataset Search Tool</span>
            <span className="text-sm font-normal mt-2 opacity-80">Access curated datasets and external databases</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white py-4 text-center text-[#535353] text-sm border-t">
        <p>© {new Date().getFullYear()} Inspirit AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
