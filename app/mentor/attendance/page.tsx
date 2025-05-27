'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { X, Loader2 } from "lucide-react";

// Import types only from the service
import type { 
  TenSessionStudent,
  TwentyFiveSessionStudent,
  CompletedStudent,
  ContinuingStudent
} from '@/utils/googleSheetsService';

// Import the server actions that handle the filtering by mentor
import { 
  fetchTenSessionStudents,
  fetchTwentyFiveSessionStudents,
  fetchCompletedStudents,
  fetchContinuingStudents
} from './serverActions';

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'], display: 'swap' });

interface User {
  type: string;
  email: string;
  fullName?: string;
}

// Custom styles for the dialog close button
const customStyles = `
  /* Hide all default close buttons with extreme specificity */
  div[role="dialog"] button[data-radix-dialog-close]:not(.custom-close),
  [role="dialog"] div button[data-radix-dialog-close]:not(.custom-close),
  div[role="dialog"] > div > button[data-radix-dialog-close]:not(.custom-close),
  div[role="dialog"] > button[data-radix-dialog-close]:not(.custom-close) {
    opacity: 0 !important;
    visibility: hidden !important;
    display: none !important;
    pointer-events: none !important;
  }
  
  /* Remove all borders from the custom close button */
  .custom-close-btn {
    border: none !important;
    outline: none !important;
  }
`;

export default function AttendanceTracker() {
  // Function to format text with dashes by adding line breaks and ensuring all paragraphs start with dashes
  const formatDashedText = (text: string | undefined) => {
    if (!text) return '';
    
    // Check if the text starts with a dash already
    let formattedText = text.trim();
    if (!formattedText.startsWith('- ')) {
      // Add a dash to the first paragraph
      formattedText = '- ' + formattedText;
    }
    
    // Find all dash-prefixed items and ensure proper spacing between them
    formattedText = formattedText.replace(/([^\n])\s*- /g, '$1\n\n- ');
    
    return formattedText;
  };
  
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tenSessionStudents, setTenSessionStudents] = useState<TenSessionStudent[]>([]);
  const [twentyFiveSessionStudents, setTwentyFiveSessionStudents] = useState<TwentyFiveSessionStudent[]>([]);
  const [completedStudents, setCompletedStudents] = useState<CompletedStudent[]>([]);
  const [continuingStudents, setContinuingStudents] = useState<ContinuingStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
    
    // Load attendance data
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get the mentor's full name to filter students
        const mentorName = parsedUser.fullName || '';
        console.log('Fetching students for mentor:', mentorName);
        
        if (!mentorName) {
          console.error('No mentor name found for the logged-in user');
          throw new Error('Mentor name not found');
        }
        
        // Log the exact values being passed to each function
        console.log('Calling fetchTenSessionStudents with:', { mentorName });
        const tenSessionData = await fetchTenSessionStudents(false, mentorName);
        console.log('fetchTenSessionStudents result:', tenSessionData);
        
        console.log('Calling fetchTwentyFiveSessionStudents with:', { mentorName });
        const twentyFiveSessionData = await fetchTwentyFiveSessionStudents(false, mentorName);
        console.log('fetchTwentyFiveSessionStudents result:', twentyFiveSessionData);
        
        console.log('Calling fetchCompletedStudents with:', { mentorName });
        const completedData = await fetchCompletedStudents(false, mentorName);
        console.log('fetchCompletedStudents result:', completedData);
        
        console.log('Calling fetchContinuingStudents with:', { mentorName });
        const continuingData = await fetchContinuingStudents(false, mentorName);
        console.log('fetchContinuingStudents result:', continuingData);
        
        console.log(`Found ${tenSessionData.length} 10-session students for ${mentorName}`);
        console.log('Sample mentor names in 10-session:', tenSessionData.slice(0, 3).map((s: any) => s.mentorName));
        
        setTenSessionStudents(tenSessionData);
        setTwentyFiveSessionStudents(twentyFiveSessionData);
        setCompletedStudents(completedData);
        setContinuingStudents(continuingData);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
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
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
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
            <h1 className="ml-8 text-xl font-semibold">Student Attendance Tracker</h1>
          </div>
          
          <div className="flex items-center">
            <nav className="mr-6">
              <ul className="flex space-x-6">
                <li>
                  <Link 
                    href="/mentor"
                    className="px-3 py-2"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/mentor/attendance"
                    className="px-3 py-2 border-b-2 border-indigo-600 font-medium"
                  >
                    Attendance Tracker
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/search"
                    className="px-3 py-2"
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
                  className="h-10 w-10 rounded-full bg-gradient-to-r from-[#565889] to-[#2f3167] flex items-center justify-center text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                  aria-label="User menu"
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Student Progress</h2>
          <Button 
            variant="outline" 
            onClick={() => router.push('/mentor')}
          >
            Back to Dashboard
          </Button>
        </div>
        
        {/* Mentor greeting and submit attendance button */}
        <div className="flex justify-between items-center mb-6 mt-2">
          <div>
            <p className="text-gray-700">
              Hi {user ? (
                user.fullName ? (
                  // Use first word from fullName if available
                  user.fullName.trim().split(/\s+/)[0]
                ) : (
                  // Fallback to email if no fullName
                  user.email.split('@')[0].split(/[._-]/)[0]
                )
              ) : 'Mentor'}! Please find your current progress for your assigned students below. Click on each row to see more information about their Goals / Experience, etc
            </p>
          </div>
          <Button className="rounded-full px-6 bg-[rgba(86,88,137,0.1)] text-[#565889] hover:bg-[rgba(86,88,137,0.2)] border-0">
            Submit Attendance
          </Button>
        </div>
        
        <Tabs defaultValue="10-session" className="w-full">
          <TabsList className="mb-6 bg-gray-100 p-1 rounded-md">
            <TabsTrigger value="10-session" className="rounded-md px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">10 Session Students</TabsTrigger>
            <TabsTrigger value="25-session" className="rounded-md px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">25 Session Students</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-md px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Continuing Students</TabsTrigger>
            <TabsTrigger value="continuing" className="rounded-md px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Completed Students</TabsTrigger>
          </TabsList>
          
          {/* 10-Session Students Tab */}
          <TabsContent value="10-session">
            <Card className="border-0 shadow-sm bg-white rounded-md overflow-hidden">
              <CardHeader className="px-0 pt-0 pb-4">
                <div>
                  <CardDescription className="text-sm text-gray-500">
                    Students currently enrolled in the 10-session program
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    <span className="ml-2 text-gray-500">Loading student data...</span>
                  </div>
                ) : tenSessionStudents.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No students found in this category</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Student name</TableHead>
                          <TableHead>Meeting Link</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead>Sessions completed</TableHead>
                          <TableHead>1</TableHead>
                          <TableHead>2</TableHead>
                          <TableHead>3</TableHead>
                          <TableHead>4</TableHead>
                          <TableHead>5</TableHead>
                          <TableHead>6</TableHead>
                          <TableHead>7</TableHead>
                          <TableHead>8</TableHead>
                          <TableHead>9</TableHead>
                          <TableHead>10</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tenSessionStudents.map((student, index) => (
                          <TableRow 
                            key={index} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setSelectedStudent({...student, programType: '10-session'});
                              setIsModalOpen(true);
                            }}
                          >
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>
                              <Link 
                                href={student.meetingLink || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline" 
                                onClick={(e) => e.stopPropagation()}
                              >
                                Join
                              </Link>
                            </TableCell>
                            <TableCell>{student.deadline ? new Date(student.deadline).toLocaleDateString('en-US') : 'N/A'}</TableCell>
                            <TableCell>{student.sessionsCompleted || 0}/10</TableCell>
                            {Array.from({ length: 10 }, (_, i) => {
                              const session = student.sessionDates[i];
                              const sessionDate = session?.date;
                              const isFuture = sessionDate && new Date(sessionDate) > new Date();
                              const isCompleted = session?.completed;
                              
                              let displayText = '-';
                              let className = 'text-gray-400';
                              
                              if (sessionDate && sessionDate !== 'Not completed' && sessionDate.trim() !== '') {
                                if (isFuture) {
                                  displayText = 'Scheduled';
                                  className = 'text-blue-600';
                                } else if (isCompleted) {
                                  displayText = new Date(sessionDate).toLocaleDateString('en-US');
                                  className = 'text-green-600';
                                } else {
                                  displayText = new Date(sessionDate).toLocaleDateString('en-US');
                                  className = 'text-gray-900';
                                }
                              }
                              
                              return (
                                <TableCell 
                                  key={i} 
                                  className={`text-center text-sm ${className}`}
                                >
                                  {displayText}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 25-Session Students Tab */}
          <TabsContent value="25-session">
            <Card className="border-0 shadow-sm bg-white rounded-md overflow-hidden">
              <CardHeader className="px-0 pt-0 pb-4">
                <div>
                  <CardDescription className="text-sm text-gray-500">
                    Students currently enrolled in the 25-session program
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {twentyFiveSessionStudents.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No students found in this category</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Student name</TableHead>
                          <TableHead>Meeting Link</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead>Sessions completed</TableHead>
                          <TableHead>1</TableHead>
                          <TableHead>2</TableHead>
                          <TableHead>3</TableHead>
                          <TableHead>4</TableHead>
                          <TableHead>5</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {twentyFiveSessionStudents.map((student, index) => (
                          <TableRow 
                            key={index} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setSelectedStudent({...student, programType: '25-session'});
                              setIsModalOpen(true);
                            }}
                          >
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>
                              <Link href="#" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>Join</Link>
                            </TableCell>
                            <TableCell>{new Date(student.deadline).toLocaleDateString('en-US')}</TableCell>
                            <TableCell>{student.sessionsCompleted}/25</TableCell>
                            {Array.from({ length: 25 }, (_, i) => {
                              const session = student.sessionDates[i];
                              const sessionDate = session?.date;
                              const isFuture = sessionDate && new Date(sessionDate) > new Date();
                              const isCompleted = session?.completed;
                              
                              let displayText = '-';
                              let className = 'text-gray-400';
                              
                              if (sessionDate && sessionDate !== 'Not completed' && sessionDate.trim() !== '') {
                                if (isFuture) {
                                  displayText = 'Scheduled';
                                  className = 'text-blue-600';
                                } else if (isCompleted) {
                                  displayText = new Date(sessionDate).toLocaleDateString('en-US');
                                  className = 'text-green-600';
                                } else {
                                  displayText = new Date(sessionDate).toLocaleDateString('en-US');
                                  className = 'text-gray-900';
                                }
                              }
                              
                              return (
                                <TableCell 
                                  key={i} 
                                  className={`text-center text-sm ${className}`}
                                >
                                  {displayText}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Completed Students Tab */}
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Students</CardTitle>
                <CardDescription>
                  Students who have completed their program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Goals</TableHead>
                      <TableHead>Sessions Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          No students found in this category
                        </TableCell>
                      </TableRow>
                    ) : (
                      completedStudents.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.grade}</TableCell>
                          <TableCell>{student.experience}</TableCell>
                          <TableCell>{student.goals}</TableCell>
                          <TableCell>{student.totalSessionsCompleted}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Continuing Students Tab */}
          <TabsContent value="continuing">
            <Card>
              <CardHeader>
                <CardTitle>Continuing Students</CardTitle>
                <CardDescription>
                  Students continuing beyond their initial program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Goals</TableHead>
                      <TableHead>Sessions Completed</TableHead>
                      <TableHead>Sessions Remaining</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {continuingStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                          No students found in this category
                        </TableCell>
                      </TableRow>
                    ) : (
                      continuingStudents.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.grade}</TableCell>
                          <TableCell>{student.experience}</TableCell>
                          <TableCell>{student.goals}</TableCell>
                          <TableCell>{student.sessionsCompleted}</TableCell>
                          <TableCell>{student.sessionsRemaining}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Footer */}
      <footer className="border-t p-4 text-center text-gray-500 text-sm">
        <p> {new Date().getFullYear()} Inspirit AI. All rights reserved.</p>
      </footer>
      
      {/* Student Detail Modal - Custom Implementation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className={`relative bg-white rounded-md max-w-2xl w-full overflow-hidden p-0 z-50 shadow-lg ${inter.className}`}
               style={{ maxHeight: '85vh' }}>
            {/* Custom close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-1 -right-1 h-8 w-8 flex items-center justify-center bg-transparent hover:bg-transparent transition-colors cursor-pointer z-10 custom-close-btn border-0 outline-0 shadow-none"
              style={{ border: '0', outline: '0', boxShadow: 'none' }}
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>
            {selectedStudent && (
              <div className="p-6 space-y-6 w-full overflow-y-auto" style={{ maxHeight: 'calc(85vh - 40px)' }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
                    <p className="text-gray-500">{selectedStudent.grade}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <p>
                      <span className="font-medium">Deadline:</span> {new Date(selectedStudent.deadline).toLocaleDateString('en-US')}
                    </p>
                    <p>
                      <span className="font-medium">Sessions Completed:</span> {selectedStudent.sessionsCompleted}/{selectedStudent.programType === '10-session' ? '10' : '25'}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 mb-4">
                  <h4 className="font-medium">Dedicated Meeting Link</h4>
                  <Link 
                    href={selectedStudent.meetingLink || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open Meeting Link
                  </Link>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-md">
                  <p className="mb-2"><span className="font-medium">Experience:</span> {selectedStudent.experience}</p>
                  <p><span className="font-medium">Goals:</span> {selectedStudent.goals}</p>
                </div>
                
                {/* Pre-Program Information */}
                <div className="bg-gray-100 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Pre-Program Information</h4>
                  <p dangerouslySetInnerHTML={{ __html: formatDashedText(selectedStudent.preProgramInfo || 'No pre-program information available').replace(/\n/g, '<br />') }} />
                </div>
                
                {/* Pre-Program Assessment (Collapsible) */}
                <div className="bg-gray-100 rounded-md overflow-hidden">
                  <button 
                    onClick={() => {
                      const element = document.getElementById('pre-assessment-content');
                      if (element) {
                        element.classList.toggle('hidden');
                      }
                    }}
                    className="w-full p-4 text-left font-medium flex justify-between items-center"
                  >
                    <span>Pre-Program Assessment</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="transform transition-transform duration-200"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  <div id="pre-assessment-content" className="hidden p-4 pt-0 border-t border-gray-200">
                    <p dangerouslySetInnerHTML={{ __html: formatDashedText(selectedStudent.preAssessmentInfo || 'No pre-assessment information available').replace(/\n/g, '<br />') }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
