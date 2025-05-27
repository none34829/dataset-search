"use server";

import { google } from 'googleapis';

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
  preProgramInfo?: string;
  preAssessmentInfo?: string;
}

export interface TenSessionStudent extends BaseStudentData {
  sessionDates: { date: string; completed: boolean }[];
}

export interface TwentyFiveSessionStudent extends BaseStudentData {
  sessionDates: { date: string; completed: boolean }[];
}

export interface CompletedStudent extends BaseStudentData {
  totalSessionsCompleted: number;
}

export interface ContinuingStudent extends BaseStudentData {
  sessionsRemaining: number;
}

// Constants
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1fkXcAsoZUIpu56XjyKQv2S5OTboYhVhwttGQCCadiFo';
const STUDENTS_SHEET_NAME = process.env.GOOGLE_SHEETS_STUDENTS_TAB || '10-Session Student Info';
const SHEET_NAME = process.env.GOOGLE_SHEETS_TAB || 'Student Passkeys';
const MENTOR_SHEET_NAME = process.env.GOOGLE_SHEETS_MENTOR_TAB || 'Mentor Passkeys';
let cachedStudents: { email: string; password: string }[] = [];
let cachedMentors: { name: string; email: string; passkey: string }[] = [];
let cachedAttendanceData: any = null;
let lastFetchTime = 0;
let lastMentorFetchTime = 0;
let lastAttendanceFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Initialize the Google Sheets API
async function getAuthClient() {
  try {
    const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS 
      ? JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS)
      : {};
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    return auth.getClient();
  } catch (error) {
    console.error('Error initializing Google Sheets auth:', error);
    throw error;
  }
}

// Fetch student data from Google Sheets
export async function fetchStudentsFromSheet(): Promise<{ email: string; password: string }[]> {
  const now = Date.now();
  
  // Return cached data if it's fresh
  if (now - lastFetchTime < CACHE_DURATION && cachedStudents.length > 0) {
    return cachedStudents;
  }
  
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    
    // Properly format sheet name to handle spaces by enclosing in single quotes if needed
    const formattedSheetName = SHEET_NAME.includes(' ') ? `'${SHEET_NAME}'` : SHEET_NAME;
    
    console.log(`Attempting to fetch from sheet: ${formattedSheetName}`);
    console.log(`Full range string: ${formattedSheetName}!A:B`);
    console.log(`Using spreadsheet ID: ${SPREADSHEET_ID}`);
    
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${formattedSheetName}!A:B`, // Assuming column A is email and B is password
      });
      
      console.log('API Response received');
      const rows = response.data.values || [];
      console.log(`Rows fetched: ${rows.length}`);
      console.log('First few rows (sanitized for security):', rows.slice(0, 3).map((row: string[]) => 
        row.length > 0 ? { email: row[0] ? row[0].substring(0, 3) + '...' : 'empty', hasPassword: !!row[1] } : 'empty row'
      ));
      
      // Skip header row and map data
      const students = rows.slice(1).map((row: string[]) => ({
        email: row[0],
        password: row[1]
      }));
      
      console.log(`Processed ${students.length} student records`);
      
      // Update cache
      cachedStudents = students;
      lastFetchTime = now;
      
      return students;
    } catch (apiError) {
      console.error('Google Sheets API specific error:', apiError);
      throw apiError; // Re-throw to be caught by the outer catch
    }
  
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    // Return cached data if available, otherwise empty array
    return cachedStudents.length > 0 ? cachedStudents : [];
  }
}

// Function to get students (with fallback to mockData if API fails)
export async function getStudents(forceRefresh = false): Promise<{ email: string; password: string }[]> {
  try {
    // If forceRefresh is true, reset the lastFetchTime to force a new fetch
    if (forceRefresh) {
      lastFetchTime = 0;
    }
    return await fetchStudentsFromSheet();
  } catch (error) {
    console.error('Failed to fetch students from Google Sheets, using mock data:', error);
    // Fallback mock data
    return [
      { email: "student@example.com", password: "studentPass" },
      { email: "ayush.chauhan@gmail.com", password: "Reynasimp@69" },
      { email: "ayushChauhan020305@gmail.com", password: "Reynasimp@69" },
    ];
  }
}

/**
 * Authenticates a student with the provided credentials
 * First tries with cached data, then forces a refresh if authentication fails
 * This ensures newly added records are found without requiring multiple login attempts
 */
export async function authenticateStudent(email: string, password: string): Promise<boolean> {
  // First try with potentially cached data
  console.log(`Attempting authentication for ${email}`);
  
  let students = await getStudents();
  
  // Check if credentials match in current cache
  let authenticated = students.some(student => 
    student.email === email && student.password === password
  );
  
  // If authentication failed, try again with forced refresh
  if (!authenticated) {
    console.log(`Authentication failed with cached data. Forcing refresh for ${email}`);
    students = await getStudents(true); // Force refresh
    
    // Check if credentials match after refresh
    authenticated = students.some(student => 
      student.email === email && student.password === password
    );
    
    if (authenticated) {
      console.log(`Authentication succeeded after cache refresh for ${email}`);
    } else {
      console.log(`Authentication failed after cache refresh for ${email}. Invalid credentials.`);
    }
  } else {
    console.log(`Authentication succeeded with cached data for ${email}`);
  }
  
  return authenticated;
}

// Fetch student attendance data from Google Sheets
export async function fetchStudentAttendanceData(forceRefresh = false): Promise<any> {
  console.log('\n=== fetchStudentAttendanceData ===');
  console.log('forceRefresh:', forceRefresh);
  
  const now = Date.now();
  
  // Return cached data if it's fresh and not forced to refresh
  if (!forceRefresh && now - lastAttendanceFetchTime < CACHE_DURATION && cachedAttendanceData) {
    console.log('Using cached attendance data (last fetched', (now - lastAttendanceFetchTime) / 1000, 'seconds ago)');
    return cachedAttendanceData;
  }
  
  console.log('Fetching fresh attendance data from Google Sheets...');
  
  try {
    console.log('Initializing Google Sheets API client...');
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    
    // Properly format sheet name
    const formattedSheetName = STUDENTS_SHEET_NAME.includes(' ') ? `'${STUDENTS_SHEET_NAME}'` : STUDENTS_SHEET_NAME;
    
    console.log('\n--- Google Sheets Request ---');
    console.log('Spreadsheet ID:', SPREADSHEET_ID);
    console.log('Sheet name:', STUDENTS_SHEET_NAME);
    console.log('Formatted range:', `${formattedSheetName}!A:AK`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${formattedSheetName}!A:AK`, // Adjust range to include all necessary columns
    });
    
    const rows = response.data.values || [];
    console.log('\n--- Data Loaded ---');
    console.log(`Found ${rows.length} rows in the sheet (including header)`);
    
    if (rows.length <= 1) { // <= 1 because we expect at least a header row and one data row
      console.error('No data rows found in the student attendance sheet');
      return cachedAttendanceData || [];
    }
    
    // Get header row for column mapping
    const headers = rows[0];
    console.log('\n--- Sheet Headers ---');
    console.log(headers.map((header: string, index: number) => `${index}: ${header}`).join('\n'));
    
    // Create a map of column names to indices
    const columnMap: {[key: string]: number} = {};
    console.log('\n--- Column Mapping ---');
    headers.forEach((header: string, index: number) => {
      if (header) {
        const trimmedHeader = header.trim();
        const normalizedHeader = trimmedHeader.toLowerCase().replace(/\s+/g, '');
        // Store both the exact header and a normalized version (lowercase, no spaces)
        columnMap[trimmedHeader] = index;
        columnMap[normalizedHeader] = index;
        console.log(`Mapped column "${trimmedHeader}" (normalized: "${normalizedHeader}") to index ${index}`);
      }
    });
    
    // Helper function to get a value using multiple possible column names
    const getColumnValue = (row: string[], possibleNames: string[]): string => {
      console.log(`\nLooking for column: ${JSON.stringify(possibleNames)}`);
      
      for (const name of possibleNames) {
        const index = columnMap[name];
        if (index !== undefined && index < row.length) {
          const value = row[index];
          if (value !== undefined && value !== '') {
            console.log(`✅ Found value for "${name}" (index ${index}): "${value}"`);
            return value;
          } else {
            console.log(`ℹ️ Empty value for "${name}" (index ${index})`);
          }
        } else {
          console.log(`❌ Column "${name}" not found or out of bounds (index: ${index}, row length: ${row.length})`);
        }
      }
      
      console.log(`⚠️ No value found for any of these columns: ${JSON.stringify(possibleNames)}`);
      return '';  
    };
    
    console.log('\n--- Processing Data Rows ---');
    console.log(`Found ${rows.length - 1} data rows (excluding header)`);
    const processedData: any[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip empty rows
      if (row.length === 0 || row.every((cell: string) => !cell || cell.trim() === '')) {
        console.log(`Skipping empty row ${i}`);
        continue;
      }
      
      console.log(`\n--- Processing Row ${i} ---`);
      console.log('Raw row data:', row);
      
      // Get all possible column values for debugging
      const mentorName = getColumnValue(row, ['Instructor Name', 'instructorname', 'Mentor', 'mentor', 'Teacher', 'Instructor']);
      const studentName = getColumnValue(row, ['Student Name', 'studentname', 'Name', 'name', 'Student']);
      const meetingLink = getColumnValue(row, ['Meeting Link', 'meetinglink', 'Link', 'link', 'Zoom Link']);
      const email = getColumnValue(row, ['Student Email', 'studentemail', 'Email', 'email']);
      const grade = getColumnValue(row, ['Grade', 'grade', 'Student Grade']);
      const experience = getColumnValue(row, ['Experience', 'experience', 'Programming Experience']);
      const goals = getColumnValue(row, ['Goals', 'goals', 'Learning Goals']);
      const deadline = getColumnValue(row, ['Deadline', 'deadline', 'Due Date', 'duedate']);
      const totalSessions = parseInt(getColumnValue(row, ['# Sessions', 'sessions', 'Total Sessions', 'Number of Sessions', 'Session Count']) || '10', 10);
      
      // Get columns J, K, L and combine them for Pre-Program Information
      const preProgramJ = row[9] || ''; // Column J (0-indexed, so 9)
      const preProgramK = row[10] || ''; // Column K
      const preProgramL = row[11] || ''; // Column L
      
      // Format pre-program information with line breaks before dash-prefixed content
      let preProgramInfo = '';
      [preProgramJ, preProgramK, preProgramL].filter(Boolean).forEach((item, index) => {
        // If the item starts with a dash, add a newline before it
        if (item.trim().startsWith('-')) {
          preProgramInfo += (index === 0 ? '' : '\n\n') + item;
        } else {
          preProgramInfo += (index === 0 ? '' : ' - ') + item;
        }
      });
      
      // Get columns M, N, O and combine them for Pre-Program Assessment
      const preAssessmentM = row[12] || ''; // Column M
      const preAssessmentN = row[13] || ''; // Column N
      const preAssessmentO = row[14] || ''; // Column O
      
      // Format pre-assessment information with line breaks before dash-prefixed content
      let preAssessmentInfo = '';
      [preAssessmentM, preAssessmentN, preAssessmentO].filter(Boolean).forEach((item, index) => {
        // If the item starts with a dash, add a newline before it
        if (item.trim().startsWith('-')) {
          preAssessmentInfo += (index === 0 ? '' : '\n\n') + item;
        } else {
          preAssessmentInfo += (index === 0 ? '' : ' - ') + item;
        }
      });
      
      console.log('Mapped values:', {
        mentorName,
        studentName,
        email,
        totalSessions
      });
      
      // Create student object with mapped values
      const student: any = {
        mentorName,
        name: studentName,
        meetingLink,
        email,
        grade,
        experience,
        goals,
        deadline,
        totalSessions,
        sessionsCompleted: 0,
        sessionDates: [],
        preProgramInfo,
        preAssessmentInfo
      };
      
      console.log('Created student object:', {
        name: studentName,
        mentorName,
        email,
        totalSessions,
        rowNumber: i
      });
      
      // Count completed sessions and gather session dates
      const sessionDates = [];
      // Check for session dates in columns 1-10
      for (let j = 1; j <= 10; j++) {
        // Try multiple possible column names for each session
        const possibleColumnNames = [
          j.toString(),
          `Session ${j}`,
          `session${j}`,
          `Session${j}`,
          `s${j}`,
          `S${j}`
        ];
        
        let dateValue = '';
        for (const colName of possibleColumnNames) {
          if (columnMap[colName] !== undefined && row[columnMap[colName]]) {
            dateValue = row[columnMap[colName]];
            break;
          }
        }
        
        const isCompleted = dateValue && dateValue.trim() !== '';
        
        if (isCompleted) {
          student.sessionsCompleted++;
        }
        
        sessionDates.push({
          date: isCompleted ? dateValue : 'Not completed',
          completed: isCompleted
        });
      }
      
      student.sessionDates = sessionDates;
      
      console.log(`Processed student: ${student.name} (${student.email})`);
      console.log(`- Mentor: ${student.mentorName}`);
      console.log(`- Sessions: ${student.sessionsCompleted}/${student.totalSessions}`);
      
      processedData.push(student);
    }
    
    console.log(`\n--- Processing Complete ---`);
    console.log(`Processed ${processedData.length} students`);
    
    // Cache the data
    cachedAttendanceData = processedData.filter(Boolean); // Remove any null entries
    lastAttendanceFetchTime = now;
    
    return processedData;
  } catch (error) {
    console.error('Error fetching student attendance data:', error);
    throw error;
  }
}

// Get the 10-session students, optionally filtered by mentor name
export async function getTenSessionStudents(forceRefresh = false, mentorName?: string): Promise<TenSessionStudent[]> {
  console.log('\n=== getTenSessionStudents ===');
  console.log('Mentor name provided:', mentorName || 'None');
  console.log('Force refresh:', forceRefresh);
  
  const allStudents = await fetchStudentAttendanceData(forceRefresh);
  console.log('Total students loaded from sheet:', allStudents?.length || 0);
  
  if (!allStudents || allStudents.length === 0) {
    console.log('No students found in the sheet');
    return [];
  }
  
  // Debug: Log the first few students to verify data structure
  console.log('\n--- Sample Students (first 3) ---');
  allStudents.slice(0, 3).forEach((student: any, index: number) => {
    console.log(`${index + 1}. ${student.name} | Mentor: ${student.mentorName} | ` +
                `Sessions: ${student.sessionsCompleted}/${student.totalSessions} | ` +
                `Type: ${typeof student.totalSessions}`);
    console.log('   Raw student object:', JSON.stringify(student, null, 2));
  });
  
  console.log('\n--- Filtering 10-session students ---');
  
  // Include all students from the 10-session sheet
  const allTenSessionStudents = allStudents.filter((student: any) => {
    // Only include students that have some session data
    return student.sessionDates && Array.isArray(student.sessionDates);
  });
  
  console.log(`\n--- All 10-session students (${allTenSessionStudents.length}) ---`);
  allTenSessionStudents.forEach((student: any, index: number) => {
    console.log(`${index + 1}. ${student.name} | ` +
                `Mentor: ${student.mentorName} | ` +
                `Sessions: ${student.sessionsCompleted}/${student.totalSessions} | ` +
                `Type: ${typeof student.totalSessions} | ` +
                `Completed: ${student.sessionsCompleted >= student.totalSessions ? 'Yes' : 'No'}`);
  });
  
  // Use all students from the 10-session sheet without filtering by completion status
  let filteredStudents = [...allTenSessionStudents];
  
  console.log(`\n--- All 10-session students (${filteredStudents.length}) ---`);
  filteredStudents.slice(0, 10).forEach((student: any, index: number) => {
    console.log(`${index + 1}. ${student.name} | ` +
                `Mentor: ${student.mentorName} | ` +
                `Sessions: ${student.sessionsCompleted}/${student.totalSessions || 'N/A'}`);
  });
  if (filteredStudents.length > 10) {
    console.log(`... and ${filteredStudents.length - 10} more`);
  }
  
  // If a mentor name is provided, filter to only show that mentor's students
  if (mentorName) {
    // Normalize the mentor name for comparison (trim, lowercase, remove extra spaces, and sort name parts)
    const normalizeName = (name: string) => {
      return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .split(' ')
        .sort() // Sort name parts alphabetically for comparison
        .join(' ');
    };
    
    const normalizedMentorName = normalizeName(mentorName);
    console.log('\n--- Filtering by mentor ---');
    console.log('Searching for mentor name:', `"${mentorName}"`);
    console.log('Normalized search term:', `"${normalizedMentorName}"`);
    
    const originalCount = filteredStudents.length;
    
    filteredStudents = filteredStudents.filter((student: any) => {
      if (!student.mentorName) {
        console.log(`❌ Student "${student.name}" has no mentor name`);
        return false;
      }
      
      try {
        // Normalize the stored mentor name
        const storedMentorName = normalizeName(String(student.mentorName));
        
        // Log the comparison for debugging
        console.log(`\nComparing mentor names for student "${student.name}":`);
        console.log(`- Stored: "${storedMentorName}"`);
        console.log(`- Search: "${normalizedMentorName}"`);
        
        // Only match if the normalized names match exactly
        const isMatch = storedMentorName === normalizedMentorName;
        
        if (isMatch) {
          console.log(`✅ MATCHED: Student "${student.name}" | ` +
                     `Mentor: "${student.mentorName}" (normalized: "${storedMentorName}")`);
        } else {
          console.log(`❌ NO MATCH: Student "${student.name}" | ` +
                     `Mentor: "${student.mentorName}" (normalized: "${storedMentorName}")`);
        }
        
        return isMatch;
      } catch (error) {
        console.error(`Error processing mentor name for student "${student.name}":`, error);
        return false;
      }
    });
    
    console.log(`Filtered from ${originalCount} to ${filteredStudents.length} students after mentor filter`);
  }
  
  // Ensure we only return the first 10 session dates
  return filteredStudents.map((student: any) => ({
    ...student,
    sessionDates: student.sessionDates.slice(0, 10) // Only keep the first 10 sessions
  }));
}

// Get the 25-session students, optionally filtered by mentor name
export async function getTwentyFiveSessionStudents(forceRefresh = false, mentorName?: string): Promise<TwentyFiveSessionStudent[]> {
  console.log('\n=== getTwentyFiveSessionStudents ===');
  console.log('Mentor name provided:', mentorName || 'None');
  
  const allStudents = await fetchStudentAttendanceData(forceRefresh);
  console.log('Total students loaded from sheet:', allStudents?.length || 0);
  
  if (!allStudents || allStudents.length === 0) {
    console.log('No students found in the sheet');
    return [];
  }
  
  console.log('\n--- Filtering 25-session students ---');
  
  // First, find all students who have exactly 25 session dates defined
  let filteredStudents = allStudents.filter((student: any) => {
    if (!student.sessionDates || !Array.isArray(student.sessionDates)) return false;
    
    // Count the number of sessions that have a date (not empty or 'Not completed')
    const validSessionCount = student.sessionDates.filter((session: any) => {
      return session && session.date && session.date !== 'Not completed' && session.date.trim() !== '';
    }).length;
    
    const isMatch = validSessionCount === 25;
    
    if (isMatch) {
      console.log(`✅ 25-session student: "${student.name}" | ` + 
                 `Mentor: "${student.mentorName}" | ` +
                 `Sessions: ${student.sessionsCompleted}/${validSessionCount}`);
    }
    
    return isMatch;
  });
  
  console.log(`\nFound ${filteredStudents.length} 25-session students before mentor filter`);
  
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
    console.log('\n--- Filtering by mentor ---');
    console.log('Searching for mentor name:', `"${mentorName}"`);
    console.log('Normalized search term:', `"${normalizedMentorName}"`);
    
    filteredStudents = filteredStudents.filter((student: any) => {
      if (!student.mentorName) {
        console.log(`❌ Student "${student.name}" has no mentor name`);
        return false;
      }
      
      try {
        // Normalize the stored mentor name
        const storedMentorName = normalizeName(String(student.mentorName));
        
        // Only match if the normalized names match exactly
        const isMatch = storedMentorName === normalizedMentorName;
        
        if (isMatch) {
          console.log(`✅ MATCHED: Student "${student.name}" | ` +
                     `Mentor: "${student.mentorName}" (normalized: "${storedMentorName}")`);
        } else {
          console.log(`❌ NO MATCH: Student "${student.name}" | ` +
                     `Mentor: "${student.mentorName}" (normalized: "${storedMentorName}")`);
        }
        
        return isMatch;
      } catch (error) {
        console.error(`Error processing mentor name for student "${student.name}":`, error);
        return false;
      }
    });
  }
  
  return filteredStudents.map((student: any) => ({
    ...student,
    sessionDates: student.sessionDates.slice(0, 25) // Only keep the first 25 sessions
  }));
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