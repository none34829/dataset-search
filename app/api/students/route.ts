import { NextResponse } from 'next/server';
import { getStudents } from '@/utils/googleSheetsService';

// API route to get students from Google Sheets
export async function GET() {
  try {
    const students = await getStudents();
    
    // Return a successful response with the student data
    return NextResponse.json({ 
      success: true, 
      data: students 
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    
    // Return an error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch students' 
      },
      { status: 500 }
    );
  }
} 