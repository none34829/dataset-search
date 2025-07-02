import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEETS_ATTENDANCE_ID;
const SHEET_TAB = process.env.GOOGLE_SHEETS_ATTENDANCE_TAB;
const CREDENTIALS = process.env.GOOGLE_SHEETS_CREDENTIALS;

// Helper to get Google Sheets client
async function getSheetsClient() {
  const credentials = CREDENTIALS ? JSON.parse(CREDENTIALS) : {};
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

// Helper to get the next session number for a student
async function getNextSessionNumber(mentorName: string, studentName: string) {
  const sheets = await getSheetsClient();
  const range = `${SHEET_TAB}!A:S`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });
  const rows = response.data.values || [];
  // Find all rows for this mentor/student
  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (
      row[1]?.trim().toLowerCase() === mentorName.trim().toLowerCase() &&
      row[2]?.trim().toLowerCase() === studentName.trim().toLowerCase()
    ) {
      count++;
    }
  }
  return count + 1;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mentorName,
      mentorEmail,
      studentName,
      sessionDate,
      isUnexcusedAbsence,
      progressDescription,
      exitTicket
    } = body;

    // Auto-increment session number
    const sessionNumber = await getNextSessionNumber(mentorName, studentName);

    // Prepare row for Google Sheets (A-S)
    // See: Timestamp, Mentor Name, Student Name, Meeting Number, Meeting Date, Progress, Exit Ticket, ... Unexcused, ... Email, etc.
    const now = new Date();
    const timestamp = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.toLocaleTimeString('en-US', { hour12: false })}`;
    const row = Array(19).fill('');
    row[0] = timestamp; // Timestamp (A)
    row[1] = mentorName; // Mentor Name (B)
    row[2] = studentName; // Student Name (C)
    row[4] = sessionDate; // Meeting Date (E)
    row[8] = mentorEmail; // Email Address (I)
    // Conditional fields
    if (isUnexcusedAbsence) {
      row[12] = 'Yes'; // Unexcused Absence (M)
      row[16] = sessionNumber.toString(); // Session Number in Column Q
      row[13] = body.rescheduleHours || '';
      row[14] = body.unexcusedContext || '';
      // Leave D blank
    } else {
      row[3] = sessionNumber.toString(); // Session Number in Column D
      row[5] = progressDescription; // Progress (F)
      row[6] = exitTicket; // Exit Ticket (G)
      row[12] = 'No';
      // Leave Q blank
    }
    // (Other columns left blank)

    // Write to Google Sheets
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEET_TAB,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    return NextResponse.json({ success: true, sessionNumber });
  } catch (error) {
    console.error('Attendance submission error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Unknown error' }, { status: 500 });
  }
} 