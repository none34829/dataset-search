import { Dataset } from './datasetLoader';
import { loadDatasets } from './datasetLoader';

// Export the Dataset interface
export type { Dataset };

export async function searchDatasets(query: string, domain?: string): Promise<Dataset[]> {
  const datasets = await loadDatasets();
  return datasets.filter(
    (dataset) =>
      dataset.name.toLowerCase().includes(query.toLowerCase()) &&
      (!domain || dataset.domain === domain)
  );
}

export async function getAllDatasets(): Promise<Dataset[]> {
  return loadDatasets();
}

// Helper function to convert cleanliness string to a numeric value
function getCleanlinessValue(cleanliness: string): number {
  switch (cleanliness.toLowerCase()) {
    case 'excellent':
    case 'excellent, ready to use':
      return 1.0;
    case 'great':
    case 'great, just needs preprocessing':
      return 0.8;
    case 'good':
    case 'good, needs to be preprocessed and organized or difficult/atypical data type':
      return 0.6;
    case 'difficult':
    case 'difficult (noisy, extremely large, significant preprocessing and/or computation)':
      return 0.4;
    default:
      return 0.5;
  }
}

