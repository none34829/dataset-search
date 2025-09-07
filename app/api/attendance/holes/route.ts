import { NextRequest, NextResponse } from 'next/server';
import { detectAttendanceHoles } from '@/utils/attendanceHolesService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mentorName, studentName, studentType } = body;

    if (!mentorName || !studentName || !studentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['10', '25'].includes(studentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid student type' },
        { status: 400 }
      );
    }

    const holesResult = await detectAttendanceHoles(
      mentorName,
      studentName,
      studentType as '10' | '25'
    );

    return NextResponse.json({
      success: true,
      ...holesResult
    });

  } catch (error) {
    console.error('Error checking attendance holes:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
