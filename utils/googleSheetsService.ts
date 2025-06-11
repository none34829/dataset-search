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
  sessionsHeld?: number;
}

export interface ContinuingStudent extends BaseStudentData {
  sessionsRemaining: number;
}

// Constants
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1fkXcAsoZUIpu56XjyKQv2S5OTboYhVhwttGQCCadiFo';
const STUDENTS_SHEET_NAME = process.env.GOOGLE_SHEETS_STUDENTS_TAB || '10-Session Student Info';
const STUDENTS_25_SHEET_NAME = process.env.GOOGLE_SHEETS_STUDENTS_TAB_25 || '25-Session Student Info';
const COMPLETED_STUDENTS_SHEET_NAME = process.env.GOOGLE_SHEETS_COMPLETED_STUDENTS_TAB || 'Completed Students';
const CONTINUING_STUDENTS_SHEET_NAME = process.env.GOOGLE_SHEETS_CONTINUING_STUDENTS_TAB || 'Continuing Students';
const SHEET_NAME = process.env.GOOGLE_SHEETS_TAB || 'Student Passkeys';
const MENTOR_SHEET_NAME = process.env.GOOGLE_SHEETS_MENTOR_TAB || 'Mentor Passkeys';
let cachedStudents: { email: string; password: string }[] = [];
let cachedMentors: { name: string; email: string; passkey: string }[] = [];
let cachedAttendanceData: any = null;
let cachedCompletedStudentsData: any = null;
let cachedContinuingStudentsData: any = null;
let lastFetchTime = 0;
let lastMentorFetchTime = 0;
let lastAttendanceFetchTime = 0;
let lastCompletedStudentsFetchTime = 0;
let lastContinuingStudentsFetchTime = 0;
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
      
      // Get the raw data from the columns
      // We need to extract any content values and filter out the existing labels
      // The front-end will add the appropriate headers in the correct order
      
      // Extract raw values from the Google Sheet columns
      let projectTrackValue = row[11] || '';    // Column L (index 11) - Project Track
      let additionalGoalsValue = row[9] || '';  // Column J (index 9) - Additional Goals
      let requestedSupportValue = row[10] || ''; // Column K (index 10) - Requested Areas of Support
      
      // Remove any existing labels to prevent duplication with front-end formatting
      // These are common patterns in the data that might cause duplication
      projectTrackValue = projectTrackValue.replace(/^Project Track:?\s*/i, '').trim();
      additionalGoalsValue = additionalGoalsValue.replace(/^Additional Goals:?\s*/i, '').trim();
      requestedSupportValue = requestedSupportValue.replace(/^Requested Areas of Support:?\s*/i, '').trim();
      
      // Check if any pre-program info is available
      const hasPreProgramInfo = projectTrackValue || additionalGoalsValue || requestedSupportValue;
      
      // Format pre-program information in the exact order required
      let preProgramInfo = '';
      
      if (hasPreProgramInfo) {
        // Build the content without adding headers (the frontend will handle this)
        // Just provide the content values in the desired order
        const sections = [];
        
        // 1. Project Track content only (always first)
        sections.push(projectTrackValue);
        
        // 2. Additional Goals content only (always second)
        sections.push(additionalGoalsValue);
        
        // 3. Requested Areas of Support content only (always last)
        sections.push(requestedSupportValue);
        
        // Filter out any empty sections
        const nonEmptySections = sections.filter(section => section.trim() !== '');
        
        // Join them with double newlines (use the filtered sections)
        preProgramInfo = nonEmptySections.join('\n\n');
      } else {
        // If no pre-program info is available, display a custom message with the student's name
        preProgramInfo = `Please encourage ${studentName} to fill out the <a href="https://inspiritai.co/1-1-Pre-Program" target="_blank" style="color: #0066cc; text-decoration: underline;">Pre-Program Survey</a>.`;
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
        preAssessmentInfo = `Please encourage ${studentName} to fill out the <a href="https://inspiritai.co/1-1-Pre-Program" target="_blank" style="color: #0066cc; text-decoration: underline;">Pre-Program Survey</a>.`;
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
  const allStudents = await fetchStudentAttendanceData(forceRefresh);
  
  if (!allStudents || allStudents.length === 0) {
    return [];
  }
  
  // Include all students from the 10-session sheet
  const allTenSessionStudents = allStudents.filter((student: any) => {
    // Only include students that have some session data
    return student.sessionDates && Array.isArray(student.sessionDates);
  });
  
  // Use all students from the 10-session sheet without filtering by completion status
  let filteredStudents = [...allTenSessionStudents];
  
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
    
    filteredStudents = filteredStudents.filter((student: any) => {
      if (!student.mentorName) {
        return false;
      }
      
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
  
  // Ensure we only return the first 10 session dates
  return filteredStudents.map((student: any) => ({
    ...student,
    sessionDates: student.sessionDates.slice(0, 10) // Only keep the first 10 sessions
  }));
}

// Fetch 25-session student data from Google Sheets (separate function for 25-session students)
export async function fetch25SessionStudentData(forceRefresh = false): Promise<any> {
  const now = Date.now();
  
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    
    // Properly format sheet name
    const formattedSheetName = STUDENTS_25_SHEET_NAME.includes(' ') ? `'${STUDENTS_25_SHEET_NAME}'` : STUDENTS_25_SHEET_NAME;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${formattedSheetName}!A:BZ`, // Extended range for 25 sessions
    });
    
    const rows = response.data.values || [];
    
    if (rows.length <= 1) { // <= 1 because we expect at least a header row and one data row
      return [];
    }
    
    // Get header row for column mapping
    const headers = rows[0];
    
    // Define column indices - be more flexible with potential header names
    // Log the actual headers to troubleshoot
    const nameColIdx = headers.findIndex((h: string) => h && typeof h === 'string' && h.trim().toLowerCase() === 'student name');
    // The first column in the sheet is 'Instructor Name' according to the logs
    const mentorColIdx = 0; // Directly use index 0 since we know this is the instructor column
    const meetingLinkColIdx = headers.findIndex((h: string) => h && typeof h === 'string' && h.trim().toLowerCase() === 'meeting link');
    const gradeColIdx = headers.findIndex((h: string) => h && typeof h === 'string' && h.trim().toLowerCase() === 'grade');
    const experienceColIdx = headers.findIndex((h: string) => h && typeof h === 'string' && h.trim().toLowerCase() === 'experience');
    const goalsColIdx = headers.findIndex((h: string) => h && typeof h === 'string' && h.trim().toLowerCase() === 'goals');
    const deadlineColIdx = headers.findIndex((h: string) => h && typeof h === 'string' && h.trim().toLowerCase() === 'deadline');
    // Sessions completed count will be calculated manually
    const sessionsCountColIdx = headers.findIndex((h: string) => h && typeof h === 'string' && h.trim().toLowerCase() === '# sessions');
    
    // For 25-session students, map the specific columns as requested
    // Pre-program info columns (j, k, l)
    const additionalGoalsIdx = 9;  // column J (index 9) - Additional Goals
    const requestedAreasIdx = 10; // column K (index 10) - Requested Areas of Support
    const projectTrackIdx = 11;   // column L (index 11) - Project Track
    
    // Pre-assessment columns (m, n, o)
    const assessmentScoreIdx = 12;      // column M (index 12) - Assessment Score
    const definitionPandasIdx = 13;     // column N (index 13) - Definition of Pandas DF
    const reasonTrainTestIdx = 14;      // column O (index 14) - Reason for Train/Test Split
    
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
        
        const idx = headers.findIndex((h: string) => possibleNames.includes(h.trim().toLowerCase()));
        sessionColIndices.push(idx);
      }
    }
    
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
            }
          } catch (e) {
            // Any parsing error means invalid date
            dateValue = '-';
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
            date: '-',
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
      
      // Get the raw data from the columns
      // We need to extract any content values and filter out the existing labels
      // The front-end will add the appropriate headers in the correct order
      
      // Extract raw values from the Google Sheet columns
      let projectTrackValue = row[projectTrackIdx] || '';    // Column L - Project Track
      let additionalGoalsValue = row[additionalGoalsIdx] || '';  // Column J - Additional Goals
      let requestedSupportValue = row[requestedAreasIdx] || ''; // Column K - Requested Areas of Support
      
      // Remove any existing labels to prevent duplication with front-end formatting
      projectTrackValue = projectTrackValue.replace(/^Project Track:?\s*/i, '').trim();
      additionalGoalsValue = additionalGoalsValue.replace(/^Additional Goals:?\s*/i, '').trim();
      requestedSupportValue = requestedSupportValue.replace(/^Requested Areas of Support:?\s*/i, '').trim();
      
      // Check if any pre-program info is available
      const hasPreProgramInfo = projectTrackValue || additionalGoalsValue || requestedSupportValue;
      
      // Format pre-program information in the exact order required
      let preProgramInfo = '';
      
      if (hasPreProgramInfo) {
        // Build the content without adding headers (the frontend will handle this)
        // Just provide the content values in the desired order
        const sections = [];
        
        // 1. Project Track content only (always first)
        sections.push(projectTrackValue);
        
        // 2. Additional Goals content only (always second)
        sections.push(additionalGoalsValue);
        
        // 3. Requested Areas of Support content only (always last)
        sections.push(requestedSupportValue);
        
        // Filter out any empty sections
        const nonEmptySections = sections.filter(section => section.trim() !== '');
        
        // Join them with double newlines (use the filtered sections)
        preProgramInfo = nonEmptySections.join('\n\n');
      } else {
        preProgramInfo = `Please encourage ${row[nameColIdx]} to fill out the <a href="https://inspiritai.co/1-1-Pre-Program" target="_blank" style="color: #0066cc; text-decoration: underline;">Pre-Program Survey</a>.`;
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
        preAssessmentInfo = `Please encourage ${row[nameColIdx]} to fill out the <a href="https://inspiritai.co/1-1-Pre-Program" target="_blank" style="color: #0066cc; text-decoration: underline;">Pre-Program Survey</a>.`;
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
    
    return students;
    
  } catch (error) {
    console.error('Error fetching 25-session data from Google Sheets:', error);
    return [];
  }
}

// Get the 25-session students, optionally filtered by mentor name
export async function getTwentyFiveSessionStudents(forceRefresh = false, mentorName?: string): Promise<TwentyFiveSessionStudent[]> {
  const students = await fetch25SessionStudentData(forceRefresh);
  
  if (!students || students.length === 0) {
    return [];
  }
  
  // Sample the first few students to debug mentorName access
  let filteredStudents = students;
  
  // If a mentor name is provided, filter to only show that mentor's students
  if (mentorName) {
    // More permissive mentor name matching
    const simplifyName = (name: string) => {
      // Basic simplification: lowercase, trim spaces, and remove punctuation
      return name?.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '') || '';
    };
    
    const targetMentorSimplified = simplifyName(mentorName);
    
    // Try multiple matching approaches
    filteredStudents = students.filter((student: any) => {
      const instructorName = student.mentorName || '';
      
      if (!instructorName) {
        return false;
      }
      
      // Try different matching strategies
      const exactMatch = instructorName === mentorName;
      const simplifiedMatch = simplifyName(instructorName) === targetMentorSimplified;
      const containsMatch = simplifyName(instructorName).includes(targetMentorSimplified) || 
                           targetMentorSimplified.includes(simplifyName(instructorName));
      
      const isMatch = exactMatch || simplifiedMatch || containsMatch;
      
      return isMatch;
    });
  }
  
  return filteredStudents;
}

// Fetch completed students data from the dedicated Google Sheet
export async function fetchCompletedStudentsData(forceRefresh = false): Promise<any> {
  const now = Date.now();
  
  // Return cached data if it's fresh and not forced to refresh
  if (!forceRefresh && now - lastCompletedStudentsFetchTime < CACHE_DURATION && cachedCompletedStudentsData) {
    return cachedCompletedStudentsData;
  }
  
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    
    // Format sheet name for the API call
    const formattedSheetName = CONTINUING_STUDENTS_SHEET_NAME.includes(' ') 
      ? `'${CONTINUING_STUDENTS_SHEET_NAME}'` 
      : CONTINUING_STUDENTS_SHEET_NAME;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${formattedSheetName}!A:G`, // A-G covers all columns in Completed Students sheet
    });
    
    const rows = response.data.values || [];
    
    if (rows.length <= 1) {
      return [];
    }
    
    // Extract header row to use as keys
    const headers = rows[0].map((header: string) => header.trim());
    
    // Map data rows to objects using the headers as keys
    const students = rows.slice(1).map((row: string[]) => {
      const student: any = {};
      
      // Map columns to properties based on header names
      headers.forEach((header: string, index: number) => {
        const value = row[index] || '';
        
        switch (header) {
          case 'Instructor Name':
            student.mentorName = value;
            break;
          case 'Student Name':
            student.name = value;
            break;
          case 'Student Email':
            student.email = value;
            break;
          case 'Grade':
            student.grade = value;
            break;
          case 'Experience':
            student.experience = value;
            break;
          case 'Goals':
            student.goals = value;
            break;
          case 'Total # Sessions':
            student.totalSessions = parseInt(value) || 0;
            student.sessionsCompleted = parseInt(value) || 0; // For completed students, these values are the same
            student.totalSessionsCompleted = parseInt(value) || 0;
            break;
          case 'Sessions Continuing For':
            student.totalSessions = parseInt(value) || 0;
            student.sessionsRemaining = parseInt(value) || 0;
            break;
          case 'Sessions Held':
            student.sessionsCompleted = parseInt(value) || 0;
            break;
          default:
            // Handle any other columns that might be added in the future
            student[header.toLowerCase().replace(/\s+/g, '_')] = value;
        }
      });
      
      // Set default values for required fields if they're missing
      student.meetingLink = student.meetingLink || '';
      student.deadline = student.deadline || '';
      student.preProgramInfo = student.preProgramInfo || '';
      student.preAssessmentInfo = student.preAssessmentInfo || '';
      
      return student;
    }).filter((student: any) => student.name && student.mentorName); // Filter out rows with missing essential data
    
    // Update cache
    cachedCompletedStudentsData = students;
    lastCompletedStudentsFetchTime = now;
    
    return students;
  } catch (error) {
    console.error('Error fetching Completed Students data:', error);
    
    // Return cached data if available, otherwise empty array
    return cachedCompletedStudentsData || [];
  }
}

// Get students who have completed their program, optionally filtered by mentor name
export async function getCompletedStudents(forceRefresh = false, mentorName?: string): Promise<CompletedStudent[]> {
  const allStudents = await fetchCompletedStudentsData(forceRefresh);
  
  if (!allStudents || allStudents.length === 0) {
    return [];
  }
  
  let filteredStudents = allStudents;
  
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
    totalSessionsCompleted: student.totalSessionsCompleted || student.totalSessions || 0
  }));
}

// Fetch continuing students data from the dedicated Google Sheet
export async function fetchContinuingStudentsData(forceRefresh = false): Promise<any> {
  const now = Date.now();
  
  // Return cached data if it's fresh and not forced to refresh
  if (!forceRefresh && now - lastContinuingStudentsFetchTime < CACHE_DURATION && cachedContinuingStudentsData) {
    return cachedContinuingStudentsData;
  }
  
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    
    // Format sheet name for the API call
    const formattedSheetName = COMPLETED_STUDENTS_SHEET_NAME.includes(' ') 
      ? `'${COMPLETED_STUDENTS_SHEET_NAME}'` 
      : COMPLETED_STUDENTS_SHEET_NAME;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${formattedSheetName}!A:H`, // A-H covers all columns in Continuing Students sheet
    });
    
    const rows = response.data.values || [];
    
    if (rows.length <= 1) {
      return [];
    }
    
    // Extract header row to use as keys
    const headers = rows[0].map((header: string) => header.trim());
    
    // Map data rows to objects using the headers as keys
    const students = rows.slice(1).map((row: string[]) => {
      const student: any = {};
      
      // Map columns to properties based on header names
      headers.forEach((header: string, index: number) => {
        const value = row[index] || '';
        
        switch (header) {
          case 'Instructor Name':
            student.mentorName = value;
            break;
          case 'Student Name':
            student.name = value;
            break;
          case 'Student Email':
            student.email = value;
            break;
          case 'Grade':
            student.grade = value;
            break;
          case 'Experience':
            student.experience = value;
            break;
          case 'Goals':
            student.goals = value;
            break;
          case 'Total # Sessions':
            student.totalSessions = parseInt(value) || 0;
            student.sessionsCompleted = parseInt(value) || 0; // For completed students, these values are the same
            student.totalSessionsCompleted = parseInt(value) || 0;
            break;
          default:
            // Handle any other columns that might be added in the future
            student[header.toLowerCase().replace(/\s+/g, '_')] = value;
        }
      });
      
      // Set default values for required fields if they're missing
      student.meetingLink = student.meetingLink || '';
      student.deadline = student.deadline || '';
      student.preProgramInfo = student.preProgramInfo || '';
      student.preAssessmentInfo = student.preAssessmentInfo || '';
      
      return student;
    }).filter((student: any) => student.name && student.mentorName); // Filter out rows with missing essential data
    
    // Update cache
    cachedContinuingStudentsData = students;
    lastContinuingStudentsFetchTime = now;
    
    return students;
  } catch (error) {
    console.error('Error fetching Continuing Students data:', error);
    
    // Return cached data if available, otherwise empty array
    return cachedContinuingStudentsData || [];
  }
}

// Get students who are continuing beyond their initial program, optionally filtered by mentor name
export async function getContinuingStudents(forceRefresh = false, mentorName?: string): Promise<ContinuingStudent[]> {
  const allStudents = await fetchContinuingStudentsData(forceRefresh);
  
  if (!allStudents || allStudents.length === 0) {
    return [];
  }
  
  // Log all unique mentor names for debugging
  const allMentorNames = [...new Set(allStudents.map((s: any) => s.mentorName).filter(Boolean))];
  console.log('All mentor names in Continuing Students sheet:', allMentorNames);
  
  let filteredStudents = allStudents;
  
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
  
  console.log(`Found ${filteredStudents.length} continuing students after applying filters`);
  
  return filteredStudents.map((student: any) => ({
    ...student,
    sessionsRemaining: student.sessionsRemaining || 0
  }));
}