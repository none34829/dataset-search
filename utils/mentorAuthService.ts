"use server";

import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

// Mentor data structure
export interface MentorData {
  name: string;
  email: string;
  passkey: string;
}

// Constants
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1fkXcAsoZUIpu56XjyKQv2S5OTboYhVhwttGQCCadiFo';
const MENTOR_SHEET_NAME = process.env.GOOGLE_SHEETS_MENTOR_TAB || 'Mentor Passkeys';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache variables
let cachedMentors: MentorData[] = [];
let lastMentorFetchTime = 0;

// Initialize the Google Sheets API
async function getAuthClient() {
  try {
    const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
    
    if (!credentials) {
      throw new Error('Google Sheets credentials not found in environment variables');
    }
    
    const parsedCredentials = JSON.parse(credentials);
    const auth = new GoogleAuth({
      credentials: parsedCredentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    return auth;
  } catch (error) {
    console.error('Error initializing Google Sheets auth client:', error);
    throw error;
  }
}

// Fetch mentor data from Google Sheets
async function fetchMentorsFromSheet(): Promise<MentorData[]> {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${MENTOR_SHEET_NAME}!A:C`, // Columns: Mentor Name, Mentor Email, Passkey
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in mentor sheet.');
      return [];
    }
    
    // Skip the header row
    const mentors = rows.slice(1).map((row: string[]) => {
      return {
        name: row[0] || '',
        email: row[1] || '',
        passkey: row[2] || ''
      };
    }).filter((mentor: MentorData) => mentor.email && mentor.passkey); // Filter out invalid entries
    
    // Update cache
    cachedMentors = mentors;
    lastMentorFetchTime = Date.now();
    
    return mentors;
  } catch (error) {
    console.error('Error fetching mentor data:', error);
    return [];
  }
}

// Function to get mentors (with cache)
export async function getMentors(forceRefresh = false): Promise<MentorData[]> {
  const now = Date.now();
  
  // Return cached data if it's fresh
  if (!forceRefresh && now - lastMentorFetchTime < CACHE_DURATION && cachedMentors.length > 0) {
    return cachedMentors;
  }
  
  // Fetch fresh data
  return fetchMentorsFromSheet();
}

// Authenticate a mentor with the provided credentials
export async function authenticateMentor(email: string, passkey: string): Promise<{ authenticated: boolean; mentorName?: string }> {
  // First try with potentially cached data
  console.log(`Attempting mentor authentication for ${email}`);
  
  let mentors = await getMentors();
  
  // Find mentor that matches the login credentials
  let mentor = findMatchingMentor(mentors, email, passkey);
  
  if (mentor) {
    console.log(`Mentor authentication succeeded with cached data for ${email}`);
    return { authenticated: true, mentorName: mentor.name };
  }
  
  // If not found, force refresh in case the record was added recently
  console.log(`Mentor authentication failed with cached data. Forcing refresh for ${email}`);
  mentors = await getMentors(true);
  mentor = findMatchingMentor(mentors, email, passkey);
  
  if (mentor) {
    console.log(`Mentor authentication succeeded after cache refresh for ${email}`);
    return { authenticated: true, mentorName: mentor.name };
  } else {
    console.log(`Mentor authentication failed after cache refresh for ${email}. Invalid credentials.`);
    return { authenticated: false };
  }
}

// Helper function to find a mentor that matches the login credentials
// Supports multiple email addresses separated by commas
function findMatchingMentor(mentors: MentorData[], loginEmail: string, passkey: string): MentorData | undefined {
  // Convert login email to lowercase for case-insensitive comparison
  const normalizedLoginEmail = loginEmail.toLowerCase();
  
  return mentors.find(mentor => {
    // Check if passkey matches (case-sensitive)
    if (mentor.passkey !== passkey) return false;
    
    // Split mentor email by commas and check if any match the login email (case-insensitive)
    const mentorEmails = mentor.email.split(/,\s*/).map(e => e.trim().toLowerCase());
    return mentorEmails.includes(normalizedLoginEmail);
  });
}

// Get all mentor details (for admin purposes)
export async function getAllMentorDetails(): Promise<MentorData[]> {
  return getMentors(true); // Always get fresh data for admin views
}
