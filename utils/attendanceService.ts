"use server";

import {
  getTenSessionStudents as fetchTenSessionStudents,
  getTwentyFiveSessionStudents as fetchTwentyFiveSessionStudents,
  getCompletedStudents as fetchCompletedStudents,
  getContinuingStudents as fetchContinuingStudents,
  TenSessionStudent as SheetTenSessionStudent,
  TwentyFiveSessionStudent as SheetTwentyFiveSessionStudent,
  CompletedStudent as SheetCompletedStudent,
  ContinuingStudent as SheetContinuingStudent,
  BaseStudentData,
  fetchStudentAttendanceData
} from './googleSheetsService';

// Interfaces for different student types
export interface BaseStudent {
  name: string;
  grade: string;
  experience: string;
  goals: string;
}

export interface SessionStudent extends BaseStudent {
  deadline: string;
  sessionsCompleted: number;
  sessionDates: { sessionNumber: number; date: string }[];
}

export interface TenSessionStudent extends SessionStudent {
  // Same as SessionStudent but specifically for 10 sessions
}

export interface TwentyFiveSessionStudent extends SessionStudent {
  // Same as SessionStudent but specifically for 25 sessions
}

export interface CompletedStudent extends BaseStudent {
  totalSessionsCompleted: number;
}

export interface ContinuingStudent extends BaseStudent {
  sessionsCompleted: number;
  sessionsRemaining: number;
  sessionsContinuingFor: number;
  sessionsHeld: number;
}

// Function to convert Google Sheets data format to our app's format
function convertSheetDataToAppFormat(student: SheetTenSessionStudent | SheetTwentyFiveSessionStudent, sessionCount: number) {
  return {
    name: student.name,
    deadline: student.deadline,
    sessionsCompleted: student.sessionsCompleted,
    grade: student.grade,
    experience: student.experience,
    goals: student.goals,
    sessionDates: student.sessionDates.map((session: { date: string; completed: boolean }, index: number) => ({
      sessionNumber: index + 1,
      date: session.date
    })).slice(0, sessionCount)
  };
}

// Service functions to retrieve data from Google Sheets
export async function getTenSessionStudents(): Promise<TenSessionStudent[]> {
  try {
    const sheetStudents = await fetchTenSessionStudents();
    return sheetStudents.map(student => convertSheetDataToAppFormat(student, 10) as TenSessionStudent);
  } catch (error) {
    console.error('Error fetching 10-session students:', error);
    // Fallback to mock data if needed
    return getMockTenSessionStudents();
  }
}

export async function getTwentyFiveSessionStudents(): Promise<TwentyFiveSessionStudent[]> {
  try {
    const sheetStudents = await fetchTwentyFiveSessionStudents();
    return sheetStudents.map(student => convertSheetDataToAppFormat(student, 25) as TwentyFiveSessionStudent);
  } catch (error) {
    console.error('Error fetching 25-session students:', error);
    // Fallback to mock data if needed
    return getMockTwentyFiveSessionStudents();
  }
}

export async function getCompletedStudents(): Promise<CompletedStudent[]> {
  try {
    const sheetStudents = await fetchCompletedStudents();
    return sheetStudents.map(student => ({
      name: student.name,
      grade: student.grade,
      experience: student.experience,
      goals: student.goals,
      totalSessionsCompleted: student.sessionsCompleted
    }));
  } catch (error) {
    console.error('Error fetching completed students:', error);
    // Fallback to mock data if needed
    return getMockCompletedStudents();
  }
}

export async function getContinuingStudents(): Promise<ContinuingStudent[]> {
  try {
    const sheetStudents = await fetchContinuingStudents();
    return sheetStudents.map(student => ({
      name: student.name,
      grade: student.grade,
      experience: student.experience,
      goals: student.goals,
      sessionsCompleted: student.sessionsCompleted,
      sessionsRemaining: student.sessionsRemaining,
      sessionsContinuingFor: student.sessionsContinuingFor || 0,
      sessionsHeld: student.sessionsHeld || 0
    }));
  } catch (error) {
    console.error('Error fetching continuing students:', error);
    // Fallback to mock data if needed
    return getMockContinuingStudents();
  }
}

// Helper function to get all students for the dashboard
export async function getAllStudentsSummary() {
  try {
    const tenSessionStudents = await getTenSessionStudents();
    const twentyFiveSessionStudents = await getTwentyFiveSessionStudents();
    const completedStudents = await getCompletedStudents();
    const continuingStudents = await getContinuingStudents();
    
    const active = [...tenSessionStudents, ...twentyFiveSessionStudents].map(student => ({
      name: student.name,
      sessionsCompleted: student.sessionsCompleted,
      totalSessions: student.sessionDates.length,
      status: 'Active',
      deadline: student.deadline
    }));
    
    const completed = completedStudents.map(student => ({
      name: student.name,
      sessionsCompleted: student.totalSessionsCompleted,
      totalSessions: student.totalSessionsCompleted,
      status: 'Completed',
      deadline: 'Completed'
    }));

    const continuing = continuingStudents.map(student => ({
      name: student.name,
      sessionsCompleted: student.sessionsCompleted,
      totalSessions: student.sessionsCompleted + student.sessionsRemaining,
      status: 'Continuing',
      deadline: 'Ongoing'
    }));
    
    return [...active, ...completed, ...continuing];
  } catch (error) {
    console.error('Error getting student summary:', error);
    // Fallback to mock data
    return getMockAllStudentsSummary();
  }
}

// Mock data for fallback (only used if Google Sheets API fails)
function getMockTenSessionStudents(): TenSessionStudent[] {
  return [
    {
      name: "Alex Johnson",
      deadline: "2025-06-15",
      sessionsCompleted: 6,
      grade: "11th Grade",
      experience: "Some Python programming",
      goals: "Learn AI fundamentals and create a small project",
      sessionDates: [
        { sessionNumber: 1, date: "2025-03-01" },
        { sessionNumber: 2, date: "2025-03-08" },
        { sessionNumber: 3, date: "2025-03-15" },
        { sessionNumber: 4, date: "2025-03-22" },
        { sessionNumber: 5, date: "2025-03-29" },
        { sessionNumber: 6, date: "2025-04-05" },
        { sessionNumber: 7, date: "Not completed" },
        { sessionNumber: 8, date: "Not completed" },
        { sessionNumber: 9, date: "Not completed" },
        { sessionNumber: 10, date: "Not completed" }
      ]
    },
    {
      name: "Sofia Martinez",
      deadline: "2025-05-30",
      sessionsCompleted: 8,
      grade: "12th Grade",
      experience: "Advanced in Python, some ML knowledge",
      goals: "Build a neural network model for college application",
      sessionDates: [
        { sessionNumber: 1, date: "2025-02-15" },
        { sessionNumber: 2, date: "2025-02-22" },
        { sessionNumber: 3, date: "2025-03-01" },
        { sessionNumber: 4, date: "2025-03-08" },
        { sessionNumber: 5, date: "2025-03-15" },
        { sessionNumber: 6, date: "2025-03-22" },
        { sessionNumber: 7, date: "2025-03-29" },
        { sessionNumber: 8, date: "2025-04-05" },
        { sessionNumber: 9, date: "Not completed" },
        { sessionNumber: 10, date: "Not completed" }
      ]
    },
    {
      name: "Jamal Williams",
      deadline: "2025-07-01",
      sessionsCompleted: 3,
      grade: "10th Grade",
      experience: "Beginner programmer",
      goals: "Learn Python and basic AI concepts",
      sessionDates: [
        { sessionNumber: 1, date: "2025-04-01" },
        { sessionNumber: 2, date: "2025-04-08" },
        { sessionNumber: 3, date: "2025-04-15" },
        { sessionNumber: 4, date: "Not completed" },
        { sessionNumber: 5, date: "Not completed" },
        { sessionNumber: 6, date: "Not completed" },
        { sessionNumber: 7, date: "Not completed" },
        { sessionNumber: 8, date: "Not completed" },
        { sessionNumber: 9, date: "Not completed" },
        { sessionNumber: 10, date: "Not completed" }
      ]
    }
  ];
}

function getMockTwentyFiveSessionStudents(): TwentyFiveSessionStudent[] {
  return [
    {
      name: "Emily Chen",
      deadline: "2025-08-30",
      sessionsCompleted: 12,
      grade: "11th Grade",
      experience: "Intermediate Python, basic ML",
      goals: "Build a complete AI project for science fair",
      sessionDates: Array.from({ length: 25 }, (_, i) => ({
        sessionNumber: i + 1,
        date: i < 12 ? new Date(2025, 2 + Math.floor(i/4), 1 + (i % 4) * 7).toISOString().split('T')[0] : "Not completed"
      }))
    },
    {
      name: "Michael Rodriguez",
      deadline: "2025-09-15",
      sessionsCompleted: 18,
      grade: "12th Grade",
      experience: "Advanced programmer, some AI experience",
      goals: "Create portfolio of AI projects for college applications",
      sessionDates: Array.from({ length: 25 }, (_, i) => ({
        sessionNumber: i + 1,
        date: i < 18 ? new Date(2025, 1 + Math.floor(i/4), 1 + (i % 4) * 7).toISOString().split('T')[0] : "Not completed"
      }))
    }
  ];
}

function getMockCompletedStudents(): CompletedStudent[] {
  return [
    {
      name: "Noah Kim",
      grade: "12th Grade",
      experience: "Intermediate Python",
      goals: "Learn AI fundamentals",
      totalSessionsCompleted: 10
    },
    {
      name: "Olivia Johnson",
      grade: "11th Grade",
      experience: "Advanced in coding competitions",
      goals: "Build AI research portfolio",
      totalSessionsCompleted: 25
    },
    {
      name: "William Patel",
      grade: "10th Grade",
      experience: "Self-taught programmer",
      goals: "Prepare for STEM competitions",
      totalSessionsCompleted: 10
    }
  ];
}

function getMockContinuingStudents(): ContinuingStudent[] {
  return [
    {
      name: "Isabella Garcia",
      grade: "11th Grade",
      experience: "Some Python, new to AI",
      goals: "Understanding AI ethics and implementation",
      sessionsCompleted: 10,
      sessionsRemaining: 15,
      sessionsContinuingFor: 25,
      sessionsHeld: 10
    },
    {
      name: "Ethan Taylor",
      grade: "12th Grade",
      experience: "Advanced in multiple languages",
      goals: "Build a computer vision project",
      sessionsCompleted: 15,
      sessionsRemaining: 10,
      sessionsContinuingFor: 25,
      sessionsHeld: 15
    }
  ];
}

function getMockAllStudentsSummary() {
  const mockTenSessionStudents = getMockTenSessionStudents();
  const mockTwentyFiveSessionStudents = getMockTwentyFiveSessionStudents();
  const mockCompletedStudents = getMockCompletedStudents();
  const mockContinuingStudents = getMockContinuingStudents();
  
  const active = [...mockTenSessionStudents, ...mockTwentyFiveSessionStudents].map(student => ({
    name: student.name,
    sessionsCompleted: student.sessionsCompleted,
    totalSessions: student.sessionDates.length,
    status: 'Active',
    deadline: student.deadline
  }));
  
  const completed = mockCompletedStudents.map(student => ({
    name: student.name,
    sessionsCompleted: student.totalSessionsCompleted,
    totalSessions: student.totalSessionsCompleted,
    status: 'Completed',
    deadline: 'Completed'
  }));

  const continuing = mockContinuingStudents.map(student => ({
    name: student.name,
    sessionsCompleted: student.sessionsCompleted,
    totalSessions: student.sessionsCompleted + student.sessionsRemaining,
    status: 'Continuing',
    deadline: 'Ongoing'
  }));
  
  return [...active, ...completed, ...continuing];
}
