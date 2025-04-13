import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Get the absolute path to the data directory
    const dataDirectory = path.join(process.cwd(), 'data');
    
    // Read the CSV file
    const fileContents = await fs.readFile(
      path.join(dataDirectory, 'Datasets+Databases Working Document - Databases [FORMATTED].csv'),
      'utf8'
    );
    
    return new NextResponse(fileContents, {
      headers: {
        'Content-Type': 'text/csv',
      },
    });
  } catch (error) {
    console.error('Error reading external databases:', error);
    return new NextResponse('Error reading external databases', { status: 500 });
  }
} 