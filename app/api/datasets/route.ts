import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'Datasets+Databases Working Document - Datasets.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    const datasets = records.map((record: any) => ({
      name: record['Dataset name'] || '',
      domain: record['Domain'] || '',
      description: record['Description'] || '',
      dataType: record['Data type'] || '',
      size: record['Size'] || '',
      cleanliness: record['Cleanliness'] || '',
      link: record['Link to dataset source'] || '',
      types: record['Types of Models'] ? record['Types of Models'].split(',').map((type: string) => type.trim()) : [],
      sampleProject: record['Sample project ideas'] || '',
      supplementalInfo: record['Supplemental Material(s)'] || ''
    }));

    return NextResponse.json(datasets);
  } catch (error) {
    console.error('Error loading datasets:', error);
    return NextResponse.json({ error: 'Failed to load datasets' }, { status: 500 });
  }
} 