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
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${formattedSheetName}!A:B`, // Assuming column A is email and B is password
    });
    
    const rows = response.data.values || [];
    
    // Skip header row and map data
    const students = rows.slice(1).map((row: string[]) => ({
      email: row[0],
      password: row[1]
    }));
    
    // Update cache
    cachedStudents = students;
    lastFetchTime = now;
    
    return students;
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