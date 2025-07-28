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
import {
  getTenSessionStudents,
  getTwentyFiveSessionStudents,
  getCompletedStudents,
  getContinuingStudents
} from "@/utils/googleSheetsService";
import SpecialSessionQuestions from './SpecialSessionQuestions';

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
  const [students, setStudents] = useState<Student[]>([]); // Empty array initially, will be populated from sheets
  const [loading, setLoading] = useState<boolean>(false); // Loading state for students fetch
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
  const [exitTicket, setExitTicket] = useState<string>('');
  const [progressDescription, setProgressDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [rescheduleHours, setRescheduleHours] = useState('');
  const [unexcusedContext, setUnexcusedContext] = useState('');
  const [autoSessionNumber, setAutoSessionNumber] = useState<string>('');
  const [specialQuestionValues, setSpecialQuestionValues] = useState<Record<string, string>>({});
  const [specialQuestionErrors, setSpecialQuestionErrors] = useState<Record<string, string>>({});
  const [selectedStudentType, setSelectedStudentType] = useState<'10' | '25' | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine max sessions based on student type
  let maxSessions = 25;
  if (selectedStudentType === '10') maxSessions = 10;
  if (selectedStudentType === '25') maxSessions = 25;
  const sessionNumberInt = parseInt(autoSessionNumber, 10);
  const sessionLimitReached = sessionNumberInt > maxSessions;

  // Validation logic for required fields
  const specialQuestionsRequired = (selectedStudentType && autoSessionNumber && Object.keys(specialQuestionValues).length > 0);
  const specialQuestionsIncomplete = specialQuestionsRequired && (
    Object.values(specialQuestionValues).some(v => !v) ||
    Object.values(specialQuestionErrors).some(e => !!e)
  );
  // Only allow submit if session number is a valid number
  const sessionNumberReady = !!autoSessionNumber && !isNaN(Number(autoSessionNumber));

  const isFormIncomplete = Boolean(
    !selectedStudent ||
    !date ||
    isExcusedAbsence === null ||
    (isExcusedAbsence === true && (!rescheduleHours || !unexcusedContext)) ||
    (isExcusedAbsence === false && (!exitTicket || !progressDescription)) ||
    specialQuestionsIncomplete ||
    sessionLimitReached ||
    !sessionNumberReady
  );
  
  // Function to fetch fresh student data in the background
  const fetchFreshStudentData = async (mentorName: string) => {
    try {
      // Force refresh = true to bypass any API-level caching
      const [tenSessionStudents, twentyFiveSessionStudents, completedStudents, continuingStudents] = await Promise.all([
        getTenSessionStudents(true, mentorName),
        getTwentyFiveSessionStudents(true, mentorName),
        getCompletedStudents(true, mentorName),
        getContinuingStudents(true, mentorName)
      ]);

      // Transform and process as usual (EXCLUDE completedStudents)
      const allStudents: Student[] = [
        ...tenSessionStudents.map((student, index) => ({
          id: `10_${index}`,
          name: student.name
        })),
        ...twentyFiveSessionStudents.map((student, index) => ({
          id: `25_${index}`,
          name: student.name
        })),
        ...continuingStudents.map((student, index) => ({
          id: `cont_${index}`,
          name: student.name
        }))
        // completedStudents are excluded
      ];

      // Remove duplicates
      const uniqueStudents = Array.from(new Map(allStudents.map(student => 
        [student.name, student]
      )).values());

      // Sort students by name in ascending order
      uniqueStudents.sort((a, b) => a.name.localeCompare(b.name));

      // Always use the fetched students, even if empty
      console.log(`Background fetch: Found ${uniqueStudents.length} students for mentor ${mentorName}`);
      setStudents(uniqueStudents);
      cacheStudents(mentorName, uniqueStudents);
    } catch (error) {
      console.error('Background refresh error:', error);
    }
  };
  
  // Cache key for localStorage
  const getCacheKey = (mentorName: string) => `mentor_students_${mentorName.replace(/\s+/g, '_').toLowerCase()}`;
  
  // Try to get students from cache
  const getCachedStudents = (mentorName: string): Student[] | null => {
    try {
      const cacheKey = getCacheKey(mentorName);
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { students, timestamp } = JSON.parse(cachedData);
        // Cache is valid for a short time (5 minutes) to avoid hammering the API
        // but refresh frequently enough to catch new student assignments
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          console.log('Using cached students data');
          return students;
        }
      }
    } catch (error) {
      console.error('Error reading from cache:', error);
    }
    return null;
  };
  
  // Save students to cache
  const cacheStudents = (mentorName: string, students: Student[]) => {
    try {
      const cacheKey = getCacheKey(mentorName);
      localStorage.setItem(cacheKey, JSON.stringify({
        students,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  // Fetch students for the current mentor from all sheets
  const fetchStudentsForMentor = async (mentorName: string) => {
    // Try to get cached students first for immediate display
    const cachedStudents = getCachedStudents(mentorName);
    if (cachedStudents) {
      setStudents(cachedStudents);
      // Even with valid cache, always fetch fresh data in background
      // This ensures we eventually get new students while still being responsive
      setTimeout(() => fetchFreshStudentData(mentorName), 100);
      return;
    }
    
    // No defaults, just show empty list while loading
    setStudents([]);
    setLoading(true);
    
    try {
      // Fetch all student types in parallel with Promise.all
      const [tenSessionStudents, twentyFiveSessionStudents, completedStudents, continuingStudents] = await Promise.all([
        getTenSessionStudents(false, mentorName),
        getTwentyFiveSessionStudents(false, mentorName),
        getCompletedStudents(false, mentorName),
        getContinuingStudents(false, mentorName)
      ]);

      // Transform all student data into the format needed for the dropdown (EXCLUDE completedStudents)
      const allStudents: Student[] = [
        // 10-Session Students
        ...tenSessionStudents.map((student, index) => ({
          id: `10_${index}`,
          name: student.name
        })),
        // 25-Session Students
        ...twentyFiveSessionStudents.map((student, index) => ({
          id: `25_${index}`,
          name: student.name
        })),
        // Continuing Students
        ...continuingStudents.map((student, index) => ({
          id: `cont_${index}`,
          name: student.name
        }))
        // Completed students are excluded
      ];

      // Remove any duplicates (in case a student appears in multiple sheets)
      const uniqueStudents = Array.from(new Map(allStudents.map(student => 
        [student.name, student]
      )).values());

      // Sort students by name in ascending order
      uniqueStudents.sort((a, b) => a.name.localeCompare(b.name));

      console.log(`Fetched ${uniqueStudents.length} students for mentor ${mentorName}`);
      
      // Set students or use fallback if none found
      // Always use the fetched students, even if empty
      setStudents(uniqueStudents);
      // Cache the results for future use
      cacheStudents(mentorName, uniqueStudents);
    } catch (error) {
      console.error('Error fetching students for mentor:', error);
      // Keep the default students we already set
    } finally {
      setLoading(false);
    }
  };

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
      
      // ONLY ALLOW TEST USER DURING TESTING (when done testing, comment out the entire block from here
      if (parsedUser.email !== 'synghalronil@gmail.com') {
        setUser({ ...parsedUser, notAllowed: true });
        return;
      } //to here

      // --- To re-enable all mentors after testing, comment out the above block and uncomment the below ---
      // if (parsedUser.type !== 'mentor') {
      //   console.log('User is not a mentor, redirecting to search');
      //   router.push('/search'); // Redirect non-mentors to dataset search
      //   return;
      // }
      setUser(parsedUser);
      
      // Fetch students for this mentor
      if (parsedUser.fullName) {
        fetchStudentsForMentor(parsedUser.fullName);
      } else if (parsedUser.email) {
        // If fullName is not available, use email as a fallback
        const nameFromEmail = parsedUser.email.split('@')[0];
        fetchStudentsForMentor(nameFromEmail);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      router.push('/');
      return;
    }
  }, [router]);

  // When a student is selected, determine their type
  useEffect(() => {
    if (selectedStudent && students.length > 0) {
      // Try to infer type from id or other property
      const found = students.find(s => s.name === selectedStudent);
      if (found && found.id) {
        if (found.id.startsWith('10_')) setSelectedStudentType('10');
        else if (found.id.startsWith('25_')) setSelectedStudentType('25');
        else setSelectedStudentType(null);
      } else {
        setSelectedStudentType(null);
      }
    } else {
      setSelectedStudentType(null);
    }
  }, [selectedStudent, students]);

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

  // In handleSubmit, validate special questions if present
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);
    // Validate special questions
    let hasSpecialError = false;
    Object.values(specialQuestionErrors).forEach(err => {
      if (err) hasSpecialError = true;
    });
    // If any special question is required for this session, ensure it's filled
    if ((selectedStudentType && autoSessionNumber) && (specialQuestionValues && Object.keys(specialQuestionValues).length > 0)) {
      for (const key of Object.keys(specialQuestionValues)) {
        if (!specialQuestionValues[key] || specialQuestionErrors[key]) {
          hasSpecialError = true;
          setSpecialQuestionErrors(prev => ({ ...prev, [key]: specialQuestionErrors[key] || 'This field is required.' }));
        }
      }
    }
    if (hasSpecialError) {
      setSubmitting(false);
      setSubmitMessage('Please fix errors in the special session questions.');
      return;
    }
    try {
      const payload: any = {
        mentorName: user?.fullName || user?.email.split('@')[0],
        mentorEmail: user?.email,
        studentName: selectedStudent,
        sessionDate: date ? `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}` : '',
        isUnexcusedAbsence: isExcusedAbsence,
        specialQuestionValues,
        specialQuestionSession: autoSessionNumber,
        specialQuestionType: selectedStudentType,
      };
      if (isExcusedAbsence === true) {
        payload.rescheduleHours = rescheduleHours;
        payload.unexcusedContext = unexcusedContext;
      } else if (isExcusedAbsence === false) {
        payload.progressDescription = progressDescription;
        payload.exitTicket = exitTicket;
      }
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitMessage('Attendance submitted successfully!');
        setSelectedStudent('');
        setDate(new Date());
        setIsExcusedAbsence(null);
        setExitTicket('');
        setProgressDescription('');
        setRescheduleHours('');
        setUnexcusedContext('');
        setAutoSessionNumber('');
        setSpecialQuestionValues({});
        setSpecialQuestionErrors({});
      } else {
        setSubmitMessage('Failed to submit attendance: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      setSubmitMessage('Failed to submit attendance: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Update the session number fetching logic to be more responsive
  useEffect(() => {
    const fetchSessionNumber = async () => {
      if (user && selectedStudent) {
        // Show loading state immediately
        setAutoSessionNumber("Calculating...");
        
        try {
          const res = await fetch('/api/attendance/session-number', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mentorName: user.fullName || user.email.split('@')[0],
              studentName: selectedStudent,
            }),
          });
          const data = await res.json();
          if (data.sessionNumber) {
            setAutoSessionNumber(data.sessionNumber.toString());
          } else {
            setAutoSessionNumber('1'); // Fallback to 1 if no data
          }
        } catch (error) {
          console.error('Error fetching session number:', error);
          setAutoSessionNumber('1'); // Fallback to 1 on error
        }
      } else {
        setAutoSessionNumber('');
      }
    };
    
    // Add a small delay to avoid too many requests
    const timeoutId = setTimeout(fetchSessionNumber, 100);
    return () => clearTimeout(timeoutId);
  }, [user, selectedStudent]);

  // Auto-dismiss submitMessage after 5 seconds
  useEffect(() => {
    if (submitMessage) {
      const timer = setTimeout(() => setSubmitMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [submitMessage]);

  if (!user) {
    return null;
  }
  if ((user as any).notAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-100 text-red-700 px-6 py-4 rounded shadow text-lg font-semibold mt-20">
          Access restricted: Only the test user can use this page during testing.
        </div>
      </div>
    );
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
          {submitMessage && (
            <div className={`mb-6 px-4 py-3 rounded-md text-sm font-medium ${submitMessage.toLowerCase().includes('success') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {submitMessage}
            </div>
          )}
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
                        disabled={submitting}
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
                      {loading ? (
                        <div className="py-2 pl-3 pr-9 text-gray-500 flex items-center">
                          <svg className="animate-spin h-4 w-4 mr-2 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading students...
                        </div>
                      ) : filteredStudents.length > 0 ? (
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
                {submitting ? (
                  <div className="pointer-events-none opacity-50">
                    <CustomCalendar
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate);
                      }}
                    />
                  </div>
                ) : (
                  <CustomCalendar
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                    }}
                  />
                )}
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
                    disabled={submitting}
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
                    disabled={submitting}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
            
            {selectedStudent && isExcusedAbsence !== null && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Number</label>
                <input type="text" value={autoSessionNumber} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" disabled={submitting} />
              </div>
            )}
            
            {isExcusedAbsence === true && (
              <>
                {/* Reschedule Hours dropdown */}
                <div className="mb-6">
                  <label htmlFor="rescheduleHours" className="block text-sm font-medium text-gray-700 mb-1">How many hours before the session was it rescheduled?</label>
                  <select id="rescheduleHours" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={rescheduleHours} onChange={(e) => setRescheduleHours(e.target.value)} disabled={submitting}>
                    <option value="">Select an option</option>
                    <option value="No Show">No Show</option>
                    <option value="Within 1 Hour">Within 1 Hour</option>
                    {[...Array(23)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                </div>
                {/* Unexcused Context textarea */}
                <div className="mb-6">
                  <label htmlFor="unexcusedContext" className="block text-sm font-medium text-gray-700 mb-1">Please provide any more context / reason provided by the student.</label>
                  <textarea id="unexcusedContext" placeholder="Type here" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-32" value={unexcusedContext} onChange={(e) => setUnexcusedContext(e.target.value)} disabled={submitting} />
                </div>
              </>
            )}
            {isExcusedAbsence === false && (
              <>
                {/* Exit Ticket input */}
                <div className="mb-6">
                  <label htmlFor="exitTicket" className="block text-sm font-medium text-gray-700 mb-1">Please link your Exit Ticket (Google Docs) from your session here. Your Exit Ticket should be in your student folder for proper attendance tracking.</label>
                  <input type="text" id="exitTicket" placeholder="Type here" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={exitTicket} onChange={(e) => setExitTicket(e.target.value)} disabled={submitting} />
                </div>
                {/* Progress Description textarea */}
                <div className="mb-6">
                  <label htmlFor="progressDescription" className="block text-sm font-medium text-gray-700 mb-1">Please describe your progress today in a few sentences</label>
                  <textarea id="progressDescription" placeholder="Type here" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-32" value={progressDescription} onChange={(e) => setProgressDescription(e.target.value)} disabled={submitting} />
                </div>
              </>
            )}
            
            {selectedStudentType && autoSessionNumber && (
              <SpecialSessionQuestions
                studentType={selectedStudentType}
                sessionNumber={parseInt(autoSessionNumber)}
                values={specialQuestionValues}
                setValues={setSpecialQuestionValues}
                errors={specialQuestionErrors}
                setErrors={setSpecialQuestionErrors}
              />
            )}

            <div className="flex justify-center relative">
              <span
                onMouseEnter={() => { if (isFormIncomplete) setShowTooltip(true); }}
                onMouseLeave={() => setShowTooltip(false)}
                className="flex"
              >
                <Button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={submitting || isFormIncomplete}
                >
                  {submitting && (
                    <span className="flex items-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  )}
                  <span>{submitting ? 'Submitting...' : 'Submit'}</span>
                </Button>
                {showTooltip && isFormIncomplete && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs rounded px-3 py-2 shadow-lg z-50 whitespace-nowrap pointer-events-none animate-fade-in">
                    {!sessionNumberReady
                      ? 'Please wait for the session number to finish calculating.'
                      : sessionLimitReached
                        ? `This student is only enrolled for up to ${maxSessions} sessions. No more attendance can be submitted.`
                        : 'Please fill out all required fields before submitting.'}
                  </div>
                )}
              </span>
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
