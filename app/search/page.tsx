"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Dataset } from "@/lib/datasetLoader"
import { loadDatasets } from "@/lib/datasetLoader"
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
  BookText,
  Music,
  Building,
  Gamepad2,
  Newspaper,
  Scale,
  Trophy,
  Languages,
  GraduationCap,
  Brain,
  Telescope,
  Handshake,
  Globe,
  ExternalLink
} from "lucide-react"

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'], display: 'swap' });

interface User {
  type: string;
  email: string;
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
  },
  "Music": { 
    bg: "bg-pink-50", 
    icon: "bg-pink-500", 
    hover: "hover:bg-pink-100",
    IconComponent: Music
  },
  "Arts & Culture": { 
    bg: "bg-fuchsia-50", 
    icon: "bg-fuchsia-500", 
    hover: "hover:bg-fuchsia-100",
    IconComponent: Palette
  },
  "Business & Finance": { 
    bg: "bg-emerald-50", 
    icon: "bg-emerald-500", 
    hover: "hover:bg-emerald-100",
    IconComponent: Building
  },
  "Gaming": { 
    bg: "bg-violet-50", 
    icon: "bg-violet-500", 
    hover: "hover:bg-violet-100",
    IconComponent: Gamepad2
  },
  "Healthcare & Biology": { 
    bg: "bg-rose-50", 
    icon: "bg-rose-500", 
    hover: "hover:bg-rose-100",
    IconComponent: Dna
  },
  "Journalism": { 
    bg: "bg-blue-50", 
    icon: "bg-blue-500", 
    hover: "hover:bg-blue-100",
    IconComponent: Newspaper
  },
  "Humanitarian Efforts & Social Justice": { 
    bg: "bg-teal-50", 
    icon: "bg-teal-500", 
    hover: "hover:bg-teal-100",
    IconComponent: Scale
  },
  "Sports": { 
    bg: "bg-red-50", 
    icon: "bg-red-500", 
    hover: "hover:bg-red-100",
    IconComponent: Trophy
  },
  "Language & Literature": { 
    bg: "bg-yellow-50", 
    icon: "bg-yellow-500", 
    hover: "hover:bg-yellow-100",
    IconComponent: Languages
  },
  "Political Science & Law": { 
    bg: "bg-sky-50", 
    icon: "bg-sky-500", 
    hover: "hover:bg-sky-100",
    IconComponent: Scale
  },
  "Education": { 
    bg: "bg-amber-50", 
    icon: "bg-amber-500", 
    hover: "hover:bg-amber-100",
    IconComponent: GraduationCap
  },
  "Psychology": { 
    bg: "bg-purple-50", 
    icon: "bg-purple-500", 
    hover: "hover:bg-purple-100",
    IconComponent: Brain
  },
  "Physics & Astronomy": { 
    bg: "bg-indigo-50", 
    icon: "bg-indigo-500", 
    hover: "hover:bg-indigo-100",
    IconComponent: Telescope
  },
  "Games": { 
    bg: "bg-violet-50", 
    icon: "bg-violet-500", 
    hover: "hover:bg-violet-100",
    IconComponent: Gamepad2
  },
  "Psychology, Healthcare & Biology": { 
    bg: "bg-rose-50", 
    icon: "bg-rose-500", 
    hover: "hover:bg-rose-100",
    IconComponent: Brain
  },
  "Gaming, Language & Literature": { 
    bg: "bg-yellow-50", 
    icon: "bg-yellow-500", 
    hover: "hover:bg-yellow-100",
    IconComponent: Gamepad2
  },
  "Engineering, Language & Literature": { 
    bg: "bg-orange-50", 
    icon: "bg-orange-500", 
    hover: "hover:bg-orange-100",
    IconComponent: Cog
  },
  "Psychology, Language & Literature": { 
    bg: "bg-purple-50", 
    icon: "bg-purple-500", 
    hover: "hover:bg-purple-100",
    IconComponent: Brain
  },
  "Arts & Culture, Language & Literature": { 
    bg: "bg-fuchsia-50", 
    icon: "bg-fuchsia-500", 
    hover: "hover:bg-fuchsia-100",
    IconComponent: Palette
  },
  "Language & Literature, Journalism": { 
    bg: "bg-yellow-50", 
    icon: "bg-yellow-500", 
    hover: "hover:bg-yellow-100",
    IconComponent: Newspaper
  },
  "Education, Language & Literature": { 
    bg: "bg-amber-50", 
    icon: "bg-amber-500", 
    hover: "hover:bg-amber-100",
    IconComponent: GraduationCap
  },
  "Engineering, Education": { 
    bg: "bg-orange-50", 
    icon: "bg-orange-500", 
    hover: "hover:bg-orange-100",
    IconComponent: Cog
  },
  "Humanitarian Efforts & Social Justice, Education": { 
    bg: "bg-teal-50", 
    icon: "bg-teal-500", 
    hover: "hover:bg-teal-100",
    IconComponent: Handshake
  },
  "Humanitarian Efforts & Social Justice, Political Science & Law": { 
    bg: "bg-teal-50", 
    icon: "bg-teal-500", 
    hover: "hover:bg-teal-100",
    IconComponent: Scale
  },
  "Journalism, Sports": { 
    bg: "bg-blue-50", 
    icon: "bg-blue-500", 
    hover: "hover:bg-blue-100",
    IconComponent: Newspaper
  },
  "Environment, Engineering": { 
    bg: "bg-green-50", 
    icon: "bg-green-500", 
    hover: "hover:bg-green-100",
    IconComponent: Leaf
  },
  "Environment, Chemistry": { 
    bg: "bg-green-50", 
    icon: "bg-green-500", 
    hover: "hover:bg-green-100",
    IconComponent: Beaker
  },
  "Engineering, Language & Literature, Education": {
    bg: "bg-orange-50",
    icon: "bg-orange-500",
    hover: "hover:bg-orange-100",
    IconComponent: Cog
  },
  "Global": {
    bg: "bg-blue-50",
    icon: "bg-blue-500",
    hover: "hover:bg-blue-100",
    IconComponent: Globe
  }
}

// Difficulty indicators
const difficultyClasses: Record<string, string> = {
  "Excellent, ready to use": "bg-green-100 text-green-800 hover:bg-green-200",
  "Great, just needs preprocessing": "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
  "Good, needs to be preprocessed and organized or difficult/atypical data type": "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  "Difficult (noisy, extremely large, significant preprocessing and/or computation)": "bg-red-100 text-red-800 hover:bg-red-200"
}

// Mapping for display text
const cleanlinessDisplayText: Record<string, string> = {
  "Excellent, ready to use": "✅ Ready to use",
  "Great, just needs preprocessing": "✳️ Clean (minor prep)",
  "Good, needs to be preprocessed and organized or difficult/atypical data type": "⚠️ Messy/Complex",
  "Difficult (noisy, extremely large, significant preprocessing and/or computation)": "❌ Difficult/Noisy"
}

// Size range mapping
const sizeRanges = {
  "small": { min: 0, max: 1000, label: "Small (< 1K)" },
  "medium": { min: 1001, max: 10000, label: "Medium (1K-10K)" },
  "large": { min: 10001, max: 100000, label: "Large (10K-100K)" },
  "very_large": { min: 100001, max: Infinity, label: "Very Large (> 100K)" }
}

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [selectedCleanliness, setSelectedCleanliness] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    // Load user info from localStorage
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/') // Redirect to login if no user found
      return
    }
    setUser(JSON.parse(userStr))

    // Load datasets
    async function fetchDatasets() {
      try {
        const loadedDatasets = await loadDatasets()
        setDatasets(loadedDatasets)
      } catch (error) {
        console.error('Error loading datasets:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDatasets()
  }, [router])

  // Helper function to parse size string and get numeric value
  const getSizeValue = (size: string): number => {
    const numericPart = size.match(/\d+/);
    return numericPart ? parseInt(numericPart[0]) : 0;
  }

  // Helper function to check if a dataset size falls within a range
  const isInSizeRange = (datasetSize: string, range: keyof typeof sizeRanges) => {
    const sizeValue = getSizeValue(datasetSize);
    return sizeValue >= sizeRanges[range].min && sizeValue <= sizeRanges[range].max;
  }

  // Filter datasets based on search query, selected domain, cleanliness, and size
  const filteredDatasets = datasets.filter(dataset => {
    const matchesQuery = query === "" || 
      dataset.name.toLowerCase().includes(query.toLowerCase()) ||
      dataset.description.toLowerCase().includes(query.toLowerCase())
    
    const matchesDomain = !selectedDomain || selectedDomain === "all" || dataset.domain === selectedDomain
    
    const matchesCleanliness = !selectedCleanliness || selectedCleanliness === "all" || 
      cleanlinessDisplayText[dataset.cleanliness] === selectedCleanliness

    const matchesSize = !selectedSize || selectedSize === "all" || 
      isInSizeRange(dataset.size, selectedSize as keyof typeof sizeRanges)

    return matchesQuery && matchesDomain && matchesCleanliness && matchesSize
  })

  // Get unique domains from datasets
  const domains = Array.from(new Set(datasets.map(d => d.domain))).sort()

  const handleDomainChange = (value: string) => {
    setSelectedDomain(value === "all" ? null : value);
  };

  const handleCleanlinessChange = (value: string) => {
    setSelectedCleanliness(value === "all" ? null : value);
  };

  const handleSizeChange = (value: string) => {
    setSelectedSize(value === "all" ? null : value);
  };
  
  const openDatasetModal = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setIsModalOpen(true);
  };
  
  // Generate profile initials based on user email
  const getProfileInitials = () => {
    if (!user) return '';
    
    if (user.type === 'mentor') {
      // For mentors: Get initials from email (e.g., john.doe@example.com -> JD)
      const name = user.email.split('@')[0];
      const parts = name.split(/[._]/);
      return parts.length > 1 
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
    } else {
      // For students: First two letters of email
      return user.email.substring(0, 2).toUpperCase();
    }
  };
  
  // Extract name from email for display purposes
  const getNameFromEmail = () => {
    if (!user) return ''
    
    // Extract the part before @ in the email
    const emailName = user.email.split('@')[0];
    
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
    localStorage.removeItem('user')
    router.push('/')
  }
  
  if (!user) {
    return null; // or a loading state
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
                    className={`px-3 py-2 ${!selectedDomain ? "border-b-2 border-indigo-600 font-medium" : ""}`}
                    onClick={() => setSelectedDomain(null)}
                  >
                    Curated Datasets
                  </button>
                </li>
                <li>
                  <button 
                    className="px-3 py-2"
                  >
                    External Databases
                  </button>
                </li>
              </ul>
            </nav>
            
            {/* Profile Button with Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {getProfileInitials()}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-32 p-0" align="end">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Input 
              placeholder="Search" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              className="pr-10"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          <Select value={selectedDomain || "all"} onValueChange={handleDomainChange}>
            <SelectTrigger>
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domains.map((domain) => (
                <SelectItem key={domain} value={domain}>{domain}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCleanliness || "all"} onValueChange={handleCleanlinessChange}>
            <SelectTrigger>
              <SelectValue placeholder="Data Quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Data Qualities</SelectItem>
              <SelectItem value="✅ Ready to use">✅ Ready to use</SelectItem>
              <SelectItem value="✳️ Clean (minor prep)">✳️ Clean (minor prep)</SelectItem>
              <SelectItem value="⚠️ Messy/Complex">⚠️ Messy/Complex</SelectItem>
              <SelectItem value="❌ Difficult/Noisy">❌ Difficult/Noisy</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSize || "all"} onValueChange={handleSizeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Data Sizes</SelectItem>
              <SelectItem value="small">{sizeRanges.small.label}</SelectItem>
              <SelectItem value="medium">{sizeRanges.medium.label}</SelectItem>
              <SelectItem value="large">{sizeRanges.large.label}</SelectItem>
              <SelectItem value="very_large">{sizeRanges.very_large.label}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Dataset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              Loading datasets...
            </div>
          ) : filteredDatasets.map((dataset) => {
            const domainConfig = domainColors[dataset.domain as keyof typeof domainColors] || domainColors.Chemistry;
            const difficultyClass = difficultyClasses[dataset.cleanliness as keyof typeof difficultyClasses] || difficultyClasses["⚠️ Messy/Complex"];
            const IconComponent = domainConfig.IconComponent;
            
            return (
              <div 
                key={dataset.name}
                className={`border rounded-lg p-4 ${domainConfig.bg} ${domainConfig.hover} cursor-pointer transition-colors duration-200 h-64 flex flex-col`}
                onClick={() => openDatasetModal(dataset)}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-8 h-8 ${domainConfig.icon} rounded-full flex items-center justify-center mr-2`}>
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold truncate">{dataset.name}</h2>
                </div>
                <div className="mb-2 text-sm">
                  <strong>Domain:</strong> {dataset.domain}
                </div>
                <div className="mb-2 text-sm">
                  <strong>Dataset Description:</strong>
                  <p className="text-gray-600 mb-4 text-sm overflow-hidden line-clamp-3">{dataset.description}</p>
                </div>
                <div className="mt-auto flex items-center justify-between flex-wrap gap-2">
                  <Button 
                    variant="default" 
                    className={`text-xs px-3 py-1 h-auto text-white ${difficultyClass} break-all`}
                  >
                    {cleanlinessDisplayText[dataset.cleanliness] || dataset.cleanliness}
                  </Button>
                  <a 
                    href={dataset.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} 
                  >
                    <Button variant="outline" className="text-xs px-3 py-1 h-auto">
                      Link <ExternalLink className="h-4 w-4 ml-1" />
                    </Button>
                  </a>
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
                <p>{selectedDataset.description || selectedDataset.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Domain:</h3>
                  <p>{selectedDataset.domain}</p>
                </div>
                
                <div className="rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Cleanliness:</h3>
                  <p className={`inline-block px-2 py-1 rounded ${difficultyClasses[selectedDataset.cleanliness as keyof typeof difficultyClasses] || difficultyClasses["⚠️ Messy/Complex"]}`}>
                    {selectedDataset.cleanliness}
                  </p>
                </div>
                
                <div className="rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Link:</h3>
                  <a 
                    href={selectedDataset.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="px-3 py-1 flex items-center">
                      Open Dataset <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Data Type:</h3>
                  <p>{selectedDataset.dataType}</p>
                </div>
                
                <div className="rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Size:</h3>
                  <p>{selectedDataset.size}</p>
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