// Mock data structures for student attendance tracking

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
}

// Mock data for each category
const tenSessionStudents: TenSessionStudent[] = [
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

const twentyFiveSessionStudents: TwentyFiveSessionStudent[] = [
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

const completedStudents: CompletedStudent[] = [
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

const continuingStudents: ContinuingStudent[] = [
  {
    name: "Isabella Garcia",
    grade: "11th Grade",
    experience: "Some Python, new to AI",
    goals: "Understanding AI ethics and implementation",
    sessionsCompleted: 10,
    sessionsRemaining: 15
  },
  {
    name: "Ethan Taylor",
    grade: "12th Grade",
    experience: "Advanced in multiple languages",
    goals: "Build a computer vision project",
    sessionsCompleted: 15,
    sessionsRemaining: 10
  }
];

// Service functions to retrieve data
export function getTenSessionStudents(): TenSessionStudent[] {
  return tenSessionStudents;
}

export function getTwentyFiveSessionStudents(): TwentyFiveSessionStudent[] {
  return twentyFiveSessionStudents;
}

export function getCompletedStudents(): CompletedStudent[] {
  return completedStudents;
}

export function getContinuingStudents(): ContinuingStudent[] {
  return continuingStudents;
}

// Helper function to get all students for the dashboard
export function getAllStudentsSummary() {
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
}
