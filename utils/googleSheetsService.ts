import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Constants
const SPREADSHEET_ID = '1fkXcAsoZUIpu56XjyKQv2S5OTboYhVhwttGQCCadiFo';
const SHEET_NAME = 'Sheet1'; // Changed from 'Students' to 'Sheet1'
let cachedStudents: { email: string; password: string }[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache TTL

// Initialize the Google Sheets API
async function getAuthClient() {
  try {
    const credentialsPath = path.join(process.cwd(), 'app/api/auth/sheets-credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
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
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:B`, // Assuming column A is email and B is password
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
export async function getStudents(): Promise<{ email: string; password: string }[]> {
  try {
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