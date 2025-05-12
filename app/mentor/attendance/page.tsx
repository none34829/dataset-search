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

export default function AttendanceTracker() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tenSessionStudents, setTenSessionStudents] = useState<TenSessionStudent[]>([]);
  const [twentyFiveSessionStudents, setTwentyFiveSessionStudents] = useState<TwentyFiveSessionStudent[]>([]);
  const [completedStudents, setCompletedStudents] = useState<CompletedStudent[]>([]);
  const [continuingStudents, setContinuingStudents] = useState<ContinuingStudent[]>([]);
  
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
          <h2 className="text-2xl font-bold">Student Attendance Records</h2>
          <Button 
            variant="outline" 
            onClick={() => router.push('/mentor')}
          >
            Back to Dashboard
          </Button>
        </div>
        
        <Tabs defaultValue="10-session" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="10-session">10-Session Students</TabsTrigger>
            <TabsTrigger value="25-session">25-Session Students</TabsTrigger>
            <TabsTrigger value="completed">Completed Students</TabsTrigger>
            <TabsTrigger value="continuing">Continuing Students</TabsTrigger>
          </TabsList>
          
          {/* 10-Session Students Tab */}
          <TabsContent value="10-session">
            <Card>
              <CardHeader>
                <CardTitle>10-Session Students</CardTitle>
                <CardDescription>
                  Students currently enrolled in the 10-session program
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tenSessionStudents.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No students found in this category</p>
                ) : (
                  <div className="space-y-8">
                    {tenSessionStudents.map((student, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{student.name}</h3>
                            <p className="text-sm text-gray-500">{student.grade}</p>
                          </div>
                          <div>
                            <p className="text-sm"><span className="font-medium">Deadline:</span> {new Date(student.deadline).toLocaleDateString()}</p>
                            <p className="text-sm"><span className="font-medium">Sessions Completed:</span> {student.sessionsCompleted}/10</p>
                          </div>
                          <div>
                            <p className="text-sm"><span className="font-medium">Experience:</span> {student.experience}</p>
                            <p className="text-sm"><span className="font-medium">Goals:</span> {student.goals}</p>
                          </div>
                        </div>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Array.from({ length: 5 }, (_, i) => (
                                <TableHead key={i}>Session {i + 1}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              {Array.from({ length: 5 }, (_, i) => (
                                <TableCell key={i} className={student.sessionDates[i].date === "Not completed" ? "text-gray-400" : ""}>
                                  {student.sessionDates[i].date === "Not completed" ? "Not completed" : new Date(student.sessionDates[i].date).toLocaleDateString()}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableBody>
                        </Table>
                        
                        <Table className="mt-2">
                          <TableHeader>
                            <TableRow>
                              {Array.from({ length: 5 }, (_, i) => (
                                <TableHead key={i}>Session {i + 6}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              {Array.from({ length: 5 }, (_, i) => (
                                <TableCell key={i} className={student.sessionDates[i+5].date === "Not completed" ? "text-gray-400" : ""}>
                                  {student.sessionDates[i+5].date === "Not completed" ? "Not completed" : new Date(student.sessionDates[i+5].date).toLocaleDateString()}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 25-Session Students Tab */}
          <TabsContent value="25-session">
            <Card>
              <CardHeader>
                <CardTitle>25-Session Students</CardTitle>
                <CardDescription>
                  Students currently enrolled in the 25-session program
                </CardDescription>
              </CardHeader>
              <CardContent>
                {twentyFiveSessionStudents.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No students found in this category</p>
                ) : (
                  <div className="space-y-8">
                    {twentyFiveSessionStudents.map((student, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{student.name}</h3>
                            <p className="text-sm text-gray-500">{student.grade}</p>
                          </div>
                          <div>
                            <p className="text-sm"><span className="font-medium">Deadline:</span> {new Date(student.deadline).toLocaleDateString()}</p>
                            <p className="text-sm"><span className="font-medium">Sessions Completed:</span> {student.sessionsCompleted}/25</p>
                          </div>
                          <div>
                            <p className="text-sm"><span className="font-medium">Experience:</span> {student.experience}</p>
                            <p className="text-sm"><span className="font-medium">Goals:</span> {student.goals}</p>
                          </div>
                        </div>
                        
                        {/* Show session dates in groups of 5 */}
                        {Array.from({ length: 5 }, (_, groupIndex) => (
                          <div key={groupIndex} className="mb-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <TableHead key={i}>Session {groupIndex * 5 + i + 1}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <TableCell 
                                      key={i} 
                                      className={student.sessionDates[groupIndex * 5 + i].date === "Not completed" ? "text-gray-400" : ""}
                                    >
                                      {student.sessionDates[groupIndex * 5 + i].date === "Not completed" 
                                        ? "Not completed" 
                                        : new Date(student.sessionDates[groupIndex * 5 + i].date).toLocaleDateString()}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                      </div>
                    ))}
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
    </div>
  );
}
