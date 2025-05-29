"use server";

import type {
  TenSessionStudent,
  TwentyFiveSessionStudent,
  CompletedStudent,
  ContinuingStudent
} from '@/utils/googleSheetsService';

import {
  getTenSessionStudents as getSheetTenSessionStudents,
  getTwentyFiveSessionStudents as getSheetTwentyFiveSessionStudents,
  getCompletedStudents as getSheetCompletedStudents,
  getContinuingStudents as getSheetContinuingStudents
} from '@/utils/googleSheetsService';

// Server actions that can be called from client components
export async function fetchTenSessionStudents(forceRefresh = false, mentorName?: string) {
  console.log('\n[fetchTenSessionStudents] Called with:', { forceRefresh, mentorName });
  
  try {
    // If no mentorName is provided, try to get it from the session or context
    if (!mentorName) {
      console.log('[fetchTenSessionStudents] No mentor name provided, returning all students');
      const allStudents = await getSheetTenSessionStudents(forceRefresh);
      console.log(`[fetchTenSessionStudents] Found ${allStudents.length} students with no mentor filter`);
      return allStudents;
    }
    
    console.log(`[fetchTenSessionStudents] Filtering for mentor: "${mentorName}"`);
    const filteredStudents = await getSheetTenSessionStudents(forceRefresh, mentorName);
    console.log(`[fetchTenSessionStudents] Found ${filteredStudents.length} students for mentor "${mentorName}"`);
    
    if (filteredStudents.length > 0) {
      console.log('[fetchTenSessionStudents] Sample student mentor names:', 
        filteredStudents.slice(0, 3).map((s: any) => ({
          name: s.name,
          mentor: s.mentorName,
          sessions: `${s.sessionsCompleted}/${s.totalSessions}`
        }))
      );
    }
    
    return filteredStudents;
  } catch (error) {
    console.error('[fetchTenSessionStudents] Error:', error);
    throw error;
  }
}

export async function fetchTwentyFiveSessionStudents(forceRefresh = false, mentorName?: string) {
  console.log('\n[fetchTwentyFiveSessionStudents] Called with:', { forceRefresh, mentorName });
  
  try {
    if (!mentorName) {
      console.log('[fetchTwentyFiveSessionStudents] No mentor name provided, returning all students');
      const allStudents = await getSheetTwentyFiveSessionStudents(forceRefresh);
      console.log(`[fetchTwentyFiveSessionStudents] Found ${allStudents.length} students with no mentor filter`);
      return allStudents;
    }
    
    console.log(`[fetchTwentyFiveSessionStudents] Filtering for mentor: "${mentorName}"`);
    const filteredStudents = await getSheetTwentyFiveSessionStudents(forceRefresh, mentorName);
    console.log(`[fetchTwentyFiveSessionStudents] Found ${filteredStudents.length} students for mentor "${mentorName}"`);
    
    if (filteredStudents.length > 0) {
      console.log('[fetchTwentyFiveSessionStudents] Sample student mentor names:', 
        filteredStudents.slice(0, 3).map((s: any) => ({
          name: s.name,
          mentor: s.mentorName,
          sessions: `${s.sessionsCompleted}/${s.totalSessions}`
        }))
      );
    }
    
    return filteredStudents;
  } catch (error) {
    console.error('[fetchTwentyFiveSessionStudents] Error:', error);
    throw error;
  }
}

export async function fetchCompletedStudents(forceRefresh = false, mentorName?: string) {
  console.log('\n[fetchCompletedStudents] Called with:', { forceRefresh, mentorName });
  
  try {
    if (!mentorName) {
      console.log('[fetchCompletedStudents] No mentor name provided, returning all students');
      const allStudents = await getSheetCompletedStudents(forceRefresh);
      console.log(`[fetchCompletedStudents] Found ${allStudents.length} students with no mentor filter`);
      return allStudents;
    }
    
    console.log(`[fetchCompletedStudents] Filtering for mentor: "${mentorName}"`);
    const filteredStudents = await getSheetCompletedStudents(forceRefresh, mentorName);
    console.log(`[fetchCompletedStudents] Found ${filteredStudents.length} students for mentor "${mentorName}"`);
    
    if (filteredStudents.length > 0) {
      console.log('[fetchCompletedStudents] Sample student mentor names:', 
        filteredStudents.slice(0, 3).map((s: any) => ({
          name: s.name,
          mentor: s.mentorName,
          sessions: `${s.sessionsCompleted}/${s.totalSessions}`
        }))
      );
    }
    
    return filteredStudents;
  } catch (error) {
    console.error('[fetchCompletedStudents] Error:', error);
    throw error;
  }
}

export async function fetchContinuingStudents(forceRefresh = false, mentorName?: string) {
  console.log('\n[fetchContinuingStudents] Called with:', { forceRefresh, mentorName });
  
  try {
    if (!mentorName) {
      console.log('[fetchContinuingStudents] No mentor name provided, returning all students');
      const allStudents = await getSheetContinuingStudents(forceRefresh);
      console.log(`[fetchContinuingStudents] Found ${allStudents.length} students with no mentor filter`);
      return allStudents;
    }
    
    console.log(`[fetchContinuingStudents] Filtering for mentor: "${mentorName}"`);
    const filteredStudents = await getSheetContinuingStudents(forceRefresh, mentorName);
    console.log(`[fetchContinuingStudents] Found ${filteredStudents.length} students for mentor "${mentorName}"`);
    
    if (filteredStudents.length > 0) {
      console.log('[fetchContinuingStudents] Sample student mentor names:', 
        filteredStudents.slice(0, 3).map((s: any) => ({
          name: s.name,
          mentor: s.mentorName,
          sessions: `${s.sessionsCompleted}/${s.totalSessions}`
        }))
      );
    }
    
    return filteredStudents;
  } catch (error) {
    console.error('[fetchContinuingStudents] Error:', error);
    throw error;
  }
}
