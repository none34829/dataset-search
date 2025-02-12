export interface Dataset {
  id: string
  name: string
  description: string
  domain: string
  cleanliness: number
  size: string
}

const mockDatasets: Dataset[] = [
  {
    id: "1",
    name: "GPT-3 Training Data",
    description: "A large dataset used for training language models",
    domain: "Natural Language Processing",
    cleanliness: 0.95,
    size: "570GB",
  },
  {
    id: "2",
    name: "ImageNet",
    description: "A large visual database designed for use in visual object recognition research",
    domain: "Computer Vision",
    cleanliness: 0.98,
    size: "150GB",
  },
  {
    id: "3",
    name: "MNIST",
    description: "A database of handwritten digits",
    domain: "Computer Vision",
    cleanliness: 0.99,
    size: "11MB",
  },
  // Add more mock datasets as needed
]

export function searchDatasets(query: string, domain?: string, minCleanliness?: number): Dataset[] {
  return mockDatasets.filter(
    (dataset) =>
      dataset.name.toLowerCase().includes(query.toLowerCase()) &&
      (!domain || dataset.domain === domain) &&
      (!minCleanliness || dataset.cleanliness >= minCleanliness),
  )
}

export function getAllDatasets(): Dataset[] {
  return mockDatasets
}

