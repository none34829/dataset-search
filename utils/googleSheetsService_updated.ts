"use server";

import { google } from 'googleapis';
import { fetchStudentAttendanceData } from './googleSheetsService';

// Types for student data
export interface BaseStudentData {
  name: string;
  mentorName: string;
  meetingLink: string;
  grade: string;
  experience: string;
  goals: string;
  deadline: string;
  sessionsCompleted: number;
  totalSessions: number;
  email?: string;
}

export interface CompletedStudent extends BaseStudentData {
  totalSessionsCompleted: number;
}

export interface ContinuingStudent extends BaseStudentData {
  sessionsRemaining: number;
}

// Get students who have completed their program, optionally filtered by mentor name
export async function getCompletedStudents(forceRefresh = false, mentorName?: string): Promise<CompletedStudent[]> {
  const allStudents = await fetchStudentAttendanceData(forceRefresh);
  console.log('Total students loaded from sheet:', allStudents?.length || 0);
  
  if (!allStudents || allStudents.length === 0) {
    console.log('No students found in the sheet');
    return [];
  }
  
  console.log('\n--- Filtering completed students ---');
  let filteredStudents = allStudents.filter((student: any) => 
    student.sessionsCompleted >= student.totalSessions
  );
  
  console.log(`\nFound ${filteredStudents.length} completed students before mentor filter`);
  
  // Log all unique mentor names for debugging
  const allMentorNames = [...new Set(allStudents.map((s: any) => s.mentorName).filter(Boolean))];
  console.log('All mentor names in sheet:', allMentorNames);
  
  // If a mentor name is provided, filter to only show that mentor's students
  if (mentorName) {
    // Use the same normalizeName function as in getTenSessionStudents
    const normalizeName = (name: string) => {
      return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .split(' ')
        .sort()
        .join(' ');
    };
    
    const normalizedMentorName = normalizeName(mentorName);
    
    filteredStudents = filteredStudents.filter((student: any) => {
      if (!student.mentorName) return false;
      
      try {
        // Normalize the stored mentor name
        const storedMentorName = normalizeName(String(student.mentorName));
        
        // Only match if the normalized names match exactly
        return storedMentorName === normalizedMentorName;
      } catch (error) {
        console.error(`Error processing mentor name for student "${student.name}":`, error);
        return false;
      }
    });
  }
  
  return filteredStudents.map((student: any) => ({
    ...student,
    totalSessionsCompleted: student.sessionsCompleted
  }));
}

// Get students who are continuing beyond their initial program, optionally filtered by mentor name
export async function getContinuingStudents(forceRefresh = false, mentorName?: string): Promise<ContinuingStudent[]> {
  const allStudents = await fetchStudentAttendanceData(forceRefresh);
  if (!allStudents) return [];
  
  let filteredStudents = allStudents.filter((student: any) => 
    student.sessionsCompleted >= student.totalSessions && student.sessionsCompleted < 25
  );
  
  // If a mentor name is provided, filter to only show that mentor's students
  if (mentorName) {
    // Use the same normalizeName function as in getTenSessionStudents
    const normalizeName = (name: string) => {
      return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .split(' ')
        .sort()
        .join(' ');
    };
    
    const normalizedMentorName = normalizeName(mentorName);
    
    filteredStudents = filteredStudents.filter((student: any) => {
      if (!student.mentorName) return false;
      
      try {
        // Normalize the stored mentor name
        const storedMentorName = normalizeName(String(student.mentorName));
        
        // Only match if the normalized names match exactly
        return storedMentorName === normalizedMentorName;
      } catch (error) {
        console.error(`Error processing mentor name for student "${student.name}":`, error);
        return false;
      }
    });
  }
  
  return filteredStudents.map((student: any) => ({
    ...student,
    sessionsRemaining: 25 - student.sessionsCompleted
  }));
}
