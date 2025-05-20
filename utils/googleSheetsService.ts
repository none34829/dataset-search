import { google } from 'googleapis';

// Constants
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1fkXcAsoZUIpu56XjyKQv2S5OTboYhVhwttGQCCadiFo';
const SHEET_NAME = process.env.GOOGLE_SHEETS_TAB || 'Student Passkeys';
let cachedStudents: { email: string; password: string }[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache TTL

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
  if (now - lastFetchTime < CACHE_TTL && cachedStudents.length > 0) {
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