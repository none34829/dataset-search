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
const STUDENTS_25_SHEET_NAME = process.env.GOOGLE_SHEETS_STUDENTS_TAB_25 || '25-Session Student Info';
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

// Fetch student attendance data from Google Sheets (10-session students)
export async function fetchStudentAttendanceData(forceRefresh = false, sheetName = STUDENTS_SHEET_NAME): Promise<any> {
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
      
      // Check if any pre-program info is available
      const hasPreProgramInfo = preProgramJ || preProgramK || preProgramL;
      
      // Format pre-program information with line breaks before dash-prefixed content
      let preProgramInfo = '';
      
      if (hasPreProgramInfo) {
        [preProgramJ, preProgramK, preProgramL].filter(Boolean).forEach((item, index) => {
          // If the item starts with a dash, add a newline before it
          if (item.trim().startsWith('-')) {
            preProgramInfo += (index === 0 ? '' : '\n\n') + item;
          } else {
            preProgramInfo += (index === 0 ? '' : ' - ') + item;
          }
        });
      } else {
        // If no pre-program info is available, display a custom message with the student's name
        preProgramInfo = `Please encourage ${studentName} to fill out the <a href="https://inspiritai.co/1-1-Pre-Program" target="_blank" style="color: #0066cc; text-decoration: underline;">Pre-Program Survey</a>`;
      }
      
      // Get columns M, N, O and combine them for Pre-Program Assessment
      const preAssessmentM = row[12] || ''; // Column M
      const preAssessmentN = row[13] || ''; // Column N
      const preAssessmentO = row[14] || ''; // Column O
      
      // Check if any pre-assessment info is available
      const hasPreAssessmentInfo = preAssessmentM || preAssessmentN || preAssessmentO;
      
      // Format pre-assessment information with line breaks before dash-prefixed content
      let preAssessmentInfo = '';
      
      if (hasPreAssessmentInfo) {
        [preAssessmentM, preAssessmentN, preAssessmentO].filter(Boolean).forEach((item, index) => {
          // If the item starts with a dash, add a newline before it
          if (item.trim().startsWith('-')) {
            preAssessmentInfo += (index === 0 ? '' : '\n\n') + item;
          } else {
            preAssessmentInfo += (index === 0 ? '' : ' - ') + item;
          }
        });
      } else {
        // If no pre-assessment info is available, display a custom message with the student's name
        preAssessmentInfo = `Please encourage ${studentName} to fill out the <a href="https://inspiritai.co/1-1-Pre-Program" target="_blank" style="color: #0066cc; text-decoration: underline;">Pre-Program Survey</a>`;
      }
      
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

// Fetch 25-session student data from Google Sheets (separate function for 25-session students)
export async function fetch25SessionStudentData(forceRefresh = false): Promise<any> {
  console.log('\n=== fetch25SessionStudentData ===');
  console.log('forceRefresh:', forceRefresh);
  
  const now = Date.now();
  
  try {
    console.log('Initializing Google Sheets API client...');
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    
    // Properly format sheet name
    const formattedSheetName = STUDENTS_25_SHEET_NAME.includes(' ') ? `'${STUDENTS_25_SHEET_NAME}'` : STUDENTS_25_SHEET_NAME;
    
    console.log('\n--- Google Sheets Request (25-session sheet) ---');
    console.log('Spreadsheet ID:', SPREADSHEET_ID);
    console.log('Sheet name:', STUDENTS_25_SHEET_NAME);
    console.log('Formatted range:', `${formattedSheetName}!A:BZ`); // Extended range for 25 sessions
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${formattedSheetName}!A:BZ`, // Extended range for 25 sessions
    });
    
    const rows = response.data.values || [];
    console.log('\n--- 25-Session Data Loaded ---');
    console.log(`Found ${rows.length} rows in the 25-session sheet (including header)`);
    
    if (rows.length <= 1) { // <= 1 because we expect at least a header row and one data row
      console.error('No data rows found in the 25-session student sheet');
      return [];
    }
    
    // Get header row for column mapping
    const headers = rows[0];
    console.log('\n--- 25-Session Sheet Headers ---');
    console.log(headers.map((header: string, index: number) => `${index}: ${header}`).join('\n'));
    
    // Define column indices - be more flexible with potential header names
    // Log the actual headers to troubleshoot
    console.log('First few headers exactly as they appear:');
    for (let i = 0; i < Math.min(headers.length, 5); i++) {
      console.log(`Header ${i}: '${headers[i]}'`);
    }
    
    // Helper function to find a column by trying multiple possible header variations
    const findColumn = (possibleNames: string[]): number => {
      for (const name of possibleNames) {
        const idx = headers.findIndex((h: string) => 
          h && typeof h === 'string' && h.trim().toLowerCase() === name.toLowerCase());
        if (idx !== -1) {
          console.log(`Found match for '${name}' at index ${idx}: '${headers[idx]}'`);
          return idx;
        }
      }
      return -1;
    };
    
    // Adjust column mappings based on actual headers in the 25-session sheet
    const nameColIdx = findColumn(['Student Name', 'Student name', 'student name', 'Name', 'name']);
    // The first column in the sheet is 'Instructor Name' according to the logs
    const mentorColIdx = 0; // Directly use index 0 since we know this is the instructor column
    const meetingLinkColIdx = findColumn(['Meeting Link', 'meeting link', 'Meeting URL', 'Zoom Link']);
    const gradeColIdx = findColumn(['Grade', 'grade', 'Student Grade']);
    const experienceColIdx = findColumn(['Experience', 'experience', 'Coding Experience']);
    const goalsColIdx = findColumn(['Goals', 'goals', 'Learning Goals']);
    const deadlineColIdx = findColumn(['Deadline', 'deadline', 'Program Deadline']);
    // Sessions completed count will be calculated manually
    const sessionsCountColIdx = findColumn(['# Sessions', 'Number of Sessions', 'Sessions']);
    
    // For 25-session students, map the specific columns as requested
    // Pre-program info columns (j, k, l)
    const additionalGoalsIdx = 9;  // column J (index 9) - Additional Goals
    const requestedAreasIdx = 10; // column K (index 10) - Requested Areas of Support
    const projectTrackIdx = 11;   // column L (index 11) - Project Track
    
    // Pre-assessment columns (m, n, o)
    const assessmentScoreIdx = 12;      // column M (index 12) - Assessment Score
    const definitionPandasIdx = 13;     // column N (index 13) - Definition of Pandas DF
    const reasonTrainTestIdx = 14;      // column O (index 14) - Reason for Train/Test Split
    
    console.log('\n--- 25-Session Column Indices ---');
    console.log('Name column index:', nameColIdx);
    console.log('Mentor/Instructor column index:', mentorColIdx);
    console.log('Sessions count column index:', sessionsCountColIdx);
    
    // Find session date columns - for 25 sessions (simply numbered 1-25 in the sheet)
    const sessionColIndices = [];
    for (let i = 1; i <= 25; i++) {
      // Try to find columns that are just numbered 1-25 first
      const numberIdx = headers.findIndex((h: string) => h && h.trim() === String(i));
      
      if (numberIdx !== -1) {
        sessionColIndices.push(numberIdx);
      } else {
        // Fall back to other possible formats
        const possibleNames = [
          `Session ${i} Date`, 
          `session ${i} date`,
          `Session${i} Date`, 
          `Session ${i}`,
          `S${i} Date`
        ];
        
        const idx = findColumn(possibleNames);
        sessionColIndices.push(idx);
      }
    }
    
    console.log('Session date column indices:', sessionColIndices);
    
    // In this sheet, we don't have separate completion columns
    // We'll determine completion by checking if there's content in the session cells
    const sessionCompletionIndices = Array(25).fill(-1);
    
    // Map data to structured format
    const students = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[nameColIdx]) continue; // Skip rows with no name
      
      // Extract session dates and completion status
      const sessionDates = [];
      for (let s = 0; s < 25; s++) {
        const dateIdx = sessionColIndices[s];
        const completionIdx = sessionCompletionIndices[s];
        
        if (dateIdx !== -1 && row[dateIdx]) {
          // Get the date value from the cell
          let dateValue = row[dateIdx];
          
          // Validate that the date is properly formatted
          // If it's not a valid date, replace with a dash
          try {
            // Simple validation - if it doesn't parse as a date or results in NaN, it's invalid
            const testDate = new Date(dateValue);
            if (isNaN(testDate.getTime()) || dateValue === 'Invalid Date') {
              // Replace invalid date with a dash
              dateValue = '-';
              console.log(`Invalid date detected in session ${s+1} for student ${row[nameColIdx]}, replacing with dash`);
            }
          } catch (e) {
            // Any parsing error means invalid date
            dateValue = '-';
            console.log(`Exception parsing date in session ${s+1} for student ${row[nameColIdx]}, replacing with dash`);
          }
          
          // In this sheet, content in the session cell means the session is completed
          // (unless it was an invalid date that we replaced with a dash)
          const completionStatus = dateValue !== '-';
          
          sessionDates.push({
            date: dateValue,
            completed: completionStatus
          });
        } else {
          sessionDates.push({
            date: '-', // Use a dash instead of 'Not scheduled' or 'Invalid Date'
            completed: false
          });
        }
      }
      
      // Count how many sessions have been completed by checking for non-empty cells
      let completedCount = 0;
      for (let s = 0; s < sessionDates.length; s++) {
        if (sessionDates[s].completed) {
          completedCount++;
        }
      }
      
      // Check if pre-program info is available (at least one of the fields has content)
      const hasPreProgramInfo = row[additionalGoalsIdx] || row[requestedAreasIdx] || row[projectTrackIdx];
      
      // Format pre-program info by combining columns J, K, L with appropriate formatting
      // If no info is available, display a custom message with the student's name
      let preProgramInfo;
      
      if (hasPreProgramInfo) {
        preProgramInfo = [
          `- ${row[additionalGoalsIdx] || 'Not specified'}`,
          `- ${row[requestedAreasIdx] || 'Not specified'}`,
          `- ${row[projectTrackIdx] || 'Not specified'}`
        ].join('\n');
      } else {
        preProgramInfo = `Please encourage ${row[nameColIdx]} to fill out the <a href="https://inspiritai.co/1-1-Pre-Program" target="_blank" style="color: #0066cc; text-decoration: underline;">Pre-Program Survey</a>`;
      }
      
      // Check if pre-assessment info is available (at least one of the fields has content)
      const hasPreAssessmentInfo = row[assessmentScoreIdx] || row[definitionPandasIdx] || row[reasonTrainTestIdx];
      
      // Format pre-assessment info by combining columns M, N, O with appropriate formatting
      // If no info is available, display a custom message with the student's name
      let preAssessmentInfo;
      
      if (hasPreAssessmentInfo) {
        preAssessmentInfo = [
          `- ${row[assessmentScoreIdx] || 'Not specified'}`,
          `- ${row[definitionPandasIdx] || 'Not specified'}`,
          `- ${row[reasonTrainTestIdx] || 'Not specified'}`
        ].join('\n');
      } else {
        preAssessmentInfo = `Please encourage ${row[nameColIdx]} to fill out the <a href="https://inspiritai.co/1-1-Pre-Program" target="_blank" style="color: #0066cc; text-decoration: underline;">Pre-Program Survey</a>`;
      }
      
      const student = {
        name: row[nameColIdx],
        mentorName: row[mentorColIdx] || '',
        meetingLink: row[meetingLinkColIdx] || '',
        grade: row[gradeColIdx] || '',
        experience: row[experienceColIdx] || '',
        goals: row[goalsColIdx] || '',
        deadline: row[deadlineColIdx] || '',
        sessionsCompleted: completedCount,
        totalSessions: 25,
        preProgramInfo: preProgramInfo,
        preAssessmentInfo: preAssessmentInfo,
        sessionDates
      };
      
      students.push(student);
    }
    
    console.log(`\nSuccessfully processed ${students.length} 25-session students`);
    return students;
    
  } catch (error) {
    console.error('Error fetching 25-session data from Google Sheets:', error);
    return [];
  }
}

// Get the 25-session students, optionally filtered by mentor name
export async function getTwentyFiveSessionStudents(forceRefresh = false, mentorName?: string): Promise<TwentyFiveSessionStudent[]> {
  console.log('\n=== getTwentyFiveSessionStudents ===');
  console.log('Mentor name provided:', mentorName || 'None');
  
  // Use the dedicated function for 25-session students
  const students = await fetch25SessionStudentData(forceRefresh);
  console.log('Total 25-session students loaded from sheet:', students?.length || 0);
  
  if (!students || students.length === 0) {
    console.log('No 25-session students found in the sheet');
    return [];
  }
  
  // Sample the first few students to debug mentorName access
  console.log('\n--- Sample Students from 25-session sheet ---');
  for (let i = 0; i < Math.min(5, students.length); i++) {
    console.log(`Student ${i}: ${students[i].name}, Mentor: '${students[i].mentorName}'`);
  }
  
  // Filter by mentor name if provided
  let filteredStudents = students;
  
  if (mentorName) {
    // More permissive mentor name matching
    console.log('\n--- Filtering 25-session students by mentor ---');
    console.log('Searching for mentor name:', `"${mentorName}"`);
    
    // Use a more permissive approach for matching instructor names
    const simplifyName = (name: string) => {
      // Basic simplification: lowercase, trim spaces, and remove punctuation
      return name?.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '') || '';
    };
    
    const targetMentorSimplified = simplifyName(mentorName);
    console.log('Simplified search term:', `"${targetMentorSimplified}"`);
    
    // Try multiple matching approaches
    filteredStudents = students.filter((student: any) => {
      const instructorName = student.mentorName || '';
      
      if (!instructorName) {
        console.log(`❌ Student "${student.name}" has no mentor name`);
        return false;
      }
      
      // Try different matching strategies
      const exactMatch = instructorName === mentorName;
      const simplifiedMatch = simplifyName(instructorName) === targetMentorSimplified;
      const containsMatch = simplifyName(instructorName).includes(targetMentorSimplified) || 
                           targetMentorSimplified.includes(simplifyName(instructorName));
      
      const isMatch = exactMatch || simplifiedMatch || containsMatch;
      
      if (isMatch) {
        console.log(`✅ MATCHED: Student "${student.name}" | Mentor: "${instructorName}"`);
      } else {
        console.log(`❌ NO MATCH: Student "${student.name}" | Mentor: "${instructorName}"`);
      }
      
      return isMatch;
    });
  }
  
  console.log(`Found ${filteredStudents.length} 25-session students after filtering`);
  
  return filteredStudents;
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