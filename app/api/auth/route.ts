import { NextResponse } from 'next/server';
import { authenticateStudent } from '@/utils/googleSheetsService';

// API route to authenticate user credentials against Google Sheets
export async function POST(request: Request) {
  try {
    // Parse request body
    const { email, password, type } = await request.json();

    // Validate required fields
    if (!email || !password || !type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields' 
        },
        { status: 400 }
      );
    }

    // Handle different user types
    if (type === 'student') {
      // Use our enhanced authenticateStudent function that handles caching properly
      const isAuthenticated = await authenticateStudent(email, password);
      
      return NextResponse.json({ 
        success: isAuthenticated,
        message: isAuthenticated ? 'Authentication successful' : 'Invalid credentials'
      });
    } else {
      // For other user types, return error (or implement other auth methods)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unsupported user type' 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Return an error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'Authentication failed' 
      },
      { status: 500 }
    );
  }
}
