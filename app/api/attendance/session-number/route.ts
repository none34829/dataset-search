import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Use the main Google Sheets ID for student data
const SHEET_ID = process.env.GOOGLE_SHEETS_ID || '1fkXcAsoZUIpu56XjyKQv2S5OTboYhVhwttGQCCadiFo';
const TEN_SESSION_SHEET = '10-Session Student Info';
const TWENTY_FIVE_SESSION_SHEET = '25-Session Student Info';
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
  
  // Try both 10-session and 25-session sheets
  const sheetsToCheck = [
    { name: TEN_SESSION_SHEET, maxSessions: 10 },
    { name: TWENTY_FIVE_SESSION_SHEET, maxSessions: 25 }
  ];
  
  for (const sheetInfo of sheetsToCheck) {
    try {
      const range = `'${sheetInfo.name}'!A:Q`; // Include column Q for session count
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range,
      });
      const rows = response.data.values || [];
      
      // Find the student in this sheet
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (
          row[0]?.trim().toLowerCase() === mentorName.trim().toLowerCase() && // Column A: Instructor Name
          row[1]?.trim().toLowerCase() === studentName.trim().toLowerCase()   // Column B: Student Name
        ) {
          // Get the session count from column Q (index 16)
          const sessionCountStr = row[16] || '';
          const sessionCount = parseInt(sessionCountStr);
          
          if (!isNaN(sessionCount) && sessionCount >= 0) {
            const nextSessionNumber = sessionCount + 1;
            console.log(`Found student ${studentName} with ${sessionCount} completed sessions in ${sheetInfo.name}, next session = ${nextSessionNumber}`);
            return nextSessionNumber;
          }
        }
      }
    } catch (error) {
      console.error(`Error checking ${sheetInfo.name}:`, error);
      // Continue to next sheet
    }
  }
  
  // If not found in either sheet, return 1 as fallback
  console.log(`Student ${studentName} not found in any student sheet, defaulting to session 1`);
  return 1;
}

export async function POST(req: NextRequest) {
  try {
    const { mentorName, studentName } = await req.json();
    console.log(`Session number request for: ${mentorName} / ${studentName}`);
    if (!mentorName || !studentName) {
      return NextResponse.json({ error: 'mentorName and studentName are required' }, { status: 400 });
    }
    const sessionNumber = await getNextSessionNumber(mentorName, studentName);
    console.log(`Returning session number: ${sessionNumber}`);
    return NextResponse.json({ sessionNumber });
  } catch (error) {
    console.error('Error in session number endpoint:', error);
    return NextResponse.json({ error: (error as Error).message || 'Unknown error' }, { status: 500 });
  }
} 