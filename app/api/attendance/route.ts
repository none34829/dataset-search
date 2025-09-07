import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { clearAttendanceCache } from '@/utils/googleSheetsService';

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

// Helper to get the session number from student data sheets
async function getNextSessionNumber(mentorName: string, studentName: string) {
  const sheets = await getSheetsClient();
  
  // First, check attendance records to see what sessions have already been submitted
  let submittedSessions: number[] = [];
  
  try {
    const attendanceRange = `${SHEET_TAB}!A:S`;
    const attendanceResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: attendanceRange,
    });
    const attendanceRows = attendanceResponse.data.values || [];
    
    // Find all submitted sessions for this mentor/student pair
    for (let i = 1; i < attendanceRows.length; i++) {
      const row = attendanceRows[i];
      if (
        row[1]?.trim().toLowerCase() === mentorName.trim().toLowerCase() && // Column B: Mentor Name
        row[2]?.trim().toLowerCase() === studentName.trim().toLowerCase()   // Column C: Student Name
      ) {
        // Check both regular session number (column D) and unexcused session number (column Q)
        const regularSession = row[3] ? parseInt(row[3]) : null;
        const unexcusedSession = row[16] ? parseInt(row[16]) : null;
        
        if (regularSession && !isNaN(regularSession)) {
          submittedSessions.push(regularSession);
        }
        if (unexcusedSession && !isNaN(unexcusedSession)) {
          submittedSessions.push(unexcusedSession);
        }
      }
    }
    
    console.log(`Found submitted sessions for ${studentName}: ${submittedSessions.join(', ')}`);
  } catch (error) {
    console.error('Error checking attendance records:', error);
  }
  
  // Use the main Google Sheets ID for student data
  const STUDENT_SHEET_ID = process.env.GOOGLE_SHEETS_ID || '1fkXcAsoZUIpu56XjyKQv2S5OTboYhVhwttGQCCadiFo';
  const TEN_SESSION_SHEET = '10-Session Student Info';
  const TWENTY_FIVE_SESSION_SHEET = '25-Session Student Info';
  
  // Try both 10-session and 25-session sheets first
  const sheetsToCheck = [
    { name: TEN_SESSION_SHEET, maxSessions: 10 },
    { name: TWENTY_FIVE_SESSION_SHEET, maxSessions: 25 }
  ];
  
  for (const sheetInfo of sheetsToCheck) {
    try {
      const range = `'${sheetInfo.name}'!A:Q`; // Include column Q for session count
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: STUDENT_SHEET_ID,
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
            
            // Check if this session has already been submitted
            if (submittedSessions.includes(nextSessionNumber)) {
              console.log(`Session ${nextSessionNumber} already submitted for ${studentName}, finding next available session`);
              
              // Find the next available session number
              let availableSession = nextSessionNumber + 1;
              while (submittedSessions.includes(availableSession) && availableSession <= sheetInfo.maxSessions) {
                availableSession++;
              }
              
              if (availableSession <= sheetInfo.maxSessions) {
                console.log(`Found available session ${availableSession} for ${studentName}`);
                return availableSession;
              } else {
                console.log(`No more available sessions for ${studentName} (max: ${sheetInfo.maxSessions})`);
                return sheetInfo.maxSessions + 1; // Return next session number beyond limit (like 26 for 25-session student)
              }
            }
            
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
  
  // If not found in regular sheets, check Completed Students sheet
  try {
    const completedRange = `'Completed Students'!A:G`; // Include column G for Total # Sessions
    const completedResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: STUDENT_SHEET_ID,
      range: completedRange,
    });
    const completedRows = completedResponse.data.values || [];
    
    // Find the student in Completed Students sheet
    for (let i = 1; i < completedRows.length; i++) {
      const row = completedRows[i];
      if (
        row[0]?.trim().toLowerCase() === mentorName.trim().toLowerCase() && // Column A: Instructor Name
        row[1]?.trim().toLowerCase() === studentName.trim().toLowerCase()   // Column B: Student Name
      ) {
        // Get the total sessions from column G (index 6) - this tells us if they were from 10 or 25 session program
        const totalSessionsStr = row[6] || '';
        const totalSessions = parseInt(totalSessionsStr);
        
        if (!isNaN(totalSessions) && (totalSessions === 10 || totalSessions === 25)) {
          console.log(`Found completed student ${studentName} with original ${totalSessions} sessions`);
          
          // Now check Continuing Students sheet for Sessions Continuing For
          try {
            const continuingRange = `'Continuing Students'!A:G`; // Include column G for Sessions Continuing For
            const continuingResponse = await sheets.spreadsheets.values.get({
              spreadsheetId: STUDENT_SHEET_ID,
              range: continuingRange,
            });
            const continuingRows = continuingResponse.data.values || [];
            
            // Find the student in Continuing Students sheet
            for (let j = 1; j < continuingRows.length; j++) {
              const continuingRow = continuingRows[j];
              if (
                continuingRow[0]?.trim().toLowerCase() === mentorName.trim().toLowerCase() && // Column A: Instructor Name
                continuingRow[1]?.trim().toLowerCase() === studentName.trim().toLowerCase()   // Column B: Student Name
              ) {
                // Get Sessions Continuing For from column G (index 6)
                const sessionsContinuingStr = continuingRow[6] || '';
                const sessionsContinuing = parseInt(sessionsContinuingStr);
                
                if (!isNaN(sessionsContinuing) && sessionsContinuing > 0) {
                  // Calculate total allowed sessions: original sessions + continuing sessions
                  const totalAllowedSessions = totalSessions + sessionsContinuing;
                  const nextSessionNumber = totalSessions + 1; // Next session after completing original program
                  
                  console.log(`Found continuing student ${studentName}: original ${totalSessions} + continuing ${sessionsContinuing} = ${totalAllowedSessions} total allowed sessions`);
                  console.log(`Next session number: ${nextSessionNumber}`);
                  
                  return nextSessionNumber;
                }
              }
            }
          } catch (error) {
            console.error(`Error checking Continuing Students sheet:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error checking Completed Students sheet:`, error);
  }
  
  // If not found in any sheet, return 1 as fallback
  console.log(`Student ${studentName} not found in any student sheet, defaulting to session 1`);
  return 1;
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
      exitTicket,
      sessionNumber: providedSessionNumber // Allow specific session number to be provided
    } = body;

    // Use provided session number if available, otherwise auto-increment
    const sessionNumber = providedSessionNumber 
      ? parseInt(providedSessionNumber)
      : await getNextSessionNumber(mentorName, studentName);
    
    console.log(`Session calculation for ${mentorName}/${studentName}: ${providedSessionNumber ? `Using provided session number = ${sessionNumber}` : `Auto-calculated next session number = ${sessionNumber}`}`);

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

    // Write special session answers to correct columns
    if (body.specialQuestionType && body.specialQuestionSession && body.specialQuestionValues) {
      const type = body.specialQuestionType;
      const session = Number(body.specialQuestionSession);
      const vals = body.specialQuestionValues;
      if (type === '10') {
        if (session === 2 && vals.projectTopic) row[9] = vals.projectTopic; // J
        if (session === 5) {
          if (vals.confirmedTopic) row[17] = vals.confirmedTopic; // R
          if (vals.midFeedback) row[10] = vals.midFeedback; // K
        }
        if (session === 10 && vals.finalFeedback) row[11] = vals.finalFeedback; // L
      } else if (type === '25') {
        if (session === 2 && vals.projectTopic25) row[9] = vals.projectTopic25; // J
        if (session === 5 && vals.confirmedTopic) row[17] = vals.confirmedTopic; // R
        if (session === 12 && vals.midFeedback25) row[18] = vals.midFeedback25; // S
        if (session === 25 && vals.finalFeedback) row[11] = vals.finalFeedback; // L
      }
    }

    // Write to Google Sheets
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEET_TAB,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    // Clear attendance cache to ensure fresh data is fetched immediately
    await clearAttendanceCache();

    return NextResponse.json({ success: true, sessionNumber });
  } catch (error) {
    console.error('Attendance submission error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Unknown error' }, { status: 500 });
  }
} 