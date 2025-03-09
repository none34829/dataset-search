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
    name: "Last.FM User Listening Dataset",
    domain: "Music",
    description: "Comprehensive profiles of users' music tastes with artist, track, album data and timestamps from January 2021.",
    cleanliness: "Medium",
    sampleProject: "Build a music recommendation system based on listening patterns and user preferences.",
    types: "Username, artist names, track names, album names, listening dates and timestamps.",
    supplementalInfo: "Can be combined with artist metadata for enhanced analysis and music similarity assessment.",
    fullDescription: "This extensive music dataset contains detailed profiles of users' listening habits captured from Last.FM. It includes usernames, artist names, track names, album information, and precise timestamps from January 1-31, 2021. The dataset is ideal for building recommendation engines, analyzing music taste patterns, and studying temporal aspects of music consumption. With over 100,000 entries, it provides sufficient data for robust machine learning models while requiring some preprocessing to handle inconsistencies in artist and track naming conventions.",
    link: "https://www.kaggle.com/datasets/harshal19t/lastfm-dataset"
  },
  {
    id: "2",
    name: "Spotify Million Playlist Challenge",
    domain: "Music",
    description: "World's largest public dataset of music playlists featuring 1 million playlists with over 2 million unique tracks by nearly 300,000 artists.",
    cleanliness: "Easy",
    sampleProject: "Develop an intelligent track recommender system or create a playlist name generator based on content patterns.",
    types: "Playlist metadata, song data, artist information, and user curation patterns.",
    supplementalInfo: "Dataset created specifically for research in music information retrieval and recommendation systems.",
    fullDescription: "The Spotify Million Playlist Dataset Challenge provides an unprecedented collection of 1 million music playlists containing over 2 million unique tracks by nearly 300,000 artists. This dataset represents the largest public collection of music playlists in the world and was created specifically for advancing research in music recommendation systems. Each playlist includes metadata about included tracks, sequencing, and descriptive titles, making it ideal for projects involving sequence modeling, content recommendation, and natural language processing applications related to music.",
    link: "https://www.aicrowd.com/challenges/spotify-million-playlist-dataset-challenge"
  },
  {
    id: "3",
    name: "FAANG Complete Stock Data",
    domain: "Economics",
    description: "Comprehensive historical stock data for Facebook, Apple, Amazon, Netflix, and Google from their IPO dates to present.",
    cleanliness: "Easy",
    sampleProject: "Predict future stock trends or analyze how major world events impact tech company valuations.",
    types: "Daily open/close prices, highs, lows, volume, and adjusted values for each company.",
    supplementalInfo: "Can be correlated with major world events datasets for contextual analysis.",
    fullDescription: "This meticulously maintained financial dataset contains complete historical stock data for the FAANG companies (Facebook/Meta, Apple, Amazon, Netflix, and Google/Alphabet) from their initial public offerings to the present day. Each entry includes daily opening and closing prices, daily highs and lows, trading volume, and adjusted values accounting for splits and dividends. The data is exceptionally clean and ready for immediate use in financial modeling, trend analysis, or correlation studies with external factors such as market indices, economic indicators, or global events.",
    link: "https://www.kaggle.com/datasets/aayushmishra1512/faang-complete-stock-data"
  },
  {
    id: "4",
    name: "National Bridge Inventory",
    domain: "Engineering",
    description: "Detailed information on more than 615,000 bridges across the United States, including structural details and condition assessments.",
    cleanliness: "Difficult",
    sampleProject: "Analyze bridge improvement patterns over time or predict maintenance needs based on structural factors.",
    types: "Location data, bridge classifications, condition ratings, structural details, and maintenance history.",
    supplementalInfo: "Includes data from state transportation departments and federal inspections.",
    fullDescription: "The National Bridge Inventory is a comprehensive database containing detailed information on more than 615,000 bridges throughout the United States. Each bridge entry includes precise geospatial coordinates, structural specifications, classification details, condition ratings from professional inspections, construction and maintenance dates, and traffic data. This dataset is valuable for civil engineering analysis, infrastructure planning, and safety assessments, though it requires significant preprocessing due to its complex structure and occasional inconsistencies in reporting standards across different states and jurisdictions.",
    link: "https://www.fhwa.dot.gov/bridge/nbi.cfm"
  },
  {
    id: "5",
    name: "The Metropolitan Museum of Art Collection",
    domain: "Arts",
    description: "Public data spanning 5,000 years of global art history featuring complete metadata on the Met's extensive collection.",
    cleanliness: "Critical",
    sampleProject: "Create an art style classifier or develop a generator for period-appropriate artwork descriptions.",
    types: "Artist information, time periods, mediums, dimensions, provenance data, and high-resolution image URLs.",
    supplementalInfo: "Includes curatorial notes and historical context for major pieces.",
    fullDescription: "This extensive arts dataset provides complete access to The Metropolitan Museum of Art's vast collection spanning 5,000 years of global art history. Each entry contains rich metadata including artist information, historical period classification, medium descriptions, precise physical dimensions, geographical origin, provenance history, and URLs to high-resolution images when available. The dataset presents significant challenges due to its size (over 100,000 items), inconsistent formatting across different collection departments, multilingual text entries, and complex historical attributions. However, it offers unparalleled opportunities for art historical analysis, style classification, and cultural pattern recognition.",
    link: "https://github.com/metmuseum/openaccess"
  },
  {
    id: "6",
    name: "Global Power Plant Database",
    domain: "Environment",
    description: "Comprehensive open-source database of power plants worldwide with detailed information on energy production and environmental impact.",
    cleanliness: "Medium",
    sampleProject: "Develop a plant type recommender based on environmental factors or analyze correlation between plant types and local environmental metrics.",
    types: "Plant types, energy capacity, generation statistics, ownership structure, and fuel type classifications.",
    supplementalInfo: "Can be integrated with climate and emissions data for impact assessment.",
    fullDescription: "The Global Power Plant Database is a comprehensive, open-source collection of detailed information on power generation facilities worldwide. It categorizes plants by type (coal, gas, oil, nuclear, biomass, waste, geothermal, hydro, wind, solar), and includes data on generation capacity, actual production, ownership structures, and specific fuel types. With over 10,000 entries covering major power facilities globally, this dataset enables analysis of energy production patterns, transition to renewable sources, and environmental impact assessments. The data requires some preprocessing to harmonize reporting standards across different countries but is generally well-structured and reliable.",
    link: "https://datasets.wri.org/dataset/globalpowerplantdatabase"
  },
  {
    id: "7",
    name: "OpenMic Multi-Instrument Recognition",
    domain: "Computer Science",
    description: "Dataset for researching multi-instrument recognition in polyphonic music recordings, a fundamental problem in music information retrieval.",
    cleanliness: "Difficult",
    sampleProject: "Develop an AI system that can identify multiple instruments playing simultaneously in complex audio recordings.",
    types: "10-second audio snippets, VGGish features as JSON objects, aggregated labels, and track metadata.",
    supplementalInfo: "Includes anonymized individual responses from human annotators to establish ground truth.",
    fullDescription: "OpenMic is a specialized dataset created for addressing the challenge of multi-instrument recognition in polyphonic music recordings. It contains thousands of 10-second audio snippets, each professionally annotated for the presence of multiple instruments. The data includes raw audio files, pre-extracted VGGish audio features, aggregated instrument labels, and detailed track metadata including licensing information. This dataset is particularly valuable for developing machine learning models for audio signal processing, though it requires significant domain expertise to utilize effectively due to its complex structure and specialized audio feature representations.",
    link: "https://github.com/cosmir/openmic-2018"
  },
  {
    id: "8",
    name: "TikTok Dance Video Dataset",
    domain: "Computer Science",
    description: "Frame-by-frame images of social media dance videos scraped from TikTok, including masks and dense pose information.",
    cleanliness: "Critical",
    sampleProject: "Create a dance move classifier or develop an AI system that can identify and categorize choreographic sequences.",
    types: "Raw video frames, segmentation masks, dense pose images, and corresponding video links.",
    supplementalInfo: "Includes temporal metadata for synchronization analysis.",
    fullDescription: "This innovative dataset contains frame-by-frame extractions from TikTok dance videos, providing researchers with rich visual data for computer vision applications in human movement analysis. Each sample includes raw image frames, precisely generated segmentation masks, dense pose representations that map 2D images to 3D body models, and links to the original videos. With over 100,000 annotated frames, this dataset enables research in dance move recognition, choreographic pattern analysis, and human pose estimation. The data requires substantial preprocessing due to its multi-modal nature and the complexity of the pose information, making it suitable for advanced computer vision projects.",
    link: "https://www.kaggle.com/datasets/amritpal333/tiktokers-dance-dataset-dance-classification"
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
                <div className="mb-2 text-sm">
                  <strong>Domain:</strong> {dataset.domain}
                </div>
                <div className="mb-2 text-sm">
                <strong>Dataset Description:</strong><p className="text-gray-600 mb-4 text-sm overflow-hidden line-clamp-3">{dataset.description}</p>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <Button 
                    variant="default" 
                    className={`text-xs px-3 py-1 h-auto text-white ${difficultyClass}`}
                  >
                    {dataset.cleanliness}
                  </Button>
                  <a 
                    href={dataset.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} // Prevent triggering the card's onClick
                  >
                    <Button variant="outline" className="text-xs px-3 py-1 h-auto">
                      Link <ExternalLink className="h-4 w-4 ml-1" />
                    </Button>
                  </a>
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
                <p>{selectedDataset.description || selectedDataset.description}</p>
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