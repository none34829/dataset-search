import { NextRequest, NextResponse } from 'next/server';
import { getMentors } from '@/utils/mentorAuthService';

export async function GET(request: NextRequest) {
  try {
    // Check if we need to force refresh the cache
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    
    // Get mentors data
    const mentors = await getMentors(forceRefresh);
    
    // Return mentor data with success status (excluding passkeys for security)
    return NextResponse.json({
      success: true,
      data: mentors.map(mentor => ({
        name: mentor.name,
        email: mentor.email,
        // Don't return the actual passkey, just an indication it exists
        hasPasskey: !!mentor.passkey
      }))
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mentors' },
      { status: 500 }
    );
  }
}
