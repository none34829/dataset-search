import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

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

export async function loadDatasets(): Promise<Dataset[]> {
  try {
    const response = await fetch('/api/datasets');
    if (!response.ok) {
      throw new Error('Failed to fetch datasets');
    }
    const datasets = await response.json();
    return datasets;
  } catch (error) {
    console.error('Error loading datasets:', error);
    return [];
  }
} 