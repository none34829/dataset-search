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
  
  // First, check attendance records to see what sessions have already been submitted
  const attendanceSheetId = process.env.GOOGLE_SHEETS_ATTENDANCE_ID;
  const attendanceSheetTab = process.env.GOOGLE_SHEETS_ATTENDANCE_TAB;
  
  let submittedSessions: number[] = [];
  
  if (attendanceSheetId && attendanceSheetTab) {
    try {
      const attendanceRange = `${attendanceSheetTab}!A:S`;
      const attendanceResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: attendanceSheetId,
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
  }
  
  // Try both 10-session and 25-session sheets first
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
      spreadsheetId: SHEET_ID,
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
              spreadsheetId: SHEET_ID,
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
                   
                   // Check if this session has already been submitted
                   if (submittedSessions.includes(nextSessionNumber)) {
                     console.log(`Session ${nextSessionNumber} already submitted for continuing student ${studentName}, finding next available session`);
                     
                     // Find the next available session number
                     let availableSession = nextSessionNumber + 1;
                     while (submittedSessions.includes(availableSession) && availableSession <= totalAllowedSessions) {
                       availableSession++;
                     }
                     
                     if (availableSession <= totalAllowedSessions) {
                       console.log(`Found available session ${availableSession} for continuing student ${studentName}`);
                       return availableSession;
                     } else {
                       console.log(`No more available sessions for continuing student ${studentName} (max: ${totalAllowedSessions})`);
                       return totalAllowedSessions + 1; // Return next session number beyond limit (like 26 for 25-session student)
                     }
                   }
                   
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

// Helper function to get maximum allowed sessions for a student
async function getMaxAllowedSessions(mentorName: string, studentName: string): Promise<number> {
  const sheets = await getSheetsClient();
  
  // Try both 10-session and 25-session sheets first
  const sheetsToCheck = [
    { name: TEN_SESSION_SHEET, maxSessions: 10 },
    { name: TWENTY_FIVE_SESSION_SHEET, maxSessions: 25 }
  ];
  
  for (const sheetInfo of sheetsToCheck) {
    try {
      const range = `'${sheetInfo.name}'!A:Q`;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range,
      });
      const rows = response.data.values || [];
      
      // Find the student in this sheet
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (
          row[0]?.trim().toLowerCase() === mentorName.trim().toLowerCase() &&
          row[1]?.trim().toLowerCase() === studentName.trim().toLowerCase()
        ) {
          console.log(`Found student ${studentName} in ${sheetInfo.name}, max sessions: ${sheetInfo.maxSessions}`);
          return sheetInfo.maxSessions;
        }
      }
    } catch (error) {
      console.error(`Error checking ${sheetInfo.name}:`, error);
    }
  }
  
  // If not found in regular sheets, check Completed Students + Continuing Students
  try {
    const completedRange = `'Completed Students'!A:G`;
    const completedResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: completedRange,
    });
    const completedRows = completedResponse.data.values || [];
    
    // Find the student in Completed Students sheet
    for (let i = 1; i < completedRows.length; i++) {
      const row = completedRows[i];
      if (
        row[0]?.trim().toLowerCase() === mentorName.trim().toLowerCase() &&
        row[1]?.trim().toLowerCase() === studentName.trim().toLowerCase()
      ) {
        const totalSessionsStr = row[6] || '';
        const totalSessions = parseInt(totalSessionsStr);
        
        if (!isNaN(totalSessions) && (totalSessions === 10 || totalSessions === 25)) {
          // Check Continuing Students sheet for additional sessions
          try {
            const continuingRange = `'Continuing Students'!A:G`;
            const continuingResponse = await sheets.spreadsheets.values.get({
              spreadsheetId: SHEET_ID,
              range: continuingRange,
            });
            const continuingRows = continuingResponse.data.values || [];
            
            // Find the student in Continuing Students sheet
            for (let j = 1; j < continuingRows.length; j++) {
              const continuingRow = continuingRows[j];
              if (
                continuingRow[0]?.trim().toLowerCase() === mentorName.trim().toLowerCase() &&
                continuingRow[1]?.trim().toLowerCase() === studentName.trim().toLowerCase()
              ) {
                const sessionsContinuingStr = continuingRow[6] || '';
                const sessionsContinuing = parseInt(sessionsContinuingStr);
                
                if (!isNaN(sessionsContinuing) && sessionsContinuing > 0) {
                  const totalAllowedSessions = totalSessions + sessionsContinuing;
                  console.log(`Found continuing student ${studentName}: original ${totalSessions} + continuing ${sessionsContinuing} = ${totalAllowedSessions} total allowed sessions`);
                  return totalAllowedSessions;
                }
              }
            }
          } catch (error) {
            console.error(`Error checking Continuing Students sheet:`, error);
          }
          
          // If found in Completed Students but not in Continuing Students, return original max
          console.log(`Found completed student ${studentName} with original ${totalSessions} sessions, no continuing sessions`);
          return totalSessions;
        }
      }
    }
  } catch (error) {
    console.error(`Error checking Completed Students sheet:`, error);
  }
  
  // Default fallback
  console.log(`Student ${studentName} not found in any sheet, defaulting to 25 sessions`);
  return 25;
}

export async function POST(req: NextRequest) {
  try {
    const { mentorName, studentName } = await req.json();
    console.log(`Session number request for: ${mentorName} / ${studentName}`);
    if (!mentorName || !studentName) {
      return NextResponse.json({ error: 'mentorName and studentName are required' }, { status: 400 });
    }
    
    const [sessionNumber, maxSessions] = await Promise.all([
      getNextSessionNumber(mentorName, studentName),
      getMaxAllowedSessions(mentorName, studentName)
    ]);
    
    console.log(`Returning session number: ${sessionNumber}, max sessions: ${maxSessions}`);
    return NextResponse.json({ sessionNumber, maxSessions });
  } catch (error) {
    console.error('Error in session number endpoint:', error);
    return NextResponse.json({ error: (error as Error).message || 'Unknown error' }, { status: 500 });
  }
} 