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

export default function StudentPortal() {
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
    
    // If we have the student's full name, use the first letter of the first and second words
    if (user.fullName) {
      const nameParts = user.fullName.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        // First letter of first word + first letter of second word
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      } else if (nameParts[0]) {
        // If only one word, use first two letters
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    }
    
    // Fallback to email if no name is available
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

  // Extract student first name from the full name or email
  let studentFirstName = '';
  if (user.fullName) {
    // Get just the first name (first word) from the full name
    const nameWords = user.fullName.trim().split(' ');
    if (nameWords.length > 0) {
      // Format the first name properly (capitalize first letter)
      studentFirstName = nameWords[0].charAt(0).toUpperCase() + nameWords[0].slice(1).toLowerCase();
    }
  }
  
  // Fallback to email only if we couldn't get a name from the full name
  if (!studentFirstName) {
    studentFirstName = user.email.split('@')[0].split(/[._-]/)[0].charAt(0).toUpperCase() + user.email.split('@')[0].split(/[._-]/)[0].slice(1);
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
        <h2 className="text-3xl font-bold mb-8 text-[#2f3167] drop-shadow-sm">Welcome, {studentFirstName}!</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl">
          {/* Dataset Search Tool */}
          <button
            className="rounded-full bg-gradient-to-r from-[#565889] to-[#2f3167] shadow-lg text-white text-xl font-semibold py-8 px-6 flex flex-col items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#FAC63B]/30"
            onClick={() => router.push('/search')}
            style={{ minHeight: '120px' }}
          >
            <span>Dataset Search</span>
            <span className="text-sm font-normal mt-2 opacity-80">Access curated datasets and external databases</span>
          </button>

          {/* Project Resources */}
          <button
            className="rounded-full bg-gradient-to-r from-[#565889] to-[#2f3167] shadow-lg text-white text-xl font-semibold py-8 px-6 flex flex-col items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#F29129]/30"
            onClick={() => router.push('/student/project-resources')}
            style={{ minHeight: '120px' }}
          >
            <span>Project Resources</span>
            <span className="text-sm font-normal mt-2 opacity-80">Access learning materials and project guides</span>
          </button>

          {/* Progress Tracking */}
          <button
            className="rounded-full bg-gradient-to-r from-[#565889] to-[#2f3167] shadow-lg text-white text-xl font-semibold py-8 px-6 flex flex-col items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#FAC63B]/30"
            onClick={() => router.push('/student/progress')}
            style={{ minHeight: '120px' }}
          >
            <span>Progress Tracking</span>
            <span className="text-sm font-normal mt-2 opacity-80">Track your learning journey and milestones</span>
          </button>

          {/* Community Hub */}
          <button
            className="rounded-full bg-gradient-to-r from-[#565889] to-[#2f3167] shadow-lg text-white text-xl font-semibold py-8 px-6 flex flex-col items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#F29129]/30"
            onClick={() => router.push('/student/community')}
            style={{ minHeight: '120px' }}
          >
            <span>Community Hub</span>
            <span className="text-sm font-normal mt-2 opacity-80">Connect with peers and mentors</span>
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
