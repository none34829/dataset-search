"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Dataset, searchDatasets } from "@/lib/api"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Inter } from "next/font/google"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Beaker, 
  Leaf, 
  BookOpen, 
  Atom, 
  Dna, 
  Cog, 
  BarChart3, 
  Heart, 
  Computer, 
  Users, 
  Palette, 
  BookText 
} from "lucide-react"

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'], display: 'swap' });

// Mock user data for demonstration
const mockUser = {
  type: "mentor", // or "student"
  email: "john.doe@example.com"
}

// Domain color schemes and icons
const domainColors = {
  "Chemistry": { 
    bg: "bg-amber-50", 
    icon: "bg-amber-500", 
    hover: "hover:bg-amber-100",
    IconComponent: Beaker 
  },
  "Environment": { 
    bg: "bg-green-50", 
    icon: "bg-green-500", 
    hover: "hover:bg-green-100",
    IconComponent: Leaf
  },
  "History": { 
    bg: "bg-blue-50", 
    icon: "bg-blue-500", 
    hover: "hover:bg-blue-100",
    IconComponent: BookOpen
  },
  "Physics": { 
    bg: "bg-purple-50", 
    icon: "bg-purple-500", 
    hover: "hover:bg-purple-100",
    IconComponent: Atom
  },
  "Biology": { 
    bg: "bg-rose-50", 
    icon: "bg-rose-500", 
    hover: "hover:bg-rose-100",
    IconComponent: Dna
  },
  "Engineering": { 
    bg: "bg-orange-50", 
    icon: "bg-orange-500", 
    hover: "hover:bg-orange-100",
    IconComponent: Cog
  },
  "Economics": { 
    bg: "bg-emerald-50", 
    icon: "bg-emerald-500", 
    hover: "hover:bg-emerald-100",
    IconComponent: BarChart3
  },
  "Health": { 
    bg: "bg-red-50", 
    icon: "bg-red-500", 
    hover: "hover:bg-red-100",
    IconComponent: Heart
  },
  "Computer Science": { 
    bg: "bg-indigo-50", 
    icon: "bg-indigo-500", 
    hover: "hover:bg-indigo-100",
    IconComponent: Computer
  },
  "Social Sciences": { 
    bg: "bg-cyan-50", 
    icon: "bg-cyan-500", 
    hover: "hover:bg-cyan-100",
    IconComponent: Users
  },
  "Arts": { 
    bg: "bg-fuchsia-50", 
    icon: "bg-fuchsia-500", 
    hover: "hover:bg-fuchsia-100",
    IconComponent: Palette
  },
  "Literature": { 
    bg: "bg-yellow-50", 
    icon: "bg-yellow-500", 
    hover: "hover:bg-yellow-100",
    IconComponent: BookText
  }
}

// Difficulty indicators
const difficultyClasses = {
  "Easy": "bg-green-500 hover:bg-green-600",
  "Medium": "bg-yellow-500 hover:bg-yellow-600",
  "Difficult": "bg-red-500 hover:bg-red-600",
  "Critical": "bg-red-600 hover:bg-red-700"
}

// Mock datasets
const mockDatasets = [
  {
    id: "1",
    name: "Historical Events Analysis",
    domain: "Computer Science",
    description: "Dataset containing major historical events from 1900-2000, with timestamps, locations, and key figures involved.",
    cleanliness: "Difficult",
    sampleProject: "Learn about data analysis on event chronological sequences and how to identify patterns across time.",
    types: "List of historical events with dates, locations, key figures, descriptions, outcomes, and related events.",
    supplementalInfo: "Includes linked references to primary sources and historical documents where available.",
    fullDescription: "This comprehensive historical dataset covers major world events throughout the 20th century. It includes timestamps down to the day (and sometimes hour) when available, precise geographic coordinates, key historical figures involved, detailed descriptions, immediate and long-term outcomes, and connections to related events. The dataset has been compiled from multiple authoritative sources and cross-referenced for accuracy."
  },
  {
    id: "2",
    name: "Environmental Metrics Collection",
    domain: "Environment",
    description: "Global environmental measurements including air quality, temperature variations, and pollution levels from 2010-2023.",
    cleanliness: "Easy",
    sampleProject: "Analyze trends in air quality across different regions and their correlation with industrial activity.",
    types: "Time series data of environmental measurements, geographic coordinates, measurement types, and source information.",
    supplementalInfo: "Supplemented with industrial activity indices and population density data for correlation studies.",
    fullDescription: "This dataset provides comprehensive environmental measurements collected from monitoring stations worldwide between 2010-2023. It includes hourly readings of air quality indexes (PM2.5, PM10, NO2, SO2, CO, O3), temperature, humidity, precipitation, and various pollution metrics. All measurements are geotagged and include metadata about the collection methods and equipment used. The dataset is regularly cleaned and verified against multiple sources to ensure accuracy."
  },
  {
    id: "3",
    name: "Chemical Compound Properties",
    domain: "Chemistry", 
    description: "Extensive database of chemical compounds with their physical and chemical properties, uses, and hazard classifications.",
    cleanliness: "Medium",
    sampleProject: "Predict boiling points and solubility of compounds based on their molecular structure.",
    types: "Compound identifiers, molecular structures, physical properties, chemical properties, and safety information.",
    supplementalInfo: "Includes 3D molecular structures and spectroscopic data for selected compounds.",
    fullDescription: "This chemistry dataset contains detailed information on over 10,000 chemical compounds including IUPAC names, molecular formulas, structural data, physical properties (melting/boiling points, density, solubility), chemical reactivity, commercial applications, and complete safety classifications. The data has been compiled from multiple scientific databases and includes citation information for each property."
  },
  {
    id: "4",
    name: "Quantum Physics Experiments",
    domain: "Physics",
    description: "Results from quantum mechanics experiments conducted at major research institutions between 2015-2023.",
    cleanliness: "Critical",
    sampleProject: "Analyze quantum entanglement measurements and test Bell's inequalities.",
    types: "Experimental setup parameters, measurement results, uncertainty values, and theoretical predictions.",
    supplementalInfo: "Includes researcher notes and alternative interpretations of unexpected results.",
    fullDescription: "This dataset comprises detailed results from cutting-edge quantum physics experiments conducted at CERN, Fermilab, and other major research institutions. It includes precise measurements from quantum entanglement tests, quantum computing qubit stability experiments, quantum field observations, and more. Each experiment entry contains detailed setup parameters, raw measurement data, statistical analysis, uncertainty calculations, and comparisons to theoretical predictions. This is a highly specialized dataset intended for physics researchers and advanced students."
  }
];

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [domain, setDomain] = useState("")
  const [minCleanliness, setMinCleanliness] = useState(0)
  const [results, setResults] = useState(mockDatasets)
  const [activeTab, setActiveTab] = useState("curated")
  const [selectedDataset, setSelectedDataset] = useState<null | typeof mockDatasets[0]>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  useEffect(() => {
    // Filter datasets based on search query (live filtering)
    if (query) {
      const filtered = mockDatasets.filter(dataset => 
        dataset.name.toLowerCase().includes(query.toLowerCase()) || 
        dataset.description.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults(mockDatasets);
    }
  }, [query]);

  const handleDomainChange = (value: string) => {
    setDomain(value);
    if (value && value !== "all") {
      const filtered = mockDatasets.filter(dataset => 
        dataset.domain.toLowerCase() === value.toLowerCase()
      );
      setResults(filtered);
    } else {
      setResults(mockDatasets);
    }
  };
  
  const openDatasetModal = (dataset: typeof mockDatasets[0]) => {
    setSelectedDataset(dataset);
    setIsModalOpen(true);
  };
  
  // Generate profile initials based on user email
  const getProfileInitials = () => {
    if (mockUser.type === "mentor") {
      // Extract name from email (taking the part before @)
      const emailNamePart = mockUser.email.split('@')[0];
      
      // Split by dots, underscores, or other common separators
      const nameParts = emailNamePart.split(/[._-]/);
      
      // If we have multiple parts, take first letter of first two parts
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      } 
      // If single part and longer than 1 character, take first two letters
      else if (emailNamePart.length > 1) {
        return emailNamePart.substring(0, 2).toUpperCase();
      }
      // Fallback
      else {
        return emailNamePart[0].toUpperCase();
      }
    } else {
      // Student - first two letters of email
      return mockUser.email.substring(0, 2).toUpperCase();
    }
  }
  
  // Extract name from email for display purposes
  const getNameFromEmail = () => {
    // Extract the part before @ in the email
    const emailName = mockUser.email.split('@')[0];
    
    // Split by common separators like dots, underscores, hyphens
    const nameParts = emailName.split(/[._-]/);
    
    // Capitalize first letter of each part
    const formattedParts = nameParts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    );
    
    // Join with spaces
    return formattedParts.join(' ');
  }
  
  const handleLogout = () => {
    // Handle logout functionality here
    console.log("Logging out...")
    // Redirect to the root page which has the student/mentor selection
    router.push('/')
  }
  
  return (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      {/* Navigation Bar */}
      <header className="border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="flex justify-center">
              <img 
                src="/updated+logo+3.15.24-2.png" 
                alt="INSPIRIT AI Logo" 
                className="h-13 w-48 mr-2"
              />
            </div>
            <h1 className="ml-8 text-xl font-semibold">Dataset Search Tool</h1>
          </div>
          
          <div className="flex items-center">
            <nav className="mr-6">
              <ul className="flex space-x-6">
                <li>
                  <button 
                    className={`px-3 py-2 ${activeTab === "curated" ? "border-b-2 border-indigo-600 font-medium" : ""}`}
                    onClick={() => setActiveTab("curated")}
                  >
                    Curated Datasets
                  </button>
                </li>
                <li>
                  <button 
                    className={`px-3 py-2 ${activeTab === "external" ? "border-b-2 border-indigo-600 font-medium" : ""}`}
                    onClick={() => setActiveTab("external")}
                  >
                    External Databases
                  </button>
                </li>
              </ul>
            </nav>
            
            {/* Profile Button with Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                  {getProfileInitials()}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-0">
                <div className="px-4 py-2 border-b">
                  <div className="font-medium">{getNameFromEmail()}</div>
                  <div className="text-xs text-gray-500">{mockUser.email}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Log out
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Input 
            placeholder="Search (should be a live filter searching on Dataset Name and dataset description)" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            className="md:col-span-2"
          />
          <Select onValueChange={handleDomainChange}>
            <SelectTrigger>
              <SelectValue placeholder="Domain (Dropdown)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {Object.keys(domainColors).map((domainName) => (
                <SelectItem key={domainName} value={domainName}>{domainName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setMinCleanliness(Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Cleanliness (Dropdown)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any</SelectItem>
              <SelectItem value="0.9">90%+</SelectItem>
              <SelectItem value="0.95">95%+</SelectItem>
              <SelectItem value="0.99">99%+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Dataset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((dataset) => {
            const domainConfig = domainColors[dataset.domain as keyof typeof domainColors] || domainColors.Chemistry;
            const difficultyClass = difficultyClasses[dataset.cleanliness as keyof typeof difficultyClasses] || difficultyClasses.Medium;
            const IconComponent = domainConfig.IconComponent;
            
            return (
              <div 
                key={dataset.id}
                className={`border rounded-lg p-4 ${domainConfig.bg} ${domainConfig.hover} cursor-pointer transition-colors duration-200 h-64 flex flex-col`}
                onClick={() => openDatasetModal(dataset)}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-8 h-8 ${domainConfig.icon} rounded-full flex items-center justify-center mr-2`}>
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold">{dataset.name}</h2>
                </div>
                <p className="text-gray-600 mb-4 text-sm overflow-hidden line-clamp-3">{dataset.description}</p>
                <div className="mb-2 text-sm">
                  <strong>Domain:</strong> {dataset.domain}
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <Button 
                    variant="default" 
                    className={`text-xs px-3 py-1 h-auto text-white ${difficultyClass}`}
                  >
                    {dataset.cleanliness}
                  </Button>
                  <Button variant="outline" className="text-xs px-3 py-1 h-auto">Link</Button>
                  <Button variant="ghost" size="sm" className="p-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 15A7 7 0 108 1a7 7 0 000 14z" stroke="currentColor" />
                      <path d="M8 11V7.5M8 5V4.5" stroke="currentColor" strokeLinecap="round" />
                    </svg>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </main>
      
      {/* Dataset Detail Modal */}
      {selectedDataset && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center">
                {/* Display the domain icon in the modal header */}
                {(() => {
                  const domainConfig = domainColors[selectedDataset.domain as keyof typeof domainColors] || domainColors.Chemistry;
                  const IconComponent = domainConfig.IconComponent;
                  return (
                    <div className={`w-8 h-8 ${domainConfig.icon} rounded-full flex items-center justify-center mr-3`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                  );
                })()}
                {selectedDataset.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 gap-4 py-4">
              <div className="rounded-lg p-4 border">
                <h3 className="font-semibold mb-2">Dataset Description:</h3>
                <p>{selectedDataset.fullDescription || selectedDataset.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Domain:</h3>
                  <p>{selectedDataset.domain}</p>
                </div>
                
                <div className="rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Cleanliness:</h3>
                  <p>{selectedDataset.cleanliness}</p>
                </div>
                
                <div className="rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Link:</h3>
                  <Button variant="outline" className="px-3 py-1">Open Dataset</Button>
                </div>
              </div>
              
              <div className="rounded-lg p-4 border">
                <h3 className="font-semibold mb-2">Sample Project Ideas:</h3>
                <p>{selectedDataset.sampleProject}</p>
              </div>
              
              <div className="rounded-lg p-4 border">
                <h3 className="font-semibold mb-2">Types of Models:</h3>
                <p>{selectedDataset.types}</p>
              </div>
              
              <div className="rounded-lg p-4 border">
                <h3 className="font-semibold mb-2">Supplemental Information:</h3>
                <p>{selectedDataset.supplementalInfo}</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Note at bottom of page */}
      <div className="text-xs text-gray-500 p-2 border-t">
        Click on any dataset card to view more detailed information.
      </div>
    </div>
  )
}