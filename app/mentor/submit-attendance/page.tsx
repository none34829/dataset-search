'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CustomCalendar } from "@/components/ui/custom-calendar";
// Importing and using native Date formatting instead of date-fns
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'], display: 'swap' });

interface User {
  type: string;
  email: string;
  fullName?: string;
}

interface Student {
  id: string;
  name: string;
}

export default function SubmitAttendance() {
  const router = useRouter();
  const studentDropdownRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'Student Name 1' },
    { id: '2', name: 'Student Name 2' },
    { id: '3', name: 'Jacob' },
  ]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isExcusedAbsence, setIsExcusedAbsence] = useState<boolean | null>(null);
  const [sessionNumber, setSessionNumber] = useState<string>('3');
  const [exitTicket, setExitTicket] = useState<string>('');
  const [progressDescription, setProgressDescription] = useState<string>('');
  
  useEffect(() => {
    // Load user info from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('No user found in localStorage, redirecting to login');
      router.push('/'); // Redirect to login if no user found
      return;
    }
    
    let parsedUser;
    try {
      parsedUser = JSON.parse(userStr);
      console.log('Parsed user from localStorage:', parsedUser);
      
      if (parsedUser.type !== 'mentor') {
        console.log('User is not a mentor, redirecting to search');
        router.push('/search'); // Redirect non-mentors to dataset search
        return;
      }
      
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      router.push('/');
      return;
    }
  }, [router]);

  const getProfileInitials = () => {
    if (!user) return '';
    
    // Use fullName if available, otherwise fall back to email
    const nameToUse = user.fullName || user.email.split('@')[0];
    
    // Split into words and get first letters of first two words
    const nameParts = nameToUse.trim().split(/\s+/);
    
    if (nameParts.length >= 2) {
      // First letter of first and last name
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts[0]) {
      // If only one name part, use first two characters if available
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    
    // Fallback to first two letters of email username
    const emailParts = user.email.split('@')[0].split(/[._-]/);
    if (emailParts.length >= 2) {
      return (emailParts[0][0] + emailParts[1][0]).toUpperCase();
    } else if (emailParts[0]) {
      return emailParts[0].substring(0, 2).toUpperCase();
    }
    
    return '??';
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Process form submission
    console.log({
      selectedStudent,
      date,
      isExcusedAbsence,
      sessionNumber,
      exitTicket,
      progressDescription
    });
    
    // Show success message or redirect
    alert('Attendance submitted successfully!');
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      {/* Header Bar */}
      <header className="w-full bg-white py-3 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Link href="/mentor" className="flex items-center gap-2">
            <div className="flex items-center">
              <img src="/updated+logo+3.15.24-2.png" alt="INSPIRIT AI Logo" className="h-8 w-auto" />
              <span className="text-[#2f3167] text-xl font-semibold ml-2">Student Attendance Tracker</span>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-5">
          <nav>
            <ul className="flex items-center">
              <li>
                <Link 
                  href="/mentor"
                  className="px-3 py-2 text-[#2f3167]/70 hover:text-[#2f3167] transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li className="border-b-2 border-[#2f3167]">
                <Link 
                  href="/mentor/attendance"
                  className="px-3 py-2 text-[#2f3167] font-medium"
                >
                  Attendance Tracker
                </Link>
              </li>
              <li>
                <Link 
                  href="/search"
                  className="px-3 py-2 text-[#2f3167]/70 hover:text-[#2f3167] transition-colors"
                >
                  Dataset Tool
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Profile Button with Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <button 
                className="h-10 w-10 rounded-full bg-[#2f3167] text-white flex items-center justify-center font-semibold text-sm hover:bg-[#565889] transition-colors"
                aria-label="User menu"
              >
                {getProfileInitials()}
              </button>
            </PopoverTrigger>
            <PopoverContent className={`w-32 p-0 ${inter.className}`} align="end">
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-[#2f3167] hover:bg-[#F8F8F8] transition-colors">
                Log Out
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-4 text-center">Submit Attendance</h1>
        
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-6">
          <p className="mb-6 text-gray-700">
            Hi {user && user.fullName ? user.fullName.trim().split(' ')[0] : user ? user.email.split('@')[0].split(/[._-]/)[0].charAt(0).toUpperCase() + user.email.split('@')[0].split(/[._-]/)[0].slice(1) : 'Mentor'}! Please submit your attendance here. If you are submitting for a student not listed below, please reach out to AI Mentorship Team on Slack.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Student Name */}
              <div>
                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-1">
                  Student Name
                </label>
                <div className="relative" ref={studentDropdownRef}>
                  <div className="w-full border border-gray-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 relative">
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <input
                        type="text"
                        className="w-full px-3 py-2 border-none focus:outline-none focus:ring-0"
                        placeholder="Student Name"
                        value={selectedStudent || searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedStudent('');
                          if (!isDropdownOpen) setIsDropdownOpen(true);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDropdownOpen(true);
                        }}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                          <path d="M7 7l3 3 3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-60">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 ${
                              selectedStudent === student.name ? 'bg-indigo-100' : ''
                            }`}
                            onClick={() => {
                              setSelectedStudent(student.name);
                              setSearchQuery('');
                              setIsDropdownOpen(false);
                            }}
                          >
                            {student.name}
                          </div>
                        ))
                      ) : (
                        <div className="py-2 pl-3 pr-9 text-gray-500 italic">
                          No students found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Session Date */}
              <div>
                <label htmlFor="sessionDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Session Date
                </label>
                <CustomCalendar
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate);
                  }}
                />
              </div>
            </div>
            
            {/* Unexcused Absence Question */}
            <div className="mb-6">
              <p className="text-gray-700 font-medium mb-2">
                Are you filling this attendance form to record an unexcused absence past their 1st unexcused absence?
              </p>
              <p className="text-gray-700 mb-4 font-semibold">
                We ask that before you count a session as missed, please wait 20 minutes after the scheduled time has passed to give the student an opportunity to join the meeting.
              </p>
              <p className="text-gray-700 mb-4">
                If your student does not give advanced notice, you can count it as a missed session after 20 minutes. For all absences, <span className="font-semibold">please send a message</span> in your <span className="italic">#yourname-mentorshipteam</span> channel on Slack tagging AI Mentorship Team. Only log the session as missed if it is past their 1st unexcused absence. For example, if student Tina misses 2 sessions with no notice, then that counts as 1 absence. For attendance logging past the 1st unexcused absence, please make in the notes that the student was a no-show. The following reasons count as emergency excused absences and will not count against the student's sessions or their freebie, and should not be logged as a missed session:
              </p>
              <ul className="list-disc pl-8 mb-4 text-gray-700">
                <li>Urgent sickness/hospitalization</li>
                <li>Urgent family emergency</li>
                <li>Sudden power outages/sudden wifi outages</li>
              </ul>
              
              <div className="flex items-center space-x-6">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="excusedAbsence"
                    className="form-radio h-5 w-5 text-indigo-600"
                    onChange={() => setIsExcusedAbsence(true)}
                    checked={isExcusedAbsence === true}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="excusedAbsence"
                    className="form-radio h-5 w-5 text-indigo-600"
                    onChange={() => setIsExcusedAbsence(false)}
                    checked={isExcusedAbsence === false}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Session Number */}
              <div>
                <label htmlFor="sessionNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Session Number
                </label>
                <input
                  type="number"
                  id="sessionNumber"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={sessionNumber}
                  onChange={(e) => setSessionNumber(e.target.value)}
                  min="1"
                  max="25"
                />
              </div>
              
              {/* Exit Ticket */}
              <div>
                <label htmlFor="exitTicket" className="block text-sm font-medium text-gray-700 mb-1">
                  Please link your Exit Ticket from this session here
                </label>
                <input
                  type="text"
                  id="exitTicket"
                  placeholder="Type here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={exitTicket}
                  onChange={(e) => setExitTicket(e.target.value)}
                />
              </div>
            </div>
            
            {/* Progress Description */}
            <div className="mb-6">
              <label htmlFor="progressDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Please describe your progress today in a few sentences
              </label>
              <textarea
                id="progressDescription"
                placeholder="Type here"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-32"
                value={progressDescription}
                onChange={(e) => setProgressDescription(e.target.value)}
              />
            </div>
            
            <div className="flex justify-center">
              <Button 
                type="submit" 
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700"
              >
                Submit
              </Button>
            </div>
          </form>
        </div>
      </main>
      
      <footer className="py-4 text-center text-sm text-gray-500">
        © 2025 Inspirit AI. All rights reserved.
      </footer>
    </div>
  );
}
