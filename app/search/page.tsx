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
  "tiny": { min: 1, max: 100, label: "Very Small (1-100)" },
  "small": { min: 101, max: 1000, label: "Small (101-1K)" },
  "medium": { min: 1001, max: 10000, label: "Medium (1K-10K)" },
  "large": { min: 10001, max: 100000, label: "Large (10K-100K)" },
  "very_large": { min: 100001, max: 1000000, label: "Very Large (100K-1M)" },
  "massive": { min: 1000000, max: Infinity, label: "Massive (1M+)" }
}

// Helper function to parse size string and get range values
const getSizeRange = (size: string): { min: number; max: number } => {
  if (size === "1M+") {
    return { min: 1000000, max: Infinity };
  }
  
  const [minStr, maxStr] = size.split("-");
  const min = parseInt(minStr.replace(/[^0-9]/g, ""));
  const max = parseInt(maxStr.replace(/[^0-9]/g, ""));
  return { min, max };
}

// Helper function to check if a dataset size falls within a range
const isInSizeRange = (datasetSize: string, range: keyof typeof sizeRanges) => {
  const sizeRange = getSizeRange(datasetSize);
  const targetRange = sizeRanges[range];
  
  // Check if the ranges overlap
  return sizeRange.min <= targetRange.max && sizeRange.max >= targetRange.min;
}

export default function SearchPage() {
  const router = useRouter()
  const [selectedPrimaryDomain, setSelectedPrimaryDomain] = useState<string | null>(null)
  const [selectedSecondaryDomain, setSelectedSecondaryDomain] = useState<string | null>(null)
  const [selectedCleanliness, setSelectedCleanliness] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  
  // New state to track if filters have been applied
  const filtersApplied = selectedPrimaryDomain !== null || 
                       selectedSecondaryDomain !== null || 
                       selectedCleanliness !== null || 
                       selectedSize !== null
  
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

  // Filter datasets based on selected domains, cleanliness, and size
  const filteredDatasets = datasets.filter(dataset => {
    // Split the dataset domain by commas to get all domains in this dataset
    const datasetDomains = dataset.domain.split(/,\s*/).map(d => d.trim());
    
    // Check if the primary domain matches any of the dataset domains
    const matchesPrimaryDomain = !selectedPrimaryDomain || selectedPrimaryDomain === "all" || 
      datasetDomains.some(d => d === selectedPrimaryDomain);
    
    // If secondary domain is selected, check if it matches any of the dataset domains
    const matchesSecondaryDomain = !selectedSecondaryDomain || selectedSecondaryDomain === "all" || 
      datasetDomains.some(d => d === selectedSecondaryDomain);
    
    const matchesCleanliness = !selectedCleanliness || selectedCleanliness === "all" || 
      cleanlinessDisplayText[dataset.cleanliness] === selectedCleanliness;

    const matchesSize = !selectedSize || selectedSize === "all" || 
      isInSizeRange(dataset.size, selectedSize as keyof typeof sizeRanges);

    return matchesPrimaryDomain && matchesSecondaryDomain && matchesCleanliness && matchesSize;
  })

  // Get unique domains from datasets - extract all single domains for the filters
  const allDomains = Array.from(new Set(
    datasets.flatMap(d => {
      // Split domain string only by commas, not by ampersands
      // This ensures "Arts & Culture" stays as one domain but "Engineering, Education" becomes two
      return d.domain.split(/,\s*/).map(domain => domain.trim());
    })
  )).sort();

  // Get available secondary domains that are paired with the selected primary domain
  const getAvailableSecondaryDomains = (primaryDomain: string | null) => {
    if (!primaryDomain || primaryDomain === "all") return allDomains;
    
    // Find all datasets that include the primary domain
    const relevantDatasets = datasets.filter(dataset => {
      const datasetDomains = dataset.domain.split(/,\s*/).map(d => d.trim());
      return datasetDomains.some(d => d === primaryDomain);
    });
    
    // Extract all domains that appear with the primary domain in these datasets
    const secondaryDomains = Array.from(new Set(
      relevantDatasets.flatMap(dataset => {
        const datasetDomains = dataset.domain.split(/,\s*/).map(d => d.trim());
        // Filter out the primary domain itself
        return datasetDomains.filter(d => d !== primaryDomain);
      })
    )).sort();
    
    return secondaryDomains;
  };
  
  // Get available secondary domains based on current primary selection
  const availableSecondaryDomains = getAvailableSecondaryDomains(selectedPrimaryDomain);

  // Get unique cleanliness values and sizes from datasets matching the domain filters
  const domainsFilteredDatasets = datasets.filter(dataset => {
    // Split the dataset domain by commas to get all domains
    const datasetDomains = dataset.domain.split(/,\s*/).map(d => d.trim());
    
    // Check primary domain if selected
    const matchesPrimaryDomain = !selectedPrimaryDomain || selectedPrimaryDomain === "all" || 
      datasetDomains.some(d => d === selectedPrimaryDomain);
      
    // Check secondary domain if selected
    const matchesSecondaryDomain = !selectedSecondaryDomain || selectedSecondaryDomain === "all" || 
      datasetDomains.some(d => d === selectedSecondaryDomain);
    
    // Return true if both domain conditions are met
    return matchesPrimaryDomain && matchesSecondaryDomain;
  });
  
  const availableCleanliness = Array.from(new Set(domainsFilteredDatasets.map(d => cleanlinessDisplayText[d.cleanliness]))).sort();
  const availableSizes = Array.from(new Set(
    domainsFilteredDatasets.map(d => {
      // Determine which size category this dataset belongs to
      for (const [key, range] of Object.entries(sizeRanges)) {
        if (isInSizeRange(d.size, key as keyof typeof sizeRanges)) {
          return key;
        }
      }
      return null;
    }).filter(Boolean) // Remove null values
  )) as string[];

  const handlePrimaryDomainChange = (value: string) => {
    setSelectedPrimaryDomain(value === "all" ? null : value);
    // Reset secondary domain, cleanliness and size when primary domain changes
    setSelectedSecondaryDomain(null);
    setSelectedCleanliness(null);
    setSelectedSize(null);
  };

  const handleSecondaryDomainChange = (value: string) => {
    setSelectedSecondaryDomain(value === "all" ? null : value);
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
      
      // Try to split by common separators
      const parts = name.split(/[._-]/);
      
      if (parts.length > 1) {
        // If we have multiple parts (e.g., "john.doe"), use first letter of each
        return (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        // For single words (e.g., "greenpan"), try to find word boundaries
        const matches = name.match(/[A-Z]|[0-9]|\b[a-z]/g);
        if (matches && matches.length > 1) {
          // If we found multiple word starts, use first two
          return (matches[0] + (matches[1] || '')).toUpperCase();
        } else {
          // Fallback: use first two letters
          return name.substring(0, 2).toUpperCase();
        }
      }
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

  // Get datasets to display, limited to 8 if no filters applied
  const datasetsToDisplay = filtersApplied 
    ? filteredDatasets 
    : filteredDatasets.slice(0, 8);

  return (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      {/* Navigation Bar */}
      <header className="border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="flex justify-center">
              <Link 
                href="/search"
                onClick={() => {
                  // Reset all filters
                  setSelectedPrimaryDomain(null);
                  setSelectedSecondaryDomain(null);
                  setSelectedCleanliness(null);
                  setSelectedSize(null);
                }}
                className="cursor-pointer"
              >
                <img 
                  src="/updated+logo+3.15.24-2.png" 
                  alt="INSPIRIT AI Logo" 
                  className="h-13 w-48 mr-2"
                />
              </Link>
            </div>
            <h1 className="ml-8 text-xl font-semibold">Dataset Search Tool</h1>
          </div>
          
          <div className="flex items-center">
            <nav className="mr-6">
              <ul className="flex space-x-6">
                <li>
                  <Link 
                    href="/search"
                    className="px-3 py-2 border-b-2 border-indigo-600 font-medium"
                  >
                    Curated Datasets
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/external"
                    className="px-3 py-2"
                  >
                    External Databases
                  </Link>
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
                  Log Out
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Select value={selectedPrimaryDomain || "all"} onValueChange={handlePrimaryDomainChange}>
            <SelectTrigger>
              <SelectValue placeholder="Primary Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {allDomains.map((domain) => (
                <SelectItem key={domain} value={domain}>{domain}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedSecondaryDomain || "all"} 
            onValueChange={handleSecondaryDomainChange}
            disabled={!selectedPrimaryDomain || selectedPrimaryDomain === "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Secondary Domain (Optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Secondary Domain (optional)</SelectItem>
              {availableSecondaryDomains.map((domain) => (
                <SelectItem key={domain} value={domain}>{domain}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedCleanliness || "all"} 
            onValueChange={handleCleanlinessChange}
            disabled={!selectedPrimaryDomain || selectedPrimaryDomain === "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Data Quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Data Qualities</SelectItem>
              {availableCleanliness.map(quality => (
                <SelectItem key={quality} value={quality}>{quality}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedSize || "all"} 
            onValueChange={handleSizeChange}
            disabled={!selectedPrimaryDomain || selectedPrimaryDomain === "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dataset Sizes</SelectItem>
              {availableSizes.map(size => (
                <SelectItem key={size} value={size}>{sizeRanges[size as keyof typeof sizeRanges].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200 my-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-500"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <p className="text-sm text-blue-700">
            Click on any dataset card to view more detailed information.
          </p>
        </div>
        
        {/* Dataset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              Loading datasets...
            </div>
          ) : datasetsToDisplay.length > 0 ? datasetsToDisplay.map((dataset) => {
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
          }) : (
            <div className="col-span-full text-center py-8">
              No datasets match your filters. Try adjusting your search criteria.
            </div>
          )}
          
          {!filtersApplied && datasetsToDisplay.length > 0 && (
            <div className="col-span-full text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Select filters above to explore more datasets</p>
            </div>
          )}
        </div>
      </main>
      
      {/* Dataset Detail Modal */}
      {selectedDataset && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${inter.className}`}>
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl font-bold flex items-center">
                {/* Display the domain icon in the modal header */}
                {(() => {
                  const domainConfig = domainColors[selectedDataset.domain as keyof typeof domainColors] || domainColors.Chemistry;
                  const IconComponent = domainConfig.IconComponent;
                  return (
                    <div className={`w-10 h-10 ${domainConfig.icon} rounded-full flex items-center justify-center mr-4`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                  );
                })()}
                <span className="text-2xl font-bold tracking-tight">{selectedDataset.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 gap-4 py-6">
              <div className="rounded-lg p-4 border">
                <h3 className="font-semibold text-base mb-2 text-gray-700">Dataset Description:</h3>
                <p className="text-gray-800">{selectedDataset.description || selectedDataset.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg p-4 border">
                  <h3 className="font-semibold text-base mb-2 text-gray-700">Domain:</h3>
                  <p className="text-gray-800">{selectedDataset.domain}</p>
                </div>
                
                <div className="rounded-lg p-4 border">
                  <h3 className="font-semibold text-base mb-2 text-gray-700">Cleanliness:</h3>
                  <p className={`inline-block px-3 py-1 rounded ${difficultyClasses[selectedDataset.cleanliness as keyof typeof difficultyClasses] || difficultyClasses["⚠️ Messy/Complex"]}`}>
                    {selectedDataset.cleanliness}
                  </p>
                </div>
                
                <div className="rounded-lg p-4 border">
                  <h3 className="font-semibold text-base mb-2 text-gray-700">Link:</h3>
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
                {selectedDataset.dataType && (() => {
                  // Helper function to check if content is empty
                  const hasContent = (value: any): boolean => {
                    if (typeof value === 'string') return value.trim() !== '';
                    if (Array.isArray(value)) return value.length > 0;
                    return false;
                  };
                  
                  return hasContent(selectedDataset.dataType) && (
                    <div className="rounded-lg p-4 border">
                      <h3 className="font-semibold text-base mb-2 text-gray-700">Data Type:</h3>
                      <p className="text-gray-800">{selectedDataset.dataType}</p>
                    </div>
                  );
                })()}
                
                {selectedDataset.size && selectedDataset.size.trim() && (
                  <div className="rounded-lg p-4 border">
                    <h3 className="font-semibold text-base mb-2 text-gray-700">Size:</h3>
                    <p className="text-gray-800">{selectedDataset.size}</p>
                  </div>
                )}
              </div>
              
              {selectedDataset.sampleProject && selectedDataset.sampleProject.trim() && (
                <div className="rounded-lg p-4 border">
                  <h3 className="font-semibold text-base mb-2 text-gray-700">Sample Project Ideas:</h3>
                  <p className="text-gray-800">{selectedDataset.sampleProject}</p>
                </div>
              )}
              
              {/* Types of Models section */}
              {selectedDataset.types && (() => {
                // Helper function to check if content is empty
                const hasContent = (value: any): boolean => {
                  if (typeof value === 'string') return value.trim() !== '';
                  if (Array.isArray(value)) return value.length > 0;
                  return false;
                };
                
                return hasContent(selectedDataset.types) && (
                  <div className="rounded-lg p-4 border">
                    <h3 className="font-semibold text-base mb-2 text-gray-700">Types of Models:</h3>
                    <p className="text-gray-800">
                      {typeof selectedDataset.types === 'string' 
                        ? selectedDataset.types 
                        : Array.isArray(selectedDataset.types) 
                          ? selectedDataset.types.join(', ') 
                          : ''}
                    </p>
                  </div>
                );
              })()}
              
              {selectedDataset.supplementalInfo && selectedDataset.supplementalInfo.trim() && (
                <div className="rounded-lg p-4 border">
                  <h3 className="font-semibold text-base mb-2 text-gray-700">Supplemental Information:</h3>
                  <p className="text-gray-800">{selectedDataset.supplementalInfo}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setIsModalOpen(false)} className="px-6">Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}