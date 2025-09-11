'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'], display: 'swap' });

interface User {
  type: string;
  email: string;
  fullName?: string;
}

export default function ProgressTracking() {
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
    if (parsedUser.type !== 'student') {
      router.push('/search'); // Redirect non-students to dataset search
      return;
    }
    
    setUser(parsedUser);
  }, [router]);

  const getProfileInitials = () => {
    if (!user) return '';
    
    if (user.fullName) {
      const nameParts = user.fullName.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      } else if (nameParts[0]) {
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    }
    
    const name = user.email.split('@')[0];
    const parts = name.split(/[._-]/);
    
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      return name.substring(0, 2).toUpperCase();
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
    <div className={`min-h-screen bg-[#F8F8F8] flex flex-col ${inter.className}`}> 
      {/* Header Bar */}
      <header className="w-full bg-[rgba(86,88,137,0.5)] py-4 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <img src="/updated+logo+3.15.24-2.png" alt="INSPIRIT AI Logo" className="h-10 w-auto" />
          <span className="text-white text-2xl font-semibold tracking-wide">Student Portal</span>
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
              <button className="h-10 w-10 rounded-full bg-[#6869A0] text-white flex items-center justify-center font-bold text-lg shadow hover:bg-[#2f3167] transition-colors">
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
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-[#2f3167]">Progress Tracking</h1>
          <p className="text-xl text-gray-600 mb-8">Coming Soon!</p>
          <p className="text-gray-500 mb-8">Track your learning journey, milestones, and achievements as you progress through your projects.</p>
          <button
            onClick={() => router.push('/student')}
            className="bg-[#565889] text-white px-6 py-3 rounded-lg hover:bg-[#2f3167] transition-colors"
          >
            Back to Student Portal
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
