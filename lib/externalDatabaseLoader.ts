import Papa from 'papaparse';

export interface ExternalDatabase {
  provider: string;
  category: string;
  description: string;
  affiliation: string;
  accessRequirements: string;
  handling: string;
  useCases: string;
  link: string;
}

export async function loadExternalDatabases(): Promise<ExternalDatabase[]> {
  try {
    const response = await fetch('/api/external');
    if (!response.ok) {
      throw new Error('Failed to fetch external databases');
    }
    const csvText = await response.text();
    
    const { data } = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true
    });

    // Find the header row (it's the one with "Provider" in the 4th column)
    const headerRowIndex = (data as string[][]).findIndex(row => row[3] === "Provider");
    if (headerRowIndex === -1) {
      throw new Error('Could not find header row in CSV');
    }

    // Get the actual data rows (skip the header row)
    const dataRows = (data as string[][]).slice(headerRowIndex + 1);

    // Map the rows to our interface
    return dataRows
      .filter(row => row[3] && row[4]) // Only include rows with Provider and Category
      .map(row => ({
        provider: row[3]?.trim() || 'Unknown Provider',
        category: row[4]?.trim() || 'Other',
        description: row[5]?.trim() || '',
        affiliation: row[6]?.trim() || '',
        accessRequirements: row[7]?.trim() || '',
        handling: row[8]?.trim() || '',
        useCases: row[9]?.trim() || '',
        link: row[10]?.trim() || ''
      }));
  } catch (error) {
    console.error('Error loading external databases:', error);
    return [];
  }
} 