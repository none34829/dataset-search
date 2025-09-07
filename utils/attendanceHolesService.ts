import { getTenSessionStudents, getTwentyFiveSessionStudents } from './googleSheetsService';

export interface AttendanceHole {
  sessionNumber: number;
  dateRange: {
    min: Date;
    max: Date;
  };
}

export interface AttendanceHolesResult {
  hasHoles: boolean;
  holes: AttendanceHole[];
  nextSessionNumber: number;
  totalSessions: number;
}

/**
 * Detects attendance holes for a specific student
 * A hole is defined as a missing session between completed sessions
 */
export async function detectAttendanceHoles(
  mentorName: string, 
  studentName: string, 
  studentType: '10' | '25'
): Promise<AttendanceHolesResult> {
  try {
    // Get student data based on type
    const students = studentType === '10' 
      ? await getTenSessionStudents(false, mentorName)
      : await getTwentyFiveSessionStudents(false, mentorName);
    
    // Find the specific student
    const student = students.find(s => 
      s.name.toLowerCase().trim() === studentName.toLowerCase().trim()
    );
    
    if (!student) {
      return {
        hasHoles: false,
        holes: [],
        nextSessionNumber: 1,
        totalSessions: studentType === '10' ? 10 : 25
      };
    }
    
    const sessionDates = student.sessionDates || [];
    const totalSessions = studentType === '10' ? 10 : 25;
    const holes: AttendanceHole[] = [];
    
    // Find completed sessions and their dates
    const completedSessions: { sessionNumber: number; date: Date }[] = [];
    
    for (let i = 0; i < Math.min(sessionDates.length, totalSessions); i++) {
      const sessionData = sessionDates[i];
      if (sessionData.completed && sessionData.date && sessionData.date !== 'Not completed') {
        try {
          const date = new Date(sessionData.date);
          if (!isNaN(date.getTime())) {
            completedSessions.push({
              sessionNumber: i + 1,
              date: date
            });
          }
        } catch (error) {
          console.warn(`Invalid date for session ${i + 1}: ${sessionData.date}`);
        }
      }
    }
    
    // Sort completed sessions by session number
    completedSessions.sort((a, b) => a.sessionNumber - b.sessionNumber);
    
    // Find holes between completed sessions
    for (let i = 0; i < completedSessions.length - 1; i++) {
      const currentSession = completedSessions[i];
      const nextSession = completedSessions[i + 1];
      
      // Check for gaps between consecutive session numbers
      const gap = nextSession.sessionNumber - currentSession.sessionNumber;
      if (gap > 1) {
        // There's a hole - add all missing sessions in the gap
        for (let missingSession = currentSession.sessionNumber + 1; missingSession < nextSession.sessionNumber; missingSession++) {
          holes.push({
            sessionNumber: missingSession,
            dateRange: {
              min: currentSession.date,
              max: nextSession.date
            }
          });
        }
      }
    }
    
    // Check for holes at the beginning (if first completed session is not session 1)
    if (completedSessions.length > 0 && completedSessions[0].sessionNumber > 1) {
      for (let missingSession = 1; missingSession < completedSessions[0].sessionNumber; missingSession++) {
        holes.push({
          sessionNumber: missingSession,
          dateRange: {
            min: new Date('1900-01-01'), // Use a reasonable lower bound instead of epoch 0
            max: completedSessions[0].date
          }
        });
      }
    }
    
    // Determine next session number
    let nextSessionNumber = 1;
    if (completedSessions.length > 0) {
      nextSessionNumber = completedSessions[completedSessions.length - 1].sessionNumber + 1;
    }
    
    return {
      hasHoles: holes.length > 0,
      holes: holes.sort((a, b) => a.sessionNumber - b.sessionNumber),
      nextSessionNumber,
      totalSessions
    };
    
  } catch (error) {
    console.error('Error detecting attendance holes:', error);
    return {
      hasHoles: false,
      holes: [],
      nextSessionNumber: 1,
      totalSessions: studentType === '10' ? 10 : 25
    };
  }
}

/**
 * Validates that a date for a missing session falls within the acceptable range
 */
export function validateHoleSessionDate(
  sessionNumber: number,
  date: Date,
  holes: AttendanceHole[]
): { isValid: boolean; error?: string } {
  const hole = holes.find(h => h.sessionNumber === sessionNumber);
  if (!hole) {
    return { isValid: false, error: 'Session not found in holes list' };
  }
  
  // Check if date is within the acceptable range
  if (hole.dateRange.min.getTime() > 0 && date < hole.dateRange.min) {
    return { 
      isValid: false, 
      error: `Date must be after ${hole.dateRange.min.toLocaleDateString()}` 
    };
  }
  
  if (date > hole.dateRange.max) {
    return { 
      isValid: false, 
      error: `Date must be before ${hole.dateRange.max.toLocaleDateString()}` 
    };
  }
  
  return { isValid: true };
}