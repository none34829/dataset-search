import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEETS_ATTENDANCE_ID;
const SHEET_TAB = process.env.GOOGLE_SHEETS_ATTENDANCE_TAB;
const CREDENTIALS = process.env.GOOGLE_SHEETS_CREDENTIALS;

async function getSheetsClient() {
  const credentials = CREDENTIALS ? JSON.parse(CREDENTIALS) : {};
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

async function getNextSessionNumber(mentorName: string, studentName: string) {
  const sheets = await getSheetsClient();
  const range = `${SHEET_TAB}!A:S`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });
  const rows = response.data.values || [];
  
  // Find all session numbers for this mentor/student pair
  const sessionNumbers: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (
      row[1]?.trim().toLowerCase() === mentorName.trim().toLowerCase() &&
      row[2]?.trim().toLowerCase() === studentName.trim().toLowerCase()
    ) {
      // Check both regular session number (column D) and unexcused session number (column Q)
      const regularSession = row[3] ? parseInt(row[3]) : null;
      const unexcusedSession = row[16] ? parseInt(row[16]) : null;
      
      if (regularSession && !isNaN(regularSession)) {
        sessionNumbers.push(regularSession);
      }
      if (unexcusedSession && !isNaN(unexcusedSession)) {
        sessionNumbers.push(unexcusedSession);
      }
    }
  }
  
  // Sort session numbers and find the first gap
  sessionNumbers.sort((a, b) => a - b);
  
  // If no sessions exist, start with 1
  if (sessionNumbers.length === 0) {
    return 1;
  }
  
  // Find the first missing number in the sequence
  for (let i = 1; i <= Math.max(...sessionNumbers); i++) {
    if (!sessionNumbers.includes(i)) {
      return i;
    }
  }
  
  // If no gaps found, return the next number after the highest
  return Math.max(...sessionNumbers) + 1;
}

export async function POST(req: NextRequest) {
  try {
    const { mentorName, studentName } = await req.json();
    if (!mentorName || !studentName) {
      return NextResponse.json({ error: 'mentorName and studentName are required' }, { status: 400 });
    }
    const sessionNumber = await getNextSessionNumber(mentorName, studentName);
    return NextResponse.json({ sessionNumber });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Unknown error' }, { status: 500 });
  }
} 