import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface Dataset {
  name: string;
  domain: string;
  description: string;
  dataType: string;
  size: string;
  cleanliness: string;
  link: string;
  types: string[];
  sampleProject: string;
  supplementalInfo: string;
}

// Function to parse the CSV file and return the datasets
export function parseDatasetsFromCSV(): Dataset[] {
  try {
    // Read the CSV file
    const csvFilePath = path.join(process.cwd(), 'data', 'Datasets+Databases Working Document - Datasets.csv');
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Parse the CSV content
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    // Transform the records into Dataset objects
    return records.map((record: any) => ({
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
  } catch (error) {
    console.error('Error parsing CSV file:', error);
    return [];
  }
}

// Export the datasets
export const datasets = parseDatasetsFromCSV(); 