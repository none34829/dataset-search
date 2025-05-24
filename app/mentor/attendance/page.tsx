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
import { X } from "lucide-react";
import { 
  getTenSessionStudents, 
  getTwentyFiveSessionStudents, 
  getCompletedStudents, 
  getContinuingStudents,
  type TenSessionStudent,
  type TwentyFiveSessionStudent,
  type CompletedStudent,
  type ContinuingStudent
} from '@/utils/attendanceService';

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'], display: 'swap' });

interface User {
  type: string;
  email: string;
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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tenSessionStudents, setTenSessionStudents] = useState<TenSessionStudent[]>([]);
  const [twentyFiveSessionStudents, setTwentyFiveSessionStudents] = useState<TwentyFiveSessionStudent[]>([]);
  const [completedStudents, setCompletedStudents] = useState<CompletedStudent[]>([]);
  const [continuingStudents, setContinuingStudents] = useState<ContinuingStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
    
    // Load attendance data
    setTenSessionStudents(getTenSessionStudents());
    setTwentyFiveSessionStudents(getTwentyFiveSessionStudents());
    setCompletedStudents(getCompletedStudents());
    setContinuingStudents(getContinuingStudents());
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
              Hi {user ? (user.email.split('@')[0].split(/[._-]/)[0].charAt(0).toUpperCase() + user.email.split('@')[0].split(/[._-]/)[0].slice(1)) : '<Mentor First Name>'}! Please find your current progress for your assigned students below. Click on each row to see more information about their Goals / Experience, etc
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
                {tenSessionStudents.length === 0 ? (
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
                              <Link href="#" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>Join</Link>
                            </TableCell>
                            <TableCell>{new Date(student.deadline).toLocaleDateString()}</TableCell>
                            <TableCell>{student.sessionsCompleted}/10</TableCell>
                            {Array.from({ length: 5 }, (_, i) => (
                              <TableCell key={i} className={`text-center ${student.sessionDates[i].date === "Not completed" ? "text-gray-400" : ""}`}>
                                {student.sessionDates[i].date === "Not completed" ? "-" : new Date(student.sessionDates[i].date).toLocaleDateString()}
                              </TableCell>
                            ))}
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
                            <TableCell>{new Date(student.deadline).toLocaleDateString()}</TableCell>
                            <TableCell>{student.sessionsCompleted}/25</TableCell>
                            {Array.from({ length: 5 }, (_, i) => (
                              <TableCell key={i} className={`text-center ${student.sessionDates[i].date === "Not completed" ? "text-gray-400" : ""}`}>
                                {student.sessionDates[i].date === "Not completed" ? "-" : new Date(student.sessionDates[i].date).toLocaleDateString()}
                              </TableCell>
                            ))}
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
        <p>© {new Date().getFullYear()} Inspirit AI. All rights reserved.</p>
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
          <div className={`relative bg-white rounded-md max-w-2xl w-full overflow-hidden p-0 z-50 shadow-lg ${inter.className}`}>
            {/* Custom close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-1 -right-1 h-8 w-8 flex items-center justify-center bg-transparent hover:bg-transparent transition-colors cursor-pointer z-10 custom-close-btn border-0 outline-0 shadow-none"
              style={{ border: '0', outline: '0', boxShadow: 'none' }}
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>
            {selectedStudent && (
              <div className="p-6 space-y-6 w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
                    <p className="text-gray-500">{selectedStudent.grade}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <p>
                      <span className="font-medium">Deadline:</span> {new Date(selectedStudent.deadline).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Sessions Completed:</span> {selectedStudent.sessionsCompleted}/{selectedStudent.programType === '10-session' ? '10' : '25'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-md">
                  <p className="mb-2"><span className="font-medium">Experience:</span> {selectedStudent.experience}</p>
                  <p><span className="font-medium">Goals:</span> {selectedStudent.goals}</p>
                </div>
                
                <div className="flex justify-between items-center mt-4 mb-4">
                  <h4 className="font-medium">Dedicated Meeting Link</h4>
                  <Link href="#" className="text-blue-600 hover:underline">Open Meeting Link</Link>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Pre-Program Information Here</h4>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
